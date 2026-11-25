import { clamp } from '../../math/clamp/clamp';
import { arrivalShapeM } from '../arrival/arrival';

/**
 * El mapa de formas (ADR-041; docs/04-escena/particulas-y-shaders.md → «Mapa de formas»): la escena no deduce la forma
 * de `m`, sino que recibe qué dos formas mezcla y cuánto (`uFrom`, `uTo`, `uT`). Así puede pasar de una forma a
 * cualquier otra, no solo a la del capítulo siguiente: las naves de las transmisiones (C.7) entran entre la nebulosa y
 * la galaxia y entre la tortuga y la Tierra sin tocar `m`, que sigue para la cámara, el HUD, el raíl y las fotos fijas.
 *
 * Esta carpeta la lee la escena (el shader, por su cabecera, y sus uniforms): entra en la huella de las fotos fijas.
 */

/**
 * El id fijo de cada forma: el que recibe el shader en `uFrom`/`uTo` (su cabecera define `SHAPE_*`). No es su orden
 * en el viaje (`SHAPE_TRACK`): el satélite y la nave nodriza aún no están en él.
 */
export const SHAPE = {
  singularity: 0,
  nebula: 1,
  galaxy: 2,
  turtle: 3,
  earth: 4,
  satellite: 5,
  mothership: 6,
  portrait: 7,
} as const;

export type ShapeId = (typeof SHAPE)[keyof typeof SHAPE];

/**
 * Las formas por las que pasa el viaje, en orden: la posición `s` en esta lista es la `m` de la forma. Hoy coincide con
 * los capítulos (una forma por capítulo; la del epílogo, el retrato), así que `s` sale de `m` (`shapePosition`).
 */
export const SHAPE_TRACK: readonly [ShapeId, ...ShapeId[]] = [
  SHAPE.singularity,
  SHAPE.nebula,
  SHAPE.galaxy,
  SHAPE.turtle,
  SHAPE.earth,
  SHAPE.portrait,
];

/**
 * Dónde se para `s` en la escena (`shapePosition`): justo antes de la última forma, como `m` se paraba en el shader. El
 * último cambio va de la penúltima a la última y se queda ahí (`t` 0,999: todas las partículas han llegado, con su
 * retraso).
 */
export const SHAPE_TRACK_END = SHAPE_TRACK.length - 2 + 0.999;

const LAST_INDEX = SHAPE_TRACK.length - 1;

/** La forma del sitio `index` de `SHAPE_TRACK`, o `past` si se sale de la lista. */
function trackShape(index: number, past: ShapeId): ShapeId {
  return SHAPE_TRACK[index] ?? past;
}

/** Las dos formas que se mezclan y cuánto (0 → 1): lo que recibe el shader. */
export interface ShapeMix {
  from: ShapeId;
  to: ShapeId;
  t: number;
}

export function createShapeMix(): ShapeMix {
  return { from: SHAPE.singularity, to: SHAPE.nebula, t: 0 };
}

/**
 * La posición de la forma en el viaje con la `m` de la escena: la de la forma (`arrivalShapeM`: en la llegada del
 * epílogo el retrato está formado antes de que acabe el tramo, ADR-039), acotada al recorrido. Una `m` que no es un
 * número, al principio.
 */
export function shapePosition(m: number): number {
  if (Number.isNaN(m)) return 0;
  return clamp(arrivalShapeM(m), 0, SHAPE_TRACK_END);
}

/**
 * Las formas en la posición `s` de `SHAPE_TRACK`: la de `floor(s)`, la siguiente y la fracción. En la última (o más
 * allá), quieta en ella. Escribe en `out` (se llama en cada frame: sin objetos nuevos, ADR-004) y lo devuelve.
 */
export function shapeMixAt(s: number, out: ShapeMix): ShapeMix {
  const at = clamp(Number.isNaN(s) ? 0 : s, 0, LAST_INDEX);
  const index = Math.floor(at);
  out.from = trackShape(index, SHAPE_TRACK[0]);
  out.to = trackShape(index + 1, out.from);
  out.t = at - index;
  return out;
}
