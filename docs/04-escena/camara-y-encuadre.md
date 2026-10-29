# Cámara y encuadre

> Código (F3.4): `src/scene/math/camera` (la pose, el campo de visión y el paralaje, en funciones puras),
> `scene/CameraRig` (los aplica a la cámara del `<Canvas>` en cada frame), `scene/pointer` (el ratón) y las
> cifras en `scene/config/sceneConfig.ts` (`CAMERA_KEYFRAMES`, `CAMERA_LENS`, `CAMERA_FIT`, `PARALLAX`,
> `WIDE_LAYOUT_QUERY`).

## Keyframes por capítulo

| Capítulo | Posición | Objetivo | Encuadre X en escritorio (`shiftX`) |
|---|---|---|---|
| 0 · Singularidad | (0, 0, 14) | (0, 0, 0) | 0 (centrado) |
| 1 · Nebulosa | (0, 1,8, 18,4) | (0, 0, 0) | −3,4 |
| 2 · Galaxia | (0, 12,9, 14,2) | (0, 0, 0) | −4,1 |
| 3 · Tortuga | (4,8, 5,6, 9,9) | (0, 0,6, 0) | −2,6 |
| 4 · Tierra | (0, 1,2, 12,1) | (0, 0, 0) | −3,2 |

- Entre keyframes: interpolación lineal de posición y objetivo con `t = smoothstep(fract(m))`. En `m = 4`, el
  keyframe 4 exacto (sin el `3,999` del prototipo); fuera de 0–4, el capítulo del borde.
- `shiftX` se suma **a la posición y al objetivo** (desplaza el encuadre sin cambiar el ángulo); lleva la escena
  a la derecha para dejar sitio a los paneles. Solo en escritorio: la misma media query que pone los paneles a un
  lado, `(width >= 900px)` (md; los breakpoints no son tokens: `tokens.css` los lista en su cabecera). Un test la
  compara con la de `ChapterPanel.module.css`.
- Paralaje: posición `+ (puntero.x · 0,7, puntero.y · 0,45)`, con el puntero en NDC (−1 a 1; el paralaje lo
  acota ahí, porque arrastrando fuera de la ventana puede pasar de ±1), suavizado a ritmo `min(1, dt · 2)` con el
  tiempo real del frame (`SceneFrame.delta`, que no se congela). Solo con ratón (`pointerType === 'mouse'`,
  evento a evento: en táctil y con lápiz no hay paralaje, también en un portátil con pantalla táctil). Si el
  ratón sale de la ventana (su `pointerout` sin destino; el de un dedo o un lápiz que se levanta no cuenta),
  vuelve al centro al mismo ritmo. Con movimiento reducido, al
  centro de golpe (un corte, no un movimiento) y quieto.
- Todas las cifras viven en `scene/config/sceneConfig.ts`. Las del prototipo se ajustaron en F3.6c con capturas
  en los tamaños de referencia (ver abajo): las cámaras de los capítulos 1–4 se alejan de su objetivo con el mismo
  ángulo (nebulosa ×1,19, galaxia ×1,29, tortuga ×1,05, Tierra ×1,15) y `shiftX` centra cada forma en el hueco
  entre el panel y el raíl. En móvil, como la cámara es la misma y no hay `shiftX`, las formas quedan algo más
  pequeñas: la nebulosa ya no pasa por el raíl y la galaxia lo roza (~3 %; el campo de visión sigue en su tope).

## Campo de visión

- Vertical 55° en pantallas anchas.
- Si el aspecto es menor que 1,25 (vertical o casi cuadrado), se **conserva el campo horizontal**:
  `fov = 2 · atan(tan(27,5°) · 1,25 / aspecto)`, con tope de 100°. Así la galaxia y la tortuga caben enteras en
  un móvil. Los móviles de referencia (390×844, 360×740) llegan al tope, como en el prototipo: allí el campo
  horizontal es algo menor que a 1,25. El tope empieza por debajo de un aspecto ≈ 0,546.
- El campo de visión solo se recalcula cuando cambia el aspecto (`updateProjectionMatrix` no se llama cada frame).
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

- **Cómo se ajustó (F3.6c):** capturas de trabajo de los 5 capítulos en los 6 tamaños, en nivel Bajo y con
  movimiento reducido, cada una dos veces: con la interfaz y sin ella (solo el lienzo), para medir la caja de las
  partículas frente a la del panel y la del raíl. Resultado: en escritorio, ninguna forma bajo el raíl; la galaxia
  aún pasa un poco bajo el panel a 1280 y 1440 (sus brazos tenues, un 3–5 % de lo que se ve), aceptado para que
  siga siendo grande. En móvil, la galaxia roza el raíl (~3 %).
- **Lo que vigila el CI:** las capturas de regresión de dos de esos tamaños, 1440×900 y 390×844
  (`docs/05-tecnico/calidad.md` → «Regresión visual»). Cada cambio de encuadre se acompaña de `npm run
  visual:update` (en Docker) y sus PNG.
