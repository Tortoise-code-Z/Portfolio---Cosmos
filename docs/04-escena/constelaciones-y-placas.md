# Constelaciones y placas

## Constelaciones (capítulo 2)

Las estrellas de las skills **no** son partículas del sistema principal: son un objeto aparte (puntos con
textura de halo + `LineSegments`) que flota sobre el plano de la galaxia (Y entre 0,9 y 1,5) y **no gira** con
ella, para que las etiquetas se lean quietas.

### Regiones (plano X–Z, cámara de la galaxia con encuadre de escritorio)

Hay **4 grupos y 31 estrellas** (ver `docs/01-contenido/habilidades.md`). Cada grupo ocupa una región de la
zona libre (fuera del panel y del raíl):

```
          z = −6
   ┌───────────────┬──────────────────┐
   │ web (7)       │ libraries (10)   │
   │ x −4…1        │ x 2…7 · 2 filas  │
   ├───────────────┼──────────────────┤   z ≈ 0
   │ ai (6)        │ tools (8)        │
   │ x −4…0,5      │ x 1,5…6,5        │
   └───────────────┴──────────────────┘
          z = +5,5
```

El grupo `ai` pasó de 4 a 6 estrellas en F2 · paso 2 (las 4 prácticas + Claude y ChatGPT): su región hace sitio
para las 6 en F4.3, con las mismas reglas de colocación.

### Reglas de colocación (comprobadas por test)

1. Distancia mínima entre estrellas: **1,2 unidades**.
2. Las etiquetas van a la derecha de su estrella; proyectadas en 1280×720 y 1440×900, **ningún rectángulo de
   etiqueta se solapa** con otro, con el raíl ni con el panel, y todos caben en pantalla.
3. Las líneas forman una figura reconocible por grupo (cadena, triángulo, rama), sin cruzarse con otro grupo.
4. Las coordenadas viven en `config/constellationLayout.ts`, indexadas por `Skill.id`. Un test falla si una skill
   del contenido no tiene posición o si sobra una posición sin skill.

### Estados

| Estado | Estrellas | Líneas | Etiquetas |
|---|---|---|---|
| Reposo | tamaño 0,9, opacidad 0,65 · peso | opacidad 0,22 · peso | `--color-dim` |
| Grupo activo | tamaño 1,4, opacidad 1 · peso | opacidad 0,9 · peso | `--color-star` |

«Peso» = presencia del capítulo 2: `clamp(1 − |m − 2| · 1,8, 0, 1)`. La transición entre estados se suaviza a
ritmo `dt · 8`.

## Placas de proyecto (capítulo 3)

### Huecos del caparazón (`config/plateSlots.ts`)

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
  (si hubiera más, solo se muestran los 7 primeros en la tortuga; todos siguen en la lista).
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
