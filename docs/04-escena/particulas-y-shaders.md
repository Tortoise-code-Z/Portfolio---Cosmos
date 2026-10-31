# Partículas y shaders

> Código: `src/scene/Particles/` y `src/scene/BackgroundStars/` (montan; `useParticles` y `useBackgroundStars` se
> prueban sin WebGL), `scene/particleGeometry` (atributos),
> `scene/sceneMaterials` (uniforms y materiales), `scene/shaders/` (los `.glsl`, importados con `?raw`, que
> llegan sin comentarios por el plugin `cosmos:glsl-without-comments` de `vite.config.ts`, y `glslHeader`). Los frames los pide `SceneRoot` con su propio bucle (`rendimiento.md` → «Robustez», ADR-027).

## Atributos (por partícula)

| Atributo | Tipo | Contenido |
|---|---|---|
| `position` | vec3 | Forma 1 · nebulosa (Three exige un `position`; la singularidad se deriva de él) |
| `pGal` | vec3 | Forma 2 · galaxia |
| `pTur` | vec3 | Forma 3 · tortuga |
| `pEar` | vec3 | Forma 4 · Tierra |
| `aR` | vec4 | `x` aleatorio 0–1 (retraso, brillo) · `y` etiqueta de la tortuga · `z` etiqueta de la Tierra · `w` aleatorio 0–1 (tamaño, tono) |

Memoria: 16 floats por partícula → 60.000 partículas ≈ 3,8 MB. La forma 0 (singularidad) no ocupa memoria: es
la dirección de `position` escalada a casi cero.

## Uniforms

| Uniform | Tipo | Origen |
|---|---|---|
| `uM` | float | `m` suavizado por la escena (0–4; `SceneFrame.m`, ADR-028) |
| `uTime` | float | reloj de animación de la escena (`scene/sceneClock`): segundos que avanzan con los frames, como mucho 0,1 s de uno a otro (una pestaña que vuelve no salta) y congelados con movimiento reducido |
| `uCharge` | float | carga de la detonación (0–1) |
| `uPR` | float | pixel ratio efectivo |
| `uPlate` | float | etiqueta de la placa iluminada (0 = ninguna) |
| `uGrav` | float | intensidad de la gravedad del cursor (0 en táctil o movimiento reducido) |
| `uAspect` | float | relación de aspecto |
| `uMouse` | vec2 | puntero en coordenadas NDC (fuera de pantalla = sin efecto) |
| `uMotion` | float | 1 normal · 0 movimiento reducido (anula oscilaciones autónomas) |
| `uExtras` | float | 1 · 0 en Bajo: esconde la estela de la tortuga (alfa 0) y apaga las luces de ciudad |

`uCharge` lo conecta F4.1: la carga del botón del hero (`sceneStore.charge`, copiada en `SceneFrame.charge`) hincha
el punto y lo hace vibrar; con movimiento reducido, `uTime` se congela y la vibración no se mueve (ADR-030).
`uPlate` y `uGrav` (con `uMouse` fuera de la pantalla) se quedan a 0 hasta que los conecte F4 (placas, gravedad). Todos los uniforms se ponen al día en el `useFrame` desde un `SceneFrame`
compartido que rellena el bucle antes de cada frame: ningún objeto nuevo por frame.

## Etiquetas y colores

Ninguna etiqueta ni color se escribe a mano en el GLSL. `scene/shaders/glslHeader` genera una cabecera que se
antepone a cada shader de vértices:
- `#define TURTLE_<PARTE>` y `EARTH_<CAPA>` desde `TURTLE_TAG` y `EARTH_TAG` (`shapes/shapeContract`, el mismo
  contrato que escribe el generador), `TURTLE_FLIPPERS` y el rango de placas `PLATE_FIRST`..`PLATE_LAST` (20..26,
  `config/plateSlots`).
- `const vec3 COLOR_<NOMBRE>` desde `config/scenePalette`, que tiene todos los colores principales del design
  system, cada uno en su papel (lo comprueba su test con la tabla), y los matices del prototipo que la tabla no
  lista (los ojos de la tortuga son `COLOR_TURTLE_EYES` × 2: más brillantes que el blanco).

La cabecera solo va en los shaders de vértices: los de fragmentos no la llevan y no pueden usar sus nombres. Su
test comprueba que todo nombre `TURTLE_*`, `EARTH_*`, `PLATE_*` o `COLOR_*` que usan los shaders de vértices
existe, que los de fragmentos no usan ninguno, y que ni las etiquetas (comparaciones, `abs(tag - …)`, `aR.y`/`aR.z`,
un nombre desplazado más allá del ±0,5 de redondeo) ni los colores (`c = vec3(…)`) llevan números escritos a mano.
Las potencias del GLSL nunca llevan base negativa (indefinido en GLSL ES): `exp(-q * q)` y un `rim` que no baja
de 0. Las placas se comparan con `uPlate` **dentro**
de su rama (`PLATE_FIRST`..`PLATE_LAST`): `uPlate = 0` («ninguna») no casa nunca con la base del caparazón
(etiqueta 0).

## Shader de vértices (estructura)

```glsl
void shape(float k, out vec3 P, out vec3 C, out float S, out float A);  // posición, color, tamaño, alfa de la forma k

void main() {
  float m  = clamp(uM, 0.0, 3.999);
  float k  = floor(m);
  float t  = m - k;
  float tt = smoothstep(0.0, 1.0, clamp((t - aR.x * 0.25) / 0.75, 0.0, 1.0)); // retraso por partícula

  shape(k, PA, CA, SA, AA);
  shape(k + 1.0, PB, CB, SB, AB);

  if (k < 0.5) {            // explosión: salida exponencial + rebasamiento + color incandescente
    P = mix(PA, PB, 1.0 - pow(2.0, -9.0 * tt)) + PB * sin(tt * PI) * 0.55;
    C = mix(WHITE_HOT * 2.2, CB, smoothstep(0.05, 0.85, tt));
  } else {                  // morph normal con dispersión a mitad de camino
    P = mix(PA, PB, tt) + jitter(aR) * sin(tt * PI) * 1.1;
    C = mix(CA, CB, tt);
  }
  // proyección, tamaño con atenuación por distancia (límite 48 px) y gravedad del cursor en espacio de pantalla
}
```

- Solo se evalúan **dos formas** por vértice (la actual y la siguiente).
- Animaciones propias de cada forma dentro de `shape()`: giro lento (nebulosa, galaxia, Tierra), aletas,
  balanceo y estela de la tortuga, iluminación de la Tierra. Las oscilaciones (aletas, balanceo, cabeceo,
  estela) van multiplicadas por `uMotion`; los giros no: se paran porque `uTime` se congela con movimiento
  reducido.

### Gravedad del cursor

En espacio de pantalla, tras proyectar: distancia al puntero corregida por el aspecto, caída gaussiana
(`exp(-d² · 14)`), desplazamiento en remolino (perpendicular · 1,3 + radial · 0,5) · 0,22 y brillo extra
(`color · (1 + f · 1,6)`). No modifica la geometría: es solo visual.

### Colores

Constantes `const vec3` de la cabecera (ver «Etiquetas y colores»), tomadas de la paleta de escena del design
system. Variación por partícula con `aR.x` (brillo 0,7–1,3) y `aR.w` (tono y tamaño).

**Sin gestión de color ni mapeo de tonos** (ADR-027): el lienzo es opaco, se limpia con `--color-void` y va con
`linear` y `flat`; los shaders no incluyen los trozos de Three que convierten el color. La luz se suma tal cual,
como en el prototipo (de ahí los factores > 1 del núcleo y del destello).

El fondo sale de `scene/voidColour` con los números del hex tal cual (`hexToRgb` + `Color.setRGB`), como la
paleta. **No** `new Color(token)`: toma el hex como sRGB y lo linealiza, y con la salida lineal el espacio se
pintaría casi negro. Al recuperar el contexto WebGL, Three rehace su fondo en negro y `SceneRoot` lo vuelve a
poner (`rendimiento.md` → «Robustez»).

### Iluminación de la Tierra

Luz direccional fija `L = normalize(-0.72, 0.30, -0.45)` (la dirección del Sol). Día/noche con `smoothstep` del
producto escalar, franja naranja del amanecer con `exp(-(lam · 4,5)²)`, luces de ciudad en tierra nocturna y
atmósfera con efecto Fresnel según la dirección de la cámara.

## Shader de fragmentos

Disco suave: descarta fuera del radio 0,5 y alfa `pow(1 − 2d, 1.8) · vA`.

## Material

- `ShaderMaterial` con `transparent: true`, `depthWrite: false`, `depthTest: false`,
  `blending: AdditiveBlending`. La suma de luz da el brillo «de galaxia» sin ordenar partículas.
- `frustumCulled = false` en el objeto (las formas ocupan regiones distintas).

## Estrellas de fondo

Objeto aparte (las del nivel: 5.000, 3.500 o 2.000 en una cáscara de radio 70–130,
`shapes/stars`, con la subsemilla `stars`: el mismo cielo en cada visita), titileo por shader (congelado con
movimiento reducido) y visibilidad `smoothstep(0.02, 0.4, m)` (`uVisible`): antes del Big Bang no hay estrellas.

## Mejoras respecto al prototipo

- Los shaders pasan a archivos `.glsl`. Las etiquetas y los colores llegan desde TypeScript (ver «Etiquetas y
  colores») y el morph, el tamaño y la gravedad tienen constantes con nombre; los coeficientes propios de cada
  forma (velocidades de giro, amplitudes de aletas y estela) van junto a su fórmula, en la función de la forma
  (cada `const` más en el GLSL es peso en el chunk de la escena, que va justo; los comentarios no pesan: se
  quitan al compilar).
- `uMotion` para el movimiento reducido (el prototipo solo quitaba la gravedad).
- WebGL2 (Three.js actual ya no soporta WebGL1); sin límite práctico de atributos.
