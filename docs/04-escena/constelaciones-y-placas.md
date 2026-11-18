# Constelaciones y placas

## Constelaciones (capítulo 2)

Las estrellas de las skills **no** son partículas del sistema principal: son un objeto aparte (puntos con un halo
dibujado en el shader, sin textura, + `LineSegments`) que flota sobre el plano de la galaxia (Y entre 0,9 y 1,5) y **no gira** con
ella, para que las etiquetas se lean quietas.

### Regiones (plano X–Z, cámara de la galaxia con encuadre de escritorio)

Hay **4 grupos y 31 estrellas** (ver `docs/01-contenido/habilidades.md`). Cada grupo ocupa una zona del hueco
libre de la pantalla, entre el panel y el raíl, debajo de la barra y por encima del HUD; cada estrella, su fila, con
la etiqueta a la derecha. Las posiciones salen de colocar las etiquetas en pantalla con la cámara de la galaxia
(`m` = 2, escritorio) a 1280×720 y llevarlas a la escena (decidido en F4.3a; la cámara de la versión final no es la
del prototipo, así que sus regiones no servían):

```
   pantalla, 1280×720                         escena (X, Z)
   ┌ panel ┬──────────────┬──────────────────┐
   │       │ web (7)      │ libraries (10)   │   web       x −3,8…−2,0 · z −16,7…−3,5
   │       │              │                  │   libraries x  1,9…7,9  · z −15,8…0,1
   │       ├──────────────┼──────────────┐   │ ← raíl
   │       │ ai (6)       │ tools (8)    │   │   ai        x −5,4…−3,9 · z  2,5…7,2
   │       │              │              │HUD│   tools     x  0,8…4,0  · z  1,9…8,2
   └───────┴──────────────┴──────────────┴───┘
```

Las de arriba quedan lejos de la cámara (z negativo) y las de abajo, cerca: en pantalla miden lo mismo porque el
tamaño de las estrellas no depende de la distancia (F4.3b).

### Reglas de colocación (comprobadas por test)

1. Distancia mínima entre estrellas: **1,2 unidades**.
2. Las etiquetas van a la derecha de su estrella; proyectadas en reposo (m = 2) en 1280×720 y 1440×900, **ningún
   rectángulo de etiqueta se solapa** con otro, con el raíl, el panel, la barra ni el HUD, y todos caben en
   pantalla. Fuera del reposo o de esos tamaños, la escena oculta la que no cabe (ver «Etiquetas»).
3. Las líneas forman una figura reconocible por grupo (web, una rama; libraries, un triángulo con su cadena; tools,
   una cadena cerrada al final; ai, una cometa con su cola), sin cruzarse con otro grupo; en pantalla, ninguna
   línea pasa a menos de 12 px de una estrella que no es suya ni tacha el texto de la etiqueta de otra estrella (las
   de sus dos extremos pueden rozarla: hoy entran menos de 1 px en tres líneas) (en reposo, en los mismos tamaños,
   con el paralaje en sus esquinas).
4. Las coordenadas viven en `scene/config/constellationLayout`, indexadas por `Skill.id`, con las líneas de cada
   figura por pares de ids. Un test falla si una skill del contenido no tiene posición o si sobra una posición sin
   skill.
5. Las estrellas flotan entre Y 0,9 y 1,5.

La regla 2 la comprueba primero el test de `constellationLayout` con la proyección de `scene/math/projection` (la
misma cuenta que la cámara; un test la compara con la de Three) y la caja de la etiqueta (`STAR_LABEL_BOX`: mono de
11 px, 0,6 em por letra, sin mayúsculas ni espacio entre letras, 14 px a la izquierda (trazo de 6 y hueco de 8), 6 a
la derecha, 22 de alto, a 4 px de la estrella), con lo que tapa la interfaz (`STAR_LABEL_KEEP_OUT`: de los tokens
el panel, la barra y el alto del raíl; medidos, el ancho del raíl y el HUD), en inglés y en español, con barra de
scroll clásica y sin ella, y con el paralaje en reposo y en sus cuatro esquinas. El e2e de F4.3c lo mide sobre la
página de verdad (`tests/e2e/constellations.spec.ts`): a 1280×720, 1440×900 y 390×844 las etiquetas visibles no
se pisan ni pisan la barra, el raíl, el HUD o el panel, ni salen del lienzo, y la barra, el raíl, el HUD y el panel
reales caben en `STAR_LABEL_KEEP_OUT` (EN y ES, a 1280×720, 768×1024 y 390×844), en los tres motores del CI. Lo
medido se reserva con holgura: el raíl de escritorio ocupa 154 px desde el borde en Chromium y 154,02 en WebKit (se
reservan 158), y el HUD 247 de ancho en Chromium en local y 251,3 en el del CI (se reservan 256), porque su «≈» y sus
superíndices salen con la mono del sistema.

Las más altas de `web` y `libraries` (de `typescript` y `react-hook-form` hacia arriba) quedan más allá del disco de
la galaxia (radio ~8,35; `html` a 16,8 del centro): flotan sobre el cielo oscuro, por encima de la galaxia en
pantalla, no justo encima de su plano; las demás de esos dos grupos caen dentro del disco. Es lo que da el
hueco libre medido (más cerca pisarían el panel o la barra); en la foto fija de la galaxia se ve bien.

### Estados

| Estado | Estrellas | Líneas | Etiquetas |
|---|---|---|---|
| Reposo | 22 px, opacidad 0,65 · peso | opacidad 0,22 · peso | `--color-dim`, opacidad 0,8 · peso, con halo oscuro |
| Grupo activo | 34 px (×1,55: 0,9 → 1,4), opacidad 1 · peso | opacidad 0,9 · peso | `--color-star` (`data-hot`), opacidad 1 · peso |

«Peso» = presencia del capítulo 2: `clamp(1 − |m − 2| · 1,8, 0, 1)`. La transición entre estados se suaviza a
ritmo `dt · 8`; con movimiento reducido es instantánea. El grupo activo es `uiStore.activeSkillGroup` (lo escriben
el panel y las etiquetas, F4.3c; la escena lo lee en cada frame, sin re-render). Las cifras viven en
`CONSTELLATION_LOOK` (`scene/config/constellationLayout`) y las cuentas en `scene/math/constellations`.

Las etiquetas en reposo van al 0,8 (5,9 : 1 sobre el vacío; al 0,6 del prototipo daban 3,7 : 1) y llevan un halo
oscuro alrededor de las letras (`--halo-star-label`, dos sombras de `--color-void`): así se leen también sobre los
brazos y el núcleo brillante de la galaxia. La diferencia entre reposo y activo la dan el color (gris → ámbar) y el
tamaño de la estrella. Con alto contraste (`forced-colors`), la capa de etiquetas se oculta (la lista es la del
panel).

### En la escena (F4.3b)

- `scene/Constellations`: por grupo, un `Points` (sus estrellas) y un `LineSegments` (sus líneas), con mezcla
  aditiva y sin profundidad, como las partículas. Las estrellas tienen **el mismo tamaño en pantalla a cualquier
  distancia** (las de arriba quedan a z −16): un halo dibujado en el shader (núcleo `constellationStar`, halo
  `constellationGlow`, el degradado del prototipo sin textura); las líneas, `constellationLine`. Shaders en
  `scene/shaders/constellations/` (un vertex shader para los dos, con `uLine`). No giran con la galaxia ni las mueve
  la gravedad del cursor (no son partículas).
- Las estrellas y las líneas salen en las fotos fijas del modo sin WebGL (en reposo); las etiquetas no (son DOM).

### Etiquetas

- Elementos del DOM (`scene/ConstellationLabels`), uno por skill en el orden del panel, en una capa fija propia
  (`--z-labels`: entre el destello y `main`) montada en `body` con un portal: dentro del envoltorio del lienzo
  quedarían por debajo del destello. Decorativas (`aria-hidden`): el teclado y el lector usan el panel. Desde F4.3c,
  con el capítulo a más de `interactiveFrom` (0,6), las visibles reciben el puntero (`data-live`, solo al cambiar;
  se olvida con lo demás si la capa se desmonta): el ratón encima enciende su grupo y un toque también. Para que
  les llegue, el capítulo de Skills y `main` dejan pasar el ratón y solo el panel lo recoge.
- Sus textos llegan ya traducidos por props (`SceneMount` → `SceneRoot`): la escena solo lee del contenido los ids
  y el orden. Solo en el viaje: en las fichas y la 404, sin etiquetas.
- En cada frame, `CameraRig` deja en el `SceneFrame` su pose y su campo de visión antes que nadie (su `useFrame` va
  con prioridad −1, `CAMERA_RIG_PRIORITY`: no depende de su sitio en el JSX); las constelaciones proyectan cada estrella con ellos (`scene/math/projection`), colocan su etiqueta por
  `transform` y ocultan las que no caben (`scene/math/labelFit`: la que pisa lo que tapa la interfaz,
  `STAR_LABEL_KEEP_OUT`, el borde del lienzo u otra ya visible; manda el orden del panel; una proyección que no da
  un número no se coloca). Solo escriben lo que cambia, y nada con el capítulo lejos. Si la capa se desmonta (una
  ficha) con el capítulo presente, olvidan lo escrito: las etiquetas que nacen al volver, ocultas por su CSS, se
  escriben enteras.
- Sin selección (`user-select: none`: Ctrl+A no las copia).
- Mono de 11 px; por debajo de 900 px, 10 px (`--text-star-label-narrow`, en px a propósito). A 1280×720 y 1440×900 se ven las 31; en anchos
  medios y en móvil, las que caben (a 390×844, unas 13): la lista del panel sigue completa.

## Placas de proyecto (capítulo 3)

### Huecos del caparazón (`config/plateSlots/`)

Celdas de la rejilla hexagonal (coordenadas axiales `q, r`, tamaño 0,95) ordenadas por prioridad. Todas caen en
la parte superior del caparazón.

| Hueco | Celda (q, r) | Etiqueta | Uso |
|---|---|---|---|
| 0 | (0, 0) | 20 | Proyecto `featured` (centro) |
| 1 | (−1, 0) | 21 | 2.º proyecto por `order` |
| 2 | (1, 0) | 22 | 3.º |
| 3 | (0, −1) | 23 | 4.º |
| 4 | (0, 1) | 24 | 5.º |
| 5 | (1, −1) | 25 | 6.º |
| 6 | (−1, 1) | 26 | 7.º |

- Asignación: el `featured` al hueco 0; el resto, por `order`, a los huecos siguientes. Máximo 7 proyectos
  (si hubiera más, solo se muestran los 7 primeros en la tortuga; todos siguen en la lista). Lo hace
  `assignPlates(projects)` (`config/plateSlots`), que recibe los proyectos por parámetro: el worker de las
  formas no carga el contenido.
- Los huecos sin proyecto son celdas normales del caparazón (pueden tener árboles).
- Con 3 proyectos (v1): Chessmate en el centro, AstroHub detrás y Cosmos delante, hacia la cabeza.

### Pins

- Anclados en el centro de la placa, sobre la superficie: `y = AY · √(1 − (x/AX)² − (z/AZ)²) + 0,06`, con el mismo
  balanceo y giro que aplica el shader (la misma función en TypeScript y GLSL; un test compara ambas).
- Proyección 3D→2D en cada frame, aplicada por `transform` a elementos DOM (sin estado de React).
- Visibles con el peso del capítulo 3; interactivos solo con peso > 0,6.

### Resaltado

- `uPlate` = etiqueta del proyecto activo (hover/foco en fila o pin; si no, ciclo automático cada 2,6 s).
- En el shader la placa activa pasa a blanco cálido ×2 con pulso `sin(t · 5)` (sin pulso con movimiento reducido)
  y tamaño +0,7.
