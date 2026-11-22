"""Las dos imágenes del retrato de la escena. Uso: python pack.py FOTO PROFUNDIDAD.npy CARPETA

Escribe en CARPETA (src/assets/portrait/):
- portrait-color.jpg: la foto a 720 px de ancho.
- portrait-depth.png: R profundidad (3..255; 0 = fondo; 1 y 2 sin usar: margen para el ruido que algunos navegadores
  meten al leer un canvas, PORTRAIT.depthFloor) · G distancia al borde ×16 · B contornos de la foto.
El tamaño (720 × alto) es contrato con la escena: PORTRAIT_FRAME en src/scene/shapes/shapeContract. Ver README.md.
"""
import os
import sys

import cv2
import numpy as np

photo, depth, folder = sys.argv[1:4]
img = cv2.imread(photo)
H, W = img.shape[:2]
d = np.load(depth)
v = (d - d.min()) / (d.max() - d.min())
# La figura: Otsu sobre la profundidad, la pieza más grande, y una erosión que quita el halo del recorte.
_, m = cv2.threshold((v * 255).astype(np.uint8), 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(m)
big = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
m = np.where(lab == big, 255, 0).astype(np.uint8)
m = cv2.erode(m, np.ones((13, 13), np.uint8))
TW = 720
TH = round(H * TW / W)
col = cv2.resize(img, (TW, TH), interpolation=cv2.INTER_AREA)
ms = cv2.resize(m, (TW, TH), interpolation=cv2.INTER_AREA) > 127
ds = cv2.resize(d.astype(np.float32), (TW, TH), interpolation=cv2.INTER_AREA)
# Profundidad suavizada solo dentro de la figura (el fondo no tira del borde).
m32 = ms.astype(np.float32)
num = cv2.GaussianBlur(ds * m32, (0, 0), 1.6)
den = cv2.GaussianBlur(m32, (0, 0), 1.6)
ds = np.where(ms, num / np.maximum(den, 1e-4), ds)
lo, hi = np.percentile(ds[ms], [1, 99.7])
dn = np.clip((ds - lo) / (hi - lo), 0, 1)
dist = cv2.distanceTransform(ms.astype(np.uint8), cv2.DIST_L2, 5)
R = np.where(ms, 3 + np.round(dn * 252), 0).astype(np.uint8)
G = np.clip(dist * 16, 0, 255).astype(np.uint8)
# Contornos de la foto (Sobel), en 8 niveles.
gray = cv2.GaussianBlur(cv2.cvtColor(col, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255, (0, 0), 1.8)
sx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
sy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
mag = np.where(ms, np.sqrt(sx * sx + sy * sy), 0)
mag = np.clip(mag / np.percentile(mag[ms], 97), 0, 1)
mag = np.clip((mag - 0.22) / 0.78, 0, 1) ** 0.9
B = (np.round(mag * 7) / 7 * 255).astype(np.uint8)
cv2.imwrite(os.path.join(folder, 'portrait-depth.png'), cv2.merge([B, G, R]), [cv2.IMWRITE_PNG_COMPRESSION, 9])
cv2.imwrite(os.path.join(folder, 'portrait-color.jpg'), col, [cv2.IMWRITE_JPEG_QUALITY, 88])
print(TW, TH, int(ms.sum()))
