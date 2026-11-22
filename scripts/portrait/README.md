# Retrato de la escena (forma 5)

Las dos imágenes de `src/assets/portrait/` salen de una sola foto (docs/04-escena/formas.md → «Retrato»). No forman
parte del build: se pasan a mano cuando cambia la foto, con Python 3, `numpy`, `opencv-python` y `onnxruntime`.

1. `python depth.py foto.jpg depth_anything_v2_vitb.onnx salida` → la profundidad (`salida.npy`), con
   [Depth Anything V2 base](https://github.com/fabio-sim/Depth-Anything-ONNX/releases/download/v2.0.0/depth_anything_v2_vitb.onnx).
   El modelo y la foto original no van al repo.
2. `python pack.py foto.jpg salida.npy ../../src/assets/portrait` → `portrait-color.jpg` y `portrait-depth.png`.
3. Si el alto cambia (720 de ancho siempre), cambiarlo en `PORTRAIT_FRAME` (`src/scene/shapes/shapeContract`):
   el generador rechaza otro tamaño. Después, `npm run stills` (la foto fija del capítulo 5).

Los ajustes del holograma (escáner, robot ↔ realista 74 %, relieve 44 %, volumen en los bordes) los eligió Víctor
en la prueba de la sesión 34; están en `PORTRAIT` (`src/scene/shapes/portrait`) y en el shader.
