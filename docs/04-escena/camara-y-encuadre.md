# Cámara y encuadre

## Keyframes por capítulo

| Capítulo | Posición | Objetivo | Encuadre X en escritorio (`shiftX`) |
|---|---|---|---|
| 0 · Singularidad | (0, 0, 14) | (0, 0, 0) | 0 (centrado) |
| 1 · Nebulosa | (0, 1,5, 15,5) | (0, 0, 0) | −3,4 |
| 2 · Galaxia | (0, 10, 11) | (0, 0, 0) | −3,0 |
| 3 · Tortuga | (4,6, 5,4, 9,4) | (0, 0,6, 0) | −2,2 |
| 4 · Tierra | (0, 1, 10,5) | (0, 0, 0) | −3,2 |

- Entre keyframes: interpolación lineal de posición y objetivo con `t = smoothstep(fract(m))`.
- `shiftX` se suma **a la posición y al objetivo** (desplaza el encuadre sin cambiar el ángulo); lleva la escena
  a la derecha para dejar sitio a los paneles. Solo en escritorio (`≥ --bp-md`).
- Paralaje: posición `+ (puntero.x · 0,7, puntero.y · 0,45)`, suavizado a ritmo `dt · 2`. Desactivado en táctil y
  con movimiento reducido.
- Todas las cifras viven en `config/constants.ts`; se ajustan con capturas reales en los tamaños de referencia.

## Campo de visión

- Vertical 55° en pantallas anchas.
- Si el aspecto es menor que 1,25 (vertical o casi cuadrado), se **conserva el campo horizontal**:
  `fov = 2 · atan(tan(27,5°) · 1,25 / aspecto)`, con tope de 100°. Así la galaxia y la tortuga caben enteras en
  un móvil.
- `near 0,1`, `far 400`.

## Página de proyecto

- Cámara cenital sobre la tortuga, centrada en la placa del proyecto: posición `placa + (0, 3,2, 2,4)`,
  objetivo `placa`. La placa queda en el tercio superior de la pantalla.
- **Vuelo** desde el keyframe 3 a esa vista: 800 ms con `--ease-out`; vuelta inversa al salir.
- Anterior/siguiente: vuelo corto entre las dos vistas de placa.
- Atenuación de la escena al 30 % con un uniform de opacidad global (no con CSS sobre el lienzo, para no
  provocar repintados).
- Movimiento reducido: corte directo a la vista final con fundido.

## Tamaños de referencia para validar el encuadre

1280×720 · 1440×900 · 1920×1080 · 768×1024 · 390×844 · 360×740.
En todos: nada importante bajo el raíl, la tortuga entera, la galaxia legible y la Tierra sin cortar por arriba.
Se comprueban con capturas automáticas de Playwright (ver `rendimiento.md`).
