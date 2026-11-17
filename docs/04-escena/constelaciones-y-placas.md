# Constelaciones y placas

## Constelaciones (capítulo 2)

Las estrellas de las skills **no** son partículas del sistema principal: son un objeto aparte (puntos con
textura de halo + `LineSegments`) que flota sobre el plano de la galaxia (Y entre 0,9 y 1,5) y **no gira** con
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
   │       │              │                  │   libraries x  1,9…6,6  · z −15,8…0,1
   │       ├──────────────┼──────────────┐   │ ← raíl
   │       │ ai (6)       │ tools (8)    │   │   ai        x −4,4…−3,0 · z  2,5…7,2
   │       │              │              │HUD│   tools     x  0,8…4,0  · z  1,9…8,2
   └───────┴──────────────┴──────────────┴───┘
```

Las de arriba quedan lejos de la cámara (z negativo) y las de abajo, cerca: en pantalla miden lo mismo porque el
tamaño de las estrellas no depende de la distancia (F4.3b).

### Reglas de colocación (comprobadas por test)

1. Distancia mínima entre estrellas: **1,2 unidades**.
2. Las etiquetas van a la derecha de su estrella; proyectadas en 1280×720 y 1440×900, **ningún rectángulo de
   etiqueta se solapa** con otro, con el raíl, el panel, la barra ni el HUD, y todos caben en pantalla.
3. Las líneas forman una figura reconocible por grupo (cadena, triángulo, rama), sin cruzarse con otro grupo.
4. Las coordenadas viven en `scene/config/constellationLayout`, indexadas por `Skill.id`, con las líneas de cada
   figura por pares de ids. Un test falla si una skill del contenido no tiene posición o si sobra una posición sin
   skill.
5. Las estrellas flotan entre Y 0,9 y 1,5.

La regla 2 la comprueba primero el test de `constellationLayout` con la proyección de `scene/math/projection` (la
misma cuenta que la cámara; un test la compara con la de Three) y la caja de la etiqueta (`STAR_LABEL_BOX`: mono de
11 px, 0,6 em por letra, 14 px a la izquierda para el trazo, 6 a la derecha, 22 de alto), con lo que tapa la
interfaz medido en F4.3a (panel, barra, raíl, HUD), en inglés y en español, con barra de scroll clásica y sin ella, y
con el paralaje en reposo y en sus cuatro esquinas. El e2e de F4.3c lo mide sobre la página de verdad.

### Estados

| Estado | Estrellas | Líneas | Etiquetas |
|---|---|---|---|
| Reposo | tamaño 0,9, opacidad 0,65 · peso | opacidad 0,22 · peso | `--color-dim` |
| Grupo activo | tamaño 1,4, opacidad 1 · peso | opacidad 0,9 · peso | `--color-star` |

«Peso» = presencia del capítulo 2: `clamp(1 − |m − 2| · 1,8, 0, 1)`. La transición entre estados se suaviza a
ritmo `dt · 8`.

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
