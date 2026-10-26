# Formas (generadores)

> Funciones puras `generateX(count, rng, out…)` que escriben en matrices ya creadas (y etiquetas en `aR` cuando
> aplica); la tortuga recibe además las placas antes de las salidas y lanza un `Error` claro si no puede plantar
> el bosque. Se ejecutan en un Web Worker (`docs/04-escena/rendimiento.md` → «Worker de las formas»). Cada forma
> recibe su propio `rng` (la subsemilla de su nombre). Mismo `count` para todas las formas: cada partícula
> tiene un sitio en cada una. Unidades: «unidades de escena», todas las formas centradas en el origen.
> Código: `src/scene/shapes/` (una carpeta por pieza) y `src/scene/config/` (lo compartido).
> Los números que este documento no da salen del prototipo y viven, con nombre, al principio de cada
> generador (`NEBULA`, `GALAXY`, `TURTLE`, `EARTH`): son el aspecto que ya se aprobó.

## Utilidades compartidas

- **PRNG con semilla** (`shapes/prng`): `mulberry32` y `subSeed(semilla, nombre)` (FNV-1a del nombre más un
  mezclado final). `SCENE_SEED` (`config/sceneConfig.ts`) es la semilla del proyecto; cada parte (`nebula`,
  `galaxy`, `turtle`, `earth`, `rand`) consume su propio flujo, así que retocar una forma no mueve las demás.
  `Math.random` está prohibido en `src/scene/**` (ESLint, ADR-011).
- **Ruido** (`shapes/noise`): suma de senos anidados (`n3`) y `fbm` de 3 octavas (pesos 1 · 0,5 · 0,25,
  frecuencias × 1 · 2,03 · 4,1), los del prototipo. **No** necesita ser idéntico en GLSL: la tierra y las
  placas viajan ya calculadas en `aR` y el shader no las recalcula; el GLSL de F3.3 tiene su propio `n3` para
  colorear. La paridad TS/GLSL queda para lo que sí la necesita (la posición de los pins, F4.4).
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
