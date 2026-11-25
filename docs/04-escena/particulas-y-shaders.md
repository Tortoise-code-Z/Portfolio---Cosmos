# Partículas y shaders

> Código: `src/scene/Particles/`, `src/scene/BackgroundStars/` y `src/scene/Sun/` (montan; `useParticles` y `useBackgroundStars` se
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
| `pPor` | vec4 | Retrato: posición y, en `w`, su luz. Llega después que las demás (`usePortrait`) y se añade entonces a la geometría; hasta entonces no existe |
| `aR` | vec4 | `x` aleatorio 0–1 (retraso, brillo) · `y` etiqueta de la tortuga · `z` etiqueta de la Tierra · `w` aleatorio 0–1 (tamaño, tono) |

Memoria: 16 floats por partícula → 60.000 partículas ≈ 3,8 MB; con el retrato, 20 (≈ 4,8 MB). La forma 0 (singularidad) no ocupa memoria: es
la dirección de `position` escalada a casi cero.

## Uniforms

| Uniform | Tipo | Origen |
|---|---|---|
| `uM` | float | `m` suavizado por la escena (0–5; `SceneFrame.m`, ADR-028). La forma no sale de aquí: solo lo lee el haz de la llegada del epílogo |
| `uFrom`, `uTo` | float | las dos formas que se mezclan, por su id (`SHAPE`: «Mapa de formas», ADR-041) |
| `uT` | float | cuánto lleva de `uFrom` a `uTo` (0 → 1; 0, quieta en `uFrom`: el shader evalúa una sola forma). En el epílogo se queda en 0,999 (`SHAPE_TRACK_REST`): «Shader de vértices» |
| `uTime` | float | reloj de animación de la escena (`scene/sceneClock`): segundos que avanzan con los frames, como mucho 0,1 s de uno a otro (una pestaña que vuelve no salta) y congelados con movimiento reducido |
| `uCharge` | float | carga de la detonación (0–1) |
| `uPR` | float | pixel ratio efectivo |
| `uPlate` | float | etiqueta de la placa iluminada (0 = ninguna) |
| `uGrav` | float | intensidad de la gravedad del cursor (0–1; 0 en táctil, sin ratón dentro o con movimiento reducido): es lo que la apaga. Sobre la Tierra, a la mitad (`EARTH_GRAVITY`, F4.5) |
| `uAspect` | float | relación de aspecto |
| `uMouse` | vec2 | dónde tira la gravedad, en NDC (el ratón o, al apagarse, el último punto donde estuvo) |
| `uMotion` | float | 1 normal · 0 movimiento reducido (anula oscilaciones autónomas): `motionOf(frame)` de `sceneMaterials`, la misma que usan los pins con el balanceo |
| `uExtras` | float | 1 · 0 en Bajo: esconde la estela de la tortuga (alfa 0) y apaga las luces de ciudad |
| `uPor` | float | 0 hasta que el retrato está en la geometría (`pPor`; el retrato pinta la Tierra); entonces sube a 1 en 0,6 s (`PORTRAIT_FADE_IN_S`, de golpe con movimiento reducido) y la Tierra pasa a retrato |

`uCharge` lo conecta F4.1: la carga del botón del hero (`sceneStore.charge`, copiada en `SceneFrame.charge`) hincha
el punto y lo hace vibrar; con movimiento reducido, `uTime` se congela y la vibración no se mueve (`scene/sceneClock`).
`uGrav` y `uMouse` los conecta F4.2 (la gravedad del cursor, abajo). `uPlate` lo conecta F4.4a: la placa del proyecto
señalado o la del ciclo automático (`SceneFrame.plate`, `constelaciones-y-placas.md` → «Resaltado»); el pulso de la
placa encendida va por `uMotion` (quieto con movimiento reducido). El balanceo de la tortuga (giro y vaivén) usa las
cifras de `TURTLE_SWAY` (`sceneConfig`), que llegan por la cabecera (`TURTLE_SWAY_*`): los pins hacen la misma cuenta
(F4.4b). Todos los uniforms se ponen al día en el `useFrame` desde un `SceneFrame`
compartido que rellena el bucle antes de cada frame: ningún objeto nuevo por frame. F4.5 suaviza `uGrav` sobre la Tierra
(«Gravedad del cursor»).

## Etiquetas y colores

Ninguna etiqueta ni color se escribe a mano en el GLSL. `scene/shaders/glslHeader` genera una cabecera que se
antepone a cada shader de vértices:
- `#define SHAPE_<FORMA>`, el id de cada forma (`SHAPE` de `lib/scroll/shapeTrack`, el de `uFrom`/`uTo`: ADR-041),
  `#define TURTLE_<PARTE>` y `EARTH_<CAPA>` desde `TURTLE_TAG` y `EARTH_TAG` (`shapes/shapeContract`, el mismo
  contrato que escribe el generador), `TURTLE_FLIPPERS`, el rango de placas `PLATE_FIRST`..`PLATE_LAST` (20..26,
  `config/plateSlots`), el balanceo de la tortuga `TURTLE_SWAY_*` (`TURTLE_SWAY` de `sceneConfig`, la misma cuenta que
  los pins), la dirección del Sol `SUN_DIR` (`SUN.position` normalizada: la luz de la Tierra, «Iluminación de la
  Tierra»), la mitad del alto del retrato, `PORTRAIT_HALF_H`, y lo que mide su fundido de abajo, `PORTRAIT_FADE_H`
  (`PORTRAIT_FRAME`), y la llegada del epílogo `ARRIVAL_BASE`, `ARRIVAL_BEAM_START`,
  `ARRIVAL_BEAM_END` y `ARRIVAL_BEAM_REACH` (`EPILOGUE_ARRIVAL` de `lib/scroll/arrival`, ADR-039).
- `const vec3 COLOR_<NOMBRE>` desde `config/scenePalette`, que tiene todos los colores principales del design
  system, cada uno en su papel (lo comprueba su test con la tabla), y los matices del prototipo que la tabla no
  lista (los ojos de la tortuga son `COLOR_TURTLE_EYES` × 2: más brillantes que el blanco).

La cabecera solo va en los shaders de vértices: los de fragmentos no la llevan y no pueden usar sus nombres. Su
test comprueba que define un `SHAPE_*` por forma, que todo nombre `SHAPE_*`, `TURTLE_*` (también `TURTLE_SWAY_*`),
`EARTH_*`, `PLATE_*`, `SUN_*`, `PORTRAIT_*`, `ARRIVAL_*` o `COLOR_*` que usan los shaders de vértices existe, que los
de fragmentos no usan ninguno, y que ni las etiquetas ni los ids (comparaciones, `isTag(…, 4.0)`, `abs(tag - …)`,
`aR.y`/`aR.z`, un nombre desplazado más allá del ±0,5 de redondeo) ni los colores (`c = vec3(…)`) llevan números
escritos a mano.
Las potencias del GLSL nunca llevan base negativa (indefinido en GLSL ES): `exp(-q * q)` y un `rim` que no baja
de 0. Lo vigila el test de la cabecera: solo deja los `pow(` cuya base se sabe ≥ 0 (`rim`, `2.0`, `1.0 - d * 2.0`);
otro, a escribirse como producto. El mismo test comprueba que `shape()` tiene una rama por cada forma de
`SHAPE_TRACK`, cada una por su nombre (`isTag(id, SHAPE_…)`; un id sin rama no pinta nada: tamaño y alfa 0), que la
forma nunca se elige por un número ni por `m` (`uM` solo lo lee el haz de la llegada) y que la segunda forma solo se
evalúa con `uT > 0`. El de `sceneMaterials` comprueba que el mapa de formas tiene una forma por pose de la cámara
(`SHAPE_TRACK`; lo cambiarán las naves) y que los uniforms que declara cada shader son justo los de su
`create*Uniforms()`. Las placas se comparan con `uPlate` **dentro**
de su rama (`PLATE_FIRST`..`PLATE_LAST`): `uPlate = 0` («ninguna») no casa nunca con la base del caparazón
(etiqueta 0).

## Shader de vértices (estructura)

```glsl
void shape(float id, out vec3 P, out vec3 C, out float S, out float A);  // posición, color, tamaño, alfa de la forma id

void main() {
  float tt = smoothstep(0.0, 1.0, clamp((uT - aR.x * 0.25) / 0.75, 0.0, 1.0)); // retraso por partícula

  shape(uFrom, PA, CA, SA, AA);
  if (uT > 0.0) shape(uTo, PB, CB, SB, AB); else PB = PA; …  // quieta: una sola forma

  if (isTag(uFrom, SHAPE_SINGULARITY)) {  // explosión: salida exponencial + rebasamiento + color incandescente
    P = mix(PA, PB, 1.0 - pow(2.0, -9.0 * tt)) + PB * sin(tt * PI) * 0.55;
    C = mix(WHITE_HOT * 2.2, CB, smoothstep(0.05, 0.85, tt));
  } else {                                 // morph normal con dispersión a mitad de camino
    P = mix(PA, PB, tt) + jitter(aR) * sin(tt * PI) * 1.1;
    C = mix(CA, CB, tt);
  }
  // proyección, tamaño con atenuación por distancia (límite 48 px) y gravedad del cursor en espacio de pantalla
}
```

- Solo se evalúan **dos formas** por vértice (`uFrom` y `uTo`), y **una** con la escena quieta en una forma (`uT` 0:
  una condición sobre un uniform, así que la GPU puede saltarse la segunda rama entera; depende del driver). **Salvo
  en el epílogo:** la escena se para en `SHAPE_TRACK_END`, con `uT` 0,999, y quieta evalúa la Tierra y el retrato; y
  mientras sube el retrato (`uPor` < 1), `portrait()` vuelve a evaluar la Tierra (tres evaluaciones). No es nuevo (el
  shader de antes del mapa de formas hacía lo mismo); quitarlo queda para el PR del satélite (`deuda.md`).
- Animaciones propias de cada forma dentro de `shape()`: giro lento (nebulosa, galaxia, Tierra), aletas,
  balanceo y estela de la tortuga, iluminación de la Tierra. Las oscilaciones (aletas, balanceo, cabeceo,
  estela, el pulso de la placa encendida) van multiplicadas por `uMotion`; los giros no: se paran porque `uTime` se congela con movimiento
  reducido.

### Mapa de formas (C.7 · ADR-041)

La escena no deduce la forma de `m`: recibe qué dos formas mezcla y cuánto (`uFrom`, `uTo`, `uT`). Las calcula
`lib/scroll/shapeTrack`, en `updateParticleUniforms`, sin objetos nuevos por frame:
- **`SHAPE`:** un id fijo por forma: 0 singularidad · 1 nebulosa · 2 galaxia · 3 tortuga · 4 Tierra · 5 satélite ·
  6 nave nodriza · 7 retrato. Las naves (`transiciones-naves.md`) aún no se pintan.
- **`SHAPE_TRACK`:** las formas por las que pasa el viaje, en orden. La posición `s` en esta lista es la «`m` de la
  forma»: hoy, una forma por capítulo (y por pose de la cámara), así que `s` sale de `m` (`shapePosition`: la de
  la forma en la llegada del epílogo, `arrivalShapeM`, la misma que la cámara, el Sol y la gravedad) y se para en
  `SHAPE_TRACK_END`, justo antes de la última forma (el último cambio casi entero, como hacía `m` en el shader).
- **`shapeMixAt(s)`:** la forma de `floor(s)`, la siguiente y la fracción.

Así la escena puede ir de una forma a cualquier otra, no solo a la del capítulo siguiente: las naves de las
transmisiones entrarán en `SHAPE_TRACK` entre la nebulosa y la galaxia y entre la tortuga y la Tierra, con su propia
posición en los interludios (donde `m` se para). El retrato es la forma a la que se llega (`uTo`): su dispersión y su
haz pesan con `uPor` y con su parte en la mezcla (`tt`).

### Gravedad del cursor

En espacio de pantalla, tras proyectar: distancia al puntero corregida por el aspecto, caída gaussiana
(`exp(-d² · 14)`), desplazamiento en remolino (perpendicular · 1,3 + radial · 0,5) · 0,22 y brillo extra
(`color · (1 + f · 1,6)`). No modifica la geometría: es solo visual.

Conectada en F4.2: `uGrav` es la intensidad de `SceneFrame.gravity` y `uMouse`, su punto. El bucle la pone al día
en cada frame (`followGravity`, `scene/math/gravity`): con el ratón dentro de la ventana (solo `pointerType:
mouse`) sube hasta 1 en su posición con un suavizado `min(1, dt · 10)` (≈ 0,25 s); al salir baja igual, apagándose
en el último punto donde estuvo; con movimiento reducido, 0 de golpe. El ratón se mide sobre el lienzo (sin la
barra de scroll). Con frames de 0,1 s (el tope del reloj: ≤ 10 fps, un frame atascado o el primero tras una pausa),
`dt · 10` llega a 1 y entra o se apaga de golpe: aceptado, a esos fps todo va a saltos. El punto no se acota a ±1
(arrastrando fuera de la ventana sale de la pantalla y la caída lo apaga), y si el ratón sale por un sitio y vuelve
por otro antes de apagarse, lo que queda del remolino salta al punto nuevo: aceptado, como un movimiento rápido. La misma intensidad en todos los capítulos salvo la Tierra: desde F4.5, `uGrav` se
multiplica por `lerp(1; 0,5; presencia del capítulo 4)` (`EARTH_GRAVITY` en `sceneConfig`; `chapterPresence`), así que
sobre la Tierra el remolino y el brillo extra van a la mitad, y entre la tortuga y la Tierra se suaviza poco a poco. En
el retrato (m = 5) la presencia ya es 0: su giro con el ratón, que también lee `uGrav`, no cambia. La presencia se mide
con la `m` de la forma (`arrivalShapeM`, ADR-039): en la llegada del epílogo, la Tierra se va con el morph, que acaba
en el 55 % de la llegada. A medio morph hacia el retrato (de la forma 4 a la ~4,56, cuando la presencia llega a 0; de
`m` 4 a ~4,31 en la llegada) va suavizado igual: el retrato a medio formar gira algo menos y ese giro crece con el
scroll aunque el ratón esté quieto. No se nota y separar el giro del remolino costaría un uniform más: aceptado. La regla
va por la forma que toca, no por la que se ve: si el retrato no llega, en m = 5 se sigue viendo la Tierra («Retrato»)
con la gravedad entera; solo pasa si falla el retrato, aceptado. Las constelaciones (F4.3) y el Sol (F4.5)
no son partículas: la gravedad no los mueve.

### Colores

Constantes `const vec3` de la cabecera (ver «Etiquetas y colores»), tomadas de la paleta de escena del design
system. Variación por partícula con `aR.x` (brillo 0,7–1,3) y `aR.w` (tono y tamaño).

**Sin gestión de color ni mapeo de tonos** (ADR-027): el lienzo es opaco, se limpia con `--color-void` y va con
`linear` y `flat`; los shaders no incluyen los trozos de Three que convierten el color. La luz se suma tal cual,
como en el prototipo (de ahí los factores > 1 del núcleo y del destello).

**El color de la singularidad es el del destello.** La singularidad solo es la forma de salida (`uFrom`), y en esa
rama del shader el color es el del destello (`COLOR_FLASH` × 2,2, el blanco cálido), que se funde con el de la forma
siguiente al explotar: el punto quieto antes del Big Bang se ve de ese blanco. El color propio de `singularity()`
(la mezcla de `COLOR_SINGULARITY_WARM` y `COLOR_SINGULARITY_ICE`) no entra en ninguna mezcla. Se quitará en un paso que
ya rehaga las fotos fijas (`deuda.md`).

El fondo sale de `scene/voidColour` con los números del hex tal cual (`hexToRgb` + `Color.setRGB`), como la
paleta. **No** `new Color(token)`: toma el hex como sRGB y lo linealiza, y con la salida lineal el espacio se
pintaría casi negro. Al recuperar el contexto WebGL, Three rehace su fondo en negro y `SceneRoot` lo vuelve a
poner (`rendimiento.md` → «Robustez»).

### Retrato

Holograma de escáner en el verde del canal del epílogo (`COLOR_PORTRAIT_DEEP` → `_GLOW` → `_HOT`, los dos últimos
son `--color-channel-green` y `-bright`). La luz de cada partícula llega en `pPor.w` (`formas.md` → «Forma 5 · Retrato»); el
shader le suma:
- **Haz de la llegada, en pantalla** (C.7 · ADR-039). En la llegada del epílogo, el retrato se forma en
  `EPILOGUE_ARRIVAL.morphEnd` (ya viene en `uT`: `shapePosition`, la misma cuenta que la cámara) y el haz baja
  por la **pantalla**, de arriba abajo, entre `ARRIVAL_BEAM_START` y `ARRIVAL_BEAM_END` (`arrivalBeam()`, la misma
  cuenta que la página: `lib/scroll/arrivalChoreography`), hasta `ARRIVAL_BEAM_REACH` altos de la ventana (1,025: algo
  más allá del borde de abajo, para que su brillo salga entero; la página usa la misma línea, `arrivalBeamLine`). Tras
  proyectar y tras la gravedad del cursor (donde se pinta cada partícula), la `y` de cada partícula (NDC) se compara
  con la línea: por encima se enciende y brilla al pasar; por debajo llega apagada (12 % de su luz). Pesa con la parte
  del retrato en la mezcla (`tt · uPor`): toca la mezcla entera, así que a medio cambio, por debajo de la línea, también
  se oscurece la Tierra que se va (por debajo del haz, negro). Si el retrato llega con la escena ya ahí, el haz baja con la subida de `uPor`
  (`min(haz, uPor)`). Al acabar, entra el haz en bucle por la cara, fundido (en el último 20 % de la bajada). Ni el haz ni los fallos encienden
  lo que la foto funde (el corte del busto): se apagan con el mismo fundido, sacado de la altura (`PORTRAIT_FADE_H`).
- **Fallos de señal:** cada 0,2 s, una franja horizontal de cada 100 salta de lado y brilla. El tick se acota
  (`mod 997`): con `uTime` grande, `sin` pierde precisión en la GPU de un móvil y los fallos dejarían de ser al azar.
- **Parpadeo** leve y **giro** con el ratón hasta ±0,44 rad (`uMouse.x`, acotado a ±1, `· uGrav`: vuelve de frente al
  salir y en táctil no gira; arrastrando fuera de la ventana no pasa de ahí).
- **Contraste:** el color va por `luz²`, para que los rasgos (ojos, cejas, barba) se lean sobre la piel.
- Con movimiento reducido (`uMotion` 0), encendido entero y sin haz, fallos ni parpadeo que se mueva.
- Sin retrato aún (`uPor` 0), `portrait()` pinta la Tierra, y el morph del 4 al 5 va sin dispersión (no la hincha).
  Mientras `uPor` sube, mezcla la Tierra y el retrato con el retraso por partícula del morph.

### Iluminación de la Tierra

Luz direccional fija, desde el Sol que se ve: `SUN_DIR`, la posición del Sol (`SUN.position`) normalizada, que llega
por la cabecera (la Tierra está en el origen; un test los ata). Hasta F4.5 era la del prototipo,
`normalize(-0.72, 0.30, -0.45)`, de la izquierda y casi de lado; con el Sol en su sitio, el lado de día mira arriba a
la izquierda y el amanecer cruza en diagonal. Día/noche con `smoothstep` del
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

## Constelaciones

Desde F4.3b, aparte de las partículas: puntos y líneas con sus propios shaders (`scene/shaders/constellations/`,
un vertex shader para los dos y uno de fragmentos para cada uno), la misma cabecera de colores
(`constellationStar`, `constellationGlow`, `constellationLine`) y el mismo material aditivo. Las estrellas miden lo
mismo en pantalla a cualquier distancia (`gl_PointSize = uSize · uPR`). Detalle en `constelaciones-y-placas.md`.

## Sol

Desde F4.5 (`scene/Sun`), sobre la Tierra: un cuadrado de dos triángulos con sus shaders (`scene/shaders/sun/`) y el
mismo material aditivo. El shader de vértices lo abre en el espacio de la vista desde su centro, con el lado de
`uSize` en unidades de la escena, así que mira siempre a la cámara y crece y mengua con ella como la Tierra. No es un
punto porque el tamaño de un punto tiene tope (`ALIASED_POINT_SIZE_RANGE`) y en un móvil lo recortaría. El de
fragmentos dibuja el degradado del prototipo, sin textura: núcleo `sunCore` (`#ffb070`, el tinte del prototipo)
que pasa al halo `sunGlow` (`#ff8a3d`) y se apaga hasta el borde, con el mismo perfil de alfa que las estrellas de
las constelaciones.

- **Dónde:** `SUN.position` = (−1,4; 2,9; −1), lado 3,5: arriba a la izquierda de la Tierra, a la altura de su limbo
  superior y casi en su plano (z = −1; el prototipo, −5), sobre el limbo. La luz de la Tierra sale de ahí (`SUN_DIR`, «Iluminación de la Tierra»). Por qué ahí:
  - el prototipo lo ponía en (−2,6; 3; −5) con lado 9: con el encuadre de F3.6c su halo cruzaba el borde derecho del
    panel y el de la barra de arriba, y los dibujaba (`04-tierra.md` → «Layout»);
  - a la izquierda de la Tierra y a la altura de su centro (y ≈ 0: luz de lado de verdad) cae sobre el panel: a
    1280×720 el borde se marcaba con un escalón de 56 a 74 de brillo;
  - detrás de la Tierra ilumina su cara de atrás, que se ve a través (las partículas suman luz, sin profundidad), y
    parece de día por todas partes.
  Medido en Bajo con movimiento reducido, restando el escalón de la misma vista sin Sol: desde 1280 px de ancho (1280×720
  y 1440×900, también en la cola de Mission control, m ≈ 3,7) el halo no llega al panel ni a la barra. Por debajo de
  ~1240 px la Tierra ya pasa por detrás del panel (escalón de 38 a 47 de 255 sin Sol; a 1280×720 ya lo roza:
  `camara-y-encuadre.md` → «Cómo se ajustó») y el halo también (+11 a 1180×820 y +13 a 1152×864, el iPad apaisado; +79 a 1100×800 y +36 a 1024×768, donde la Tierra ya cruza el panel): aceptado,
  como el de la Tierra. En un móvil apaisado (800×360, 667×375, 844×390) el halo pasa bajo la barra de arriba con un
  escalón de +9 a +14 y se ve un corte plano en su borde (la Tierra no la toca): aceptado, por ser un tamaño raro; un
  Sol más pequeño solo ahí dependería del alto de la barra. Se mira en un móvil real (F6).
- **Cuándo:** `uOpacity` = presencia del capítulo 4 · 0,95 (`chapterPresence`, la rampa de las placas), con la `m` de
  la forma (`arrivalShapeM`, ADR-039): entero en la Tierra y apagado antes de llegar al retrato (en la llegada del
  epílogo, entre `m` 4,30 y 4,31, con la Tierra que se va). Nada antes de que las partículas se pinten (`SceneFrame.painted`, como
  los pins): entrando por `/#contact`, mientras llegan las formas, brillaría sobre el vacío. Con opacidad 0 no se pinta
  (`material.visible`): un cuadrado tan grande costaría píxeles en cada frame aunque no se viera. La regla va por la
  forma que toca, no por la que se ve: si el retrato no llega, en m = 5 se sigue viendo la Tierra («Retrato»), ya sin
  Sol pero iluminada desde `SUN_DIR`; solo pasa si falla el retrato, aceptado. No lee `SceneFrame.transmission`: va
  detrás de Mission control y entra en su cola; al saltar con el raíl al interludio, se apaga con la rampa (~0,24 s),
  como se aceptó para los pins.
- **Sin recorte:** `frustumCulled = false`. Three recorta con la esfera de la geometría (radio √2) y el shader abre el
  cuadrado más allá (`uSize / 2`, hasta 1,83): con el recorte, el halo desaparecería de golpe con el centro aún fuera
  de la vista.
- **Latido:** el lado va `3,5 ± 0,15 · sin(t · 0,8)` con el reloj de la escena (el 4–5 % del prototipo); con
  movimiento reducido, quieto en 3,5.
- En todos los niveles (son dos triángulos), también con movimiento reducido (solo deja de latir). Las cuentas, en
  `updateSunUniforms` (`sceneMaterials`); las cifras, en `SUN` (`sceneConfig`), con su capítulo, `EARTH_CHAPTER`, el
  mismo que el de la gravedad suave. El perfil de alfa está copiado de las estrellas de las constelaciones (los shaders
  de fragmentos no llevan cabecera): un test compara los dos bloques.

## Mejoras respecto al prototipo

- Los shaders pasan a archivos `.glsl`. Las etiquetas y los colores llegan desde TypeScript (ver «Etiquetas y
  colores») y el morph, el tamaño y la gravedad tienen constantes con nombre; los coeficientes propios de cada
  forma (velocidades de giro, amplitudes de aletas y estela) van junto a su fórmula, en la función de la forma
  (cada `const` más en el GLSL es peso en el chunk de la escena, que va justo; los comentarios no pesan: se
  quitan al compilar).
- `uMotion` para el movimiento reducido (el prototipo solo quitaba la gravedad).
- WebGL2 (Three.js actual ya no soporta WebGL1); sin límite práctico de atributos.
