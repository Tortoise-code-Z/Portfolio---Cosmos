# Formas (generadores)

> Funciones puras `generateX(count, rng): Float32Array` (y etiquetas cuando aplica), ejecutadas en un Web
> Worker. Mismo `count` para todas las formas: cada partícula tiene un sitio en cada una.
> Unidades: «unidades de escena», todas las formas centradas en el origen.

## Utilidades compartidas

- **PRNG con semilla** (`mulberry32`, semilla fija del proyecto): sustituye a `Math.random`.
- **Ruido**: suma de senos anidados (`n3`) y `fbm` de 3 octavas, idéntico en TypeScript y GLSL para que los
  colores del shader cuadren con la geometría.
- **Dirección aleatoria uniforme** en la esfera y aproximación gaussiana (suma de 4 uniformes).

## Forma 0 · Singularidad

No se genera: en el shader, `normalize(position) · r`, con `r = 0,025 + carga · 0,5 · aR.x` y vibración
proporcional a la carga.

## Forma 1 · Nebulosa (`position`)

- 7 %: **protoestrella** (40 % en una bola de radio ≤ 0,45 concentrada en el centro; 60 % en un disco de acreción
  de radio 0,6–1,9 y espesor gaussiano 0,06).
- 93 %: **nube** por muestreo con rechazo dentro de un elipsoide de semiejes (7,5 · 4,4 · 5,2): se acepta un
  punto si `fbm(p · 0,42) · 0,95 + (1 − d) · 0,5 > 0,3 + rng · 0,28` (máx. 80 intentos).

## Forma 2 · Galaxia (`pGal`)

- 15 %: **bulbo**, radio `rng^1,8 · 1,7`, achatado en Y (0,55).
- 85 %: **3 brazos**: radio `rng^1,25 · 8 + 0,35`, ángulo `brazo + r · 0,62`, dispersión
  `rng^2,6 · (0,35 + r · 0,14)` con signo aleatorio; grosor vertical decreciente con el radio.

## Forma 3 · Tortuga (`pTur` + etiqueta en `aR.y`)

Cabeza hacia +X. Caparazón: semiejes `AX 2,7 · AY 1,3 · AZ 2,15`.

| Fracción | Parte | Etiqueta | Notas |
|---|---|---|---|
| 44 % | Caparazón (hemisferio superior del elipsoide) | 0 base · 1 borde de celda o borde inferior · 20..26 placa | Rejilla hexagonal *pointy-top* de tamaño 0,95; se prefiere muestrear bordes para que la rejilla se lea |
| 4 % | Plastrón (disco inferior) | 14 | |
| 10 % | Bosque: ~30 conos sobre el caparazón, fuera de las placas | 5 | Alto 0,32–0,70, radio 0,14–0,24 |
| 7 % | Cuello y cabeza (dos elipsoides) | 6 | |
| 0,4 % | Ojos (dos racimos) | 12 | Brillantes |
| 18 % | Aletas: 2 delanteras grandes y 2 traseras, barridas hacia atrás | 7, 8 (delanteras) · 9, 10 (traseras) | El shader las mueve en contrafase |
| 1 % | Cola (cono) | 11 | |
| ~15,6 % | Estela detrás (X de −3 a −10) | 13 | El shader la desplaza en bucle y la desvanece |

**Placas:** las etiquetas 20..26 (separadas del resto para no chocar con las partes del cuerpo) corresponden a los huecos de `config/plateSlots.ts` (ver
`constelaciones-y-placas.md`). Una celda es placa solo si hay un proyecto asignado a ese hueco.

## Forma 4 · Tierra (`pEar` + etiqueta en `aR.z`)

| Fracción | Capa | Etiqueta | Radio |
|---|---|---|---|
| 74 % | Superficie: tierra si `fbm(dir · 1,6) > 0,1`, si no océano | 1 tierra · 0 océano | 3,0 |
| 14 % | Nubes (rechazo por ruido) | 2 | 3,09 |
| 12 % | Atmósfera | 3 | 3,12–3,42 |

## Contrato y tests

```ts
interface ShapeSet {
  nebula: Float32Array;  galaxy: Float32Array;  turtle: Float32Array;  earth: Float32Array;
  rand: Float32Array;    // aR (4 por partícula, con etiquetas)
}
function generateShapes(count: number, seed: number): ShapeSet;
```

Tests (Vitest, sin WebGL):
1. Longitudes correctas (`count · 3` y `count · 4`) y ningún `NaN`.
2. Cada forma dentro de su caja límite esperada.
3. Fracciones por etiqueta dentro de ±1 % de la tabla.
4. Misma semilla → mismo resultado byte a byte.
5. Ninguna celda de placa contiene árboles.
6. Tiempo de generación de 60.000 partículas < 150 ms en CI (aviso, no fallo duro).
