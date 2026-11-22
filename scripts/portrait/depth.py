"""Profundidad de una foto con Depth Anything V2 (ONNX). Uso: python depth.py FOTO MODELO SALIDA

Modelo base: https://github.com/fabio-sim/Depth-Anything-ONNX/releases/download/v2.0.0/depth_anything_v2_vitb.onnx
Escribe SALIDA.npy (la profundidad tal cual) y SALIDA.png (normalizada, para mirarla). Ver README.md.
"""
import sys

import cv2
import numpy as np
import onnxruntime as ort

photo, model, out = sys.argv[1:4]
img = cv2.imread(photo)[:, :, ::-1].astype(np.float32) / 255
H, W = img.shape[:2]
S = max(H, W)
# Cuadrada con el color del fondo (la esquina de arriba a la izquierda), como pide el modelo.
bg = np.median(img[:40, :40].reshape(-1, 3), 0)
pad = np.ones((S, S, 3), np.float32) * bg
oy, ox = (S - H) // 2, (S - W) // 2
pad[oy:oy + H, ox:ox + W] = img
x = cv2.resize(pad, (518, 518), interpolation=cv2.INTER_CUBIC)
x = (x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
x = x.transpose(2, 0, 1)[None].astype(np.float32)
d = ort.InferenceSession(model).run(None, {'l_x_': x})[0][0]
d = cv2.resize(d, (S, S), interpolation=cv2.INTER_CUBIC)[oy:oy + H, ox:ox + W]
np.save(out + '.npy', d)
v = (d - d.min()) / (d.max() - d.min())
cv2.imwrite(out + '.png', (v * 255).astype(np.uint8))
print(W, H, d.min(), d.max())
