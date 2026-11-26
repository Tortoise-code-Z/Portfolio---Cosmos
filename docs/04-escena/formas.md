# Formas (generadores)

> Funciones puras `generateX(count, rng, out…)` que escriben en matrices ya creadas (y etiquetas en `aR` cuando
> aplica); la tortuga recibe además las placas antes de las salidas y lanza un `Error` claro si no puede plantar
> el bosque. Se ejecutan en un Web Worker (`docs/04-escena/rendimiento.md` → «Worker de las formas»). Cada forma
> recibe su propio `rng` (la subsemilla de su nombre). Mismo `count` para todas las formas: cada partícula
> tiene un sitio en cada una. Unidades: «unidades de escena», todas las formas centradas en el origen.
> Código: `src/scene/shapes/` (una carpeta por pieza) y `src/scene/config/` (lo compartido).
> Los números que este documento no da salen del prototipo y viven, con nombre, al principio de cada
> generador (`NEBULA`, `GALAXY`, `TURTLE`, `EARTH`, `PORTRAIT`): son el aspecto que ya se aprobó. El retrato
> (forma 5) llega aparte, con sus imágenes: «Forma 5 · Retrato».
> El número de cada forma aquí es su sitio en el viaje (un capítulo por forma). El shader las elige por un id fijo
> (`SHAPE`: el retrato es el 7, detrás de las naves): es el mapa de formas (`particulas-y-shaders.md` → «Mapa de
> formas», ADR-041).

## Utilidades compartidas

- **PRNG con semilla** (`shapes/prng`): `mulberry32` y `subSeed(semilla, nombre)` (FNV-1a del nombre más un
  mezclado final). `SCENE_SEED` (`config/sceneConfig.ts`) es la semilla del proyecto; cada parte (`nebula`,
  `galaxy`, `turtle`, `earth`, `rand` y, en su encargo aparte, `portrait`) consume su propio flujo, así que retocar
  una forma no mueve las demás.
  `Math.random` está prohibido en `src/scene/**` (ESLint, ADR-011).
- **Ruido** (`shapes/noise`): suma de senos anidados (`n3`) y `fbm` de 3 octavas (pesos 1 · 0,5 · 0,25,
  frecuencias × 1 · 2,03 · 4,1), los del prototipo. **No** necesita ser idéntico en GLSL: la tierra y las
  placas viajan ya calculadas en `aR` y el shader no las recalcula; el GLSL de F3.3 tiene su propio `n3` para
  colorear. La paridad TS/GLSL queda para lo que sí la necesita: el balanceo de la tortuga, que mueve los pins (F4.4b:
  `TURTLE_SWAY` llega al shader por la cabecera y `math/platePins` hace la misma cuenta; un test los ata).
- **Muestreo** (`shapes/sampling`): dirección uniforme en la esfera (escrita en un vector reutilizado) y
  `boundedGauss`, la campana del prototipo: suma de 4 uniformes centrada, **acotada en [−1, 1]** y con
  desviación típica ≈ 0,29 (no 1). Todas las escalas «gaussianas» de este documento son con esta campana: el
  resultado nunca pasa de ±escala.
- **Rejilla hexagonal** (`shapes/hexGrid`): celda axial *pointy-top* de un punto del plano XZ, con su distancia
  «hexagonal» al centro (`h`: 0 en el centro, 1 en el borde), y la prueba de que un círculo queda entero fuera
  de una celda (conservadora: nunca dice «fuera» de un círculo que la toca).
- **Sin bucles sin tope**: todo muestreo con rechazo tiene un número máximo de intentos con nombre.

## Forma 0 · Singularidad

No se genera: en el shader, `normalize(position) · r`, con `r = 0,025 + carga · 0,5 · aR.x` y vibración
proporcional a la carga. Por eso **ninguna `position` es exactamente (0, 0, 0)**: el generador aparta lo
mínimo (`1e-4`) la que caería ahí.

## Forma 1 · Nebulosa (`position`)

- 7 % (las primeras por índice): **protoestrella** (40 % en una bola de radio ≤ 0,45 concentrada en el centro,
  `rng² · 0,45`; 60 % en un disco de acreción de radio 0,6–1,9 y espesor `boundedGauss · 0,06`).
- 93 %: **nube** por muestreo con rechazo en la caja (±7,5 · ±4,4 · ±5,2), dentro del elipsoide
  `x²/56 + y²/19,4 + z²/27 ≤ 1` (en Y la caja recorta el elipsoide unas centésimas, √19,4 ≈ 4,405, como el
  prototipo): se acepta un punto si
  `fbm(p · 0,42 + (1,3, 0, −0,7)) · 0,95 + (1 − d) · 0,5 > 0,3 + rng · 0,28` (el desplazamiento aparta el
  pico de densidad del centro). Máx. 80 intentos; si se agotan, el último candidato que cayó **dentro** del
  elipsoide (si no cayó ninguno, probabilidad ~1e-26, junto al centro).

## Forma 2 · Galaxia (`pGal`)

- 15 % (al azar por partícula): **bulbo**, radio `rng^1,8 · 1,7`, achatado en Y (0,55).
- 85 %: **3 brazos**, el de cada partícula por índice (`i mod 3`): radio `rng^1,25 · 8 + 0,35`, ángulo
  `brazo + r · 0,62`, dispersión `rng^2,6 · (0,35 + r · 0,14)` con signo aleatorio en X y Z; grosor vertical
  `dispersión · 0,45 · (1,2 − r / 8)`, decreciente con el radio.

## Forma 3 · Tortuga (`pTur` + etiqueta en `aR.y`)

Cabeza hacia +X. Caparazón: semiejes `AX 2,7 · AY 1,3 · AZ 2,15` (`SHELL` en `config/sceneConfig.ts`), con un
grosor del 3 % hacia dentro. Las partes van **por índice** (fracciones fijas, en este orden):

| Fracción | Parte | Etiqueta | Notas |
|---|---|---|---|
| 44 % | Caparazón (hemisferio superior del elipsoide) | 0 base · 1 borde de celda o borde inferior · 20..26 placa | Rejilla hexagonal *pointy-top* de tamaño 0,95 (`HEX_SIZE`). Se prefieren los bordes: un punto con `h < 0,8` fuera de placa se re-muestrea con un 50 % (máx. 4 intentos). Borde: `h > 0,82` o altura relativa `v < 0,08` |
| 4 % | Plastrón (disco inferior, `y = −0,06`, radio 0,94 de los semiejes) | 14 | |
| 10 % | Bosque: 30 conos sobre el caparazón, fuera de las placas | 5 | Base con `v` entre 0,3 y 0,85; alto 0,32–0,70, radio 0,14–0,24; las partículas se apilan hacia la base (`rng^0,8`). **Todo el círculo de la base** queda fuera de las celdas de placa: ninguna hoja cae en una placa. Máx. 10.000 intentos; si se agotan, error claro |
| 7 % | Cuello (30 %) y cabeza (70 %): dos elipsoides | 6 | Centros (2,5 · 0,22 · 0) y (3,15 · 0,38 · 0); semiejes (0,55 · 0,32 · 0,38) y (0,58 · 0,38 · 0,43) |
| 0,4 % | Ojos (dos racimos) | 12 | En (3,52 · 0,55 · ±0,28), `boundedGauss · 0,03`. Brillantes |
| 18 % | Aletas: 2 delanteras grandes y 2 traseras, barridas hacia atrás | 7, 8 (delanteras) · 9, 10 (traseras) | 7 y 9 hacia −Z, 8 y 10 hacia +Z. Alcance en Z: 1,7–3,9 delante y 1,6–2,8 detrás. El shader las mueve en contrafase |
| 1 % | Cola (cono) | 11 | De X −2,55 a −3,30, radio 0,18 que se cierra |
| ~15,6 % | Estela detrás (X de −3 a −10) | 13 | Se abre con la distancia. El shader la desplaza en bucle y la desvanece; en el nivel Bajo la esconde (el generador no mira el nivel) |

**Placas:** las etiquetas 20..26 (separadas del resto para no chocar con las partes del cuerpo) corresponden a
los huecos de `config/plateSlots` (ver `constelaciones-y-placas.md`). Una celda es placa solo si hay un proyecto
asignado a ese hueco; un hueco sin proyecto es una celda normal (puede tener árboles). Cambiar los proyectos
vuelve a sortear la tortuga entera (todas sus partes y su etiqueta `aR.y`: sale de un solo flujo de azar y las
placas cambian cuántos números gasta el caparazón); las demás formas y `aR.x/z/w` no se mueven.

## Forma 4 · Tierra (`pEar` + etiqueta en `aR.z`)

| Fracción | Capa | Etiqueta | Radio |
|---|---|---|---|
| 74 % | Superficie: tierra si `fbm(dir · 1,6 + (4, 0, −2)) > 0,1`, si no océano | 1 tierra · 0 océano | 3,0 |
| 14 % | Nubes: se vuelve a sortear la dirección mientras `fbm(dir · (2,4 · 3,2 · 2,4) + (0, 7, 0)) < 0,05` (máx. 20 intentos; si se agotan, la última) | 2 | 3,09 |
| 12 % | Atmósfera | 3 | 3,12 + `rng² · 0,3` |

## Forma 5 · Retrato (`pPor`, 4 por partícula; desde C.6b)

Un relieve sacado de una sola foto (`docs/02-experiencia/capitulos/05-crew-file.md`), como holograma de escáner. No se
genera con las demás: es un encargo aparte al worker (`rendimiento.md` → «Worker de las formas») que se pide al llegar
a la tortuga, un tramo antes de la Tierra (`PORTRAIT_LOAD_FROM_M` = 3: la descarga tiene ese margen; no subirla a 4).
Hasta que llega, o si falla, el retrato es la Tierra (`uPor` 0). Al llegar, `uPor` sube a 1 en 0,6 s
(`PORTRAIT_FADE_IN_S`; de golpe con movimiento reducido) y cada partícula pasa de la Tierra al retrato con su retraso
del morph: quien salta al final por el raíl o la misión rápida, o entra por `/#crew-file`, lo ve formarse, con el haz
de barrido bajando con esa subida, en vez de un cambio seco. Sin retrato, el tramo del 4 al 5 lleva a la Tierra a sí
misma sin la dispersión del morph (no se hincha).

- **Datos:** dos imágenes de 720 × 637 en `src/assets/portrait/` (las genera `scripts/portrait/`, con su README):
  `portrait-color.jpg`, la foto, y `portrait-depth.png` (R profundidad 3..255 y 0 = fondo · G distancia al borde ×16
  · B contornos). El 1 y el 2 no se usan (`PORTRAIT.depthFloor`): los navegadores con protección contra huellas
  (Brave) meten ruido de ±1–2 en lo que se lee de un canvas, y con el fondo en 0 exacto salían puntos sueltos por todo
  el fondo. El tamaño es contrato (`PORTRAIT_FRAME`): el generador rechaza otro. Llevan solo píxeles, sin bloques de
  metadatos (lo comprueba `shapeContract.test.ts`).
- **Sitios:** cada píxel de la figura en las filas del escáner (una de cada tres), en el centro de su fila; el borde de
  la silueta (junto al fondo, no junto al borde de la foto) suma 5 paredes que se curvan hacia atrás y hacia dentro,
  lejos del fondo en horizontal y en vertical (hasta 14 px, 0,3 de profundidad; ninguna sale de la figura) y se oscurecen; un salto de profundidad de más de 0,025 con un vecino (la
  mandíbula sobre el cuello) suma una pared hasta él (una por cada 0,04, máx. 24). Las partículas se reparten entre
  los sitios al azar sin repetir (Fisher–Yates parcial) y, si hay más partículas que sitios, se repiten al azar.
- **El retrato de `n` partículas es el principio del de más:** el azar de cada partícula no depende de `count`. La
  degradación en caliente usa ese trozo y no pide otro.
- **Mundo:** 7 unidades de ancho (`PORTRAIT_FRAME.width`), centrado en el origen y mirando a +Z. La profundidad se
  estira a 0,33 del ancho de la prueba (2,4 unidades, «relieve 44 %») y cada punto se pone donde lo vio la cámara de
  la foto (a 6,2 anchos de la prueba): de frente no se abren grietas entre planos.
- **Luz (`pPor.w`):** la del holograma, ya calculada: el gris de la foto entre 4 niveles y continuo (robot ↔ realista
  74 %), más los contornos y el borde de la silueta (a menos de ~3,6 px), y fundida en los últimos 165 px de abajo (la
  foto corta el busto). El shader suma el haz de barrido, el parpadeo y los fallos de señal
  (`particulas-y-shaders.md` → «Retrato»).
- Las cifras son las de la prueba de la sesión 34 con los ajustes que eligió Víctor; viven en `PORTRAIT`
  (`src/scene/shapes/portrait`).

## Naves (C.7 · naves; desde el satélite)

Las naves que traen las transmisiones no se generan en el worker: se dibujan **en el shader**, paramétricas
(`docs/02-experiencia/transiciones-naves.md` → apartado 2, opción B, y la prueba v8). Cada partícula elige su pieza con
`aR.x` y su lado o detalle con `aR.w`, y saca más números con `rx(k)`, un hash sin `sin()` de esos dos (estable en la
GPU del móvil; `aR.y` y `aR.z` son etiquetas de la tortuga y la Tierra, no números al azar). Las piezas comunes
(cajas con sus aristas, troncos de cono, platos parabólicos, luz con la normal de cada pieza) las compartirá la nave
nodriza. Se dibujan en sus unidades, con la pantalla en `z = 0` mirando a +z y la proporción de lo que se ve
(`uScreen`; en vertical, x e y cambiadas: los paneles van arriba y abajo), y las coloca `scene/math/shipPose`
(`particulas-y-shaders.md` → «Naves»).

- **Satélite** (`SHAPE_SATELLITE`, el Mission log): el bisel de la pantalla en el ámbar del canal, con tornillos y LEDs;
  la pantalla apagada; el cuerpo (aislante dorado arrugado con costuras, radiadores blancos con aletas, frontal gris)
  con sus aristas; dos alas de tres paneles articulados (células con sus pistas, marcos y cara trasera) sobre un yugo
  de celosía; dos reflectores laterales con brazo y bocina; la antena de arriba; la tobera principal y cuatro de
  control; sensores estelares; antenas de varilla; y dos guiños: la bandera de España en su mástil, ondeando, y la de
  Irlanda, que cruza por detrás de borde a borde de lo que se ve (cada 13 s; `uFlagSpan`).
- **Nave nodriza** (`SHAPE_MOTHERSHIP`, Mission control): la boca del hangar (la pantalla) con compuertas a rayas y
  una franja de luz que corre; el hangar, con suelo de calles iluminadas, costillas, fondo (tapa las toberas) y una
  lanzadera atracada; el casco escalonado de planchas (una superelipse a lo largo de z) con aristas; dos brazos a los
  lados de la boca; la superestructura en tres niveles con ventanas, el puente y el mástil; la quilla; góndolas con
  pilones y aletas; toberas acampanadas con brillo y estela (más tenues de frente); módulos en el lomo y los costados;
  cubiertas de ventanas y balizas. Y tres alienígenas con una sola llamada a `alien()` (la lección de la v7): dos en
  el hangar (el de delante saluda) y uno en traje de astronauta sobre el casco, saludando, con puntos más finos
  (`S` 0,25) para que de cerca se les lea la cara.
- **En Bajo** (`uExtras` 0) no hay piezas pequeñas (en el satélite, tornillos, LEDs y sensores; en la nave nodriza,
  módulos, ventanas y balizas): sus partículas van al cuerpo o al casco. Las banderas y los alienígenas se quedan en
  todos los niveles. Las naves usan las partículas del nivel (60 000 / 36 000 / 20 000).
- Los colores, en la paleta (`satellite*`, `flag*`, `mothership*`, `alien*`); el ámbar del bisel del satélite es
  `--color-channel-amber` y el azul de la boca de la nave nodriza, `--color-channel-blue` (lo comprueba el test de la
  paleta).

## Contrato y tests

```ts
// src/scene/shapes/shapeContract (lo que valida el hilo principal sin cargar los generadores)
interface ShapeRequest {
  count: number;            // entero de 1 a las partículas del nivel Alto (los niveles solo bajan)
  seed: number;             // entero de 32 bits sin signo (SCENE_SEED)
  plates: readonly number[]; // etiquetas 20..26 con proyecto: un conjunto (orden indiferente; repetida = error)
}
interface ShapeSet {
  count: number;
  nebula: Float32Array;  galaxy: Float32Array;  turtle: Float32Array;  earth: Float32Array;  // count · 3
  rand: Float32Array;    // aR (count · 4): x aleatorio · y etiqueta tortuga · z etiqueta Tierra · w aleatorio
}
// Las etiquetas también son contrato (las lee el shader sin cargar los generadores):
// TURTLE_TAG, TURTLE_FLIPPERS, EARTH_TAG
// src/scene/shapes/generateShapes: lanza RangeError con una petición que no vale
function generateShapes(request: ShapeRequest): ShapeSet;
// El retrato, aparte (forma 5): PortraitRequest { count, seed }, PORTRAIT_FRAME, PORTRAIT_LOAD_FROM_M.
// src/scene/shapes/portrait: escribe count · 4 en out; lanza RangeError con unas imágenes que no valen o sin figura
function generatePortrait(count: number, rng: Rng, pixels: PortraitPixels, out: Float32Array): void;
```

**Determinismo:** mismas entradas → mismos bytes **en el mismo motor de JavaScript** (Node en Vitest es V8, como
Chromium y sus capturas de F3.6). Entre motores no se promete: `Math.sin` y `Math.pow` pueden diferir en el
último bit y un muestreo con rechazo aceptar otro candidato (alguna partícula suelta en otro sitio).

Tests (Vitest, sin WebGL):
1. Longitudes correctas (`count · 3` y `count · 4`) y todo finito con `count` 1, 2, 3, 4 y 30.
2. Cada parte dentro de la caja que sale de sus fórmulas (margen 1e-4 por el redondeo a `Float32`).
3. Fracciones por grupo de etiquetas (caparazón = {0, 1, 20..26}) dentro de ±1 % de la tabla, con 20.000 y
   60.000 partículas.
4. Misma petición → mismos bytes; placas en otro orden → mismos bytes. **Huella fija** (hash de los bytes) por
   matriz con 1.000 partículas (las partes de la tortuga van por índice: con menos, los ojos y la cola no tienen
   ninguna y la huella no las vería; el test comprueba que están): retocar una forma cambia solo su huella, y el cambio se hace a propósito (se
   actualiza en el mismo commit).
5. Ninguna partícula de árbol cae en una celda de placa, con ninguna placa, solo `[20]` y las 7.
6. Tiempo de generación de 60.000 partículas, la mejor de tres vueltas (el CI lo pasa con cobertura y otros tests
   en paralelo: ese ruido solo suma): aviso por encima de 150 ms, falla por encima de 1 s (en entorno `node`).
   Medido en F3.2: ~0,4 s en el contenedor de Claude, casi todo la nube de la nebulosa.
7. Una petición inválida → `RangeError` (los casos, en `shapeContract.test.ts`).
8. El retrato (`portrait.test.ts`, con imágenes hechas a mano del tamaño del contrato): imágenes que no valen; mismos
   bytes con la misma semilla; el de `n` es el principio del de más; las filas del escáner dentro del marco; más
   cerca en la foto, más cerca de la cámara; la luz (foto, contornos, borde y el fundido de abajo); las paredes del
   borde y de los saltos; más partículas que sitios.
