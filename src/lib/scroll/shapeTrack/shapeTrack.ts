import { clamp } from '../../math/clamp/clamp';
import { EPILOGUE_ARRIVAL, arrivalShapeM } from '../arrival/arrival';
import type { JourneyStep } from '../mapM/mapM';

/**
 * El mapa de formas (ADR-041; docs/04-escena/particulas-y-shaders.md → «Mapa de formas»): la escena no deduce la forma
 * de `m`, sino que recibe qué dos formas mezcla y cuánto (`uFrom`, `uTo`, `uT`). Así puede pasar de una forma a
 * cualquier otra, no solo a la del capítulo siguiente: las naves de las transmisiones (C.7) entran entre la nebulosa y
 * la galaxia (el satélite) sin tocar `m`, que sigue para la cámara, el HUD, el raíl y las fotos fijas.
 *
 * Esta carpeta la lee la escena (el shader, por su cabecera, y sus uniforms): entra en la huella de las fotos fijas.
 */

/**
 * El id fijo de cada forma: el que recibe el shader en `uFrom`/`uTo` (su cabecera define `SHAPE_*`). No es su orden
 * en el viaje (`SHAPE_TRACK`).
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

/** Una lista de formas en orden: la posición `s` en ella dice qué dos formas se mezclan (`shapeMixAt`). */
export type ShapeTrack = readonly [ShapeId, ...ShapeId[]];

/**
 * Las formas por las que pasa el viaje, en orden, con las naves de las transmisiones: la posición `s` en esta lista
 * sale de la posición en los tramos (`journeyValue` con `journeySteps(...).shape`). La nave nodriza aún no está.
 */
export const SHAPE_TRACK: ShapeTrack = [
  SHAPE.singularity,
  SHAPE.nebula,
  SHAPE.satellite,
  SHAPE.galaxy,
  SHAPE.turtle,
  SHAPE.earth,
  SHAPE.portrait,
];

/**
 * Las formas de los capítulos, una por capítulo (la del epílogo, el retrato), sin naves: la posición en ella es la `m`
 * de la forma (`shapePosition`). La usa la escena con movimiento reducido (sin naves: los huecos de sus llegadas y
 * salidas miden 0) y mientras la página aún no ha medido los tramos.
 */
export const CHAPTER_SHAPES: ShapeTrack = [
  SHAPE.singularity,
  SHAPE.nebula,
  SHAPE.galaxy,
  SHAPE.turtle,
  SHAPE.earth,
  SHAPE.portrait,
];

/** ¿Es una nave (de las que traen una transmisión, C.7)? */
export function isShip(id: ShapeId): boolean {
  return id === SHAPE.satellite || id === SHAPE.mothership;
}

/**
 * La llegada de una nave, en fracción de su tramo (tramos lineales con el scroll): la forma de antes se convierte en
 * la nave hasta `formed`; la nave se acerca girada y se pone de frente hasta `near` (su pantalla, al 86–90 % de lo que
 * se ve), y sigue acercándose hasta llenar la vista al final del tramo (`scene/math/shipPose`).
 */
export const SHIP_ARRIVAL = { formed: 0.35, near: 0.75 } as const;

/**
 * Lo que la escena necesita de un tramo del viaje para medir sus formas: su clase y su paso de `m` (`JOURNEY_SEGMENTS`,
 * que llega por parámetro: `lib` no lee los datos de `content`).
 */
export interface ShapeSegment extends JourneyStep {
  readonly kind: string;
}

/** Los pasos de las formas y de la nave, uno por tramo (`journeySteps`). */
export interface JourneySteps {
  readonly shape: readonly JourneyStep[];
  readonly ship: readonly JourneyStep[];
}

/**
 * Los pasos de las formas y de la nave en cada tramo (para `journeyValue`), a partir de los de `m`:
 *
 * - **Formas (`shape`):** la posición en `SHAPE_TRACK`. Fuera de las naves, la de `m` más las naves que ya han pasado.
 *   La llegada de una nave (`interlude-arrival`) cambia de la forma de antes a la nave hasta `SHIP_ARRIVAL.formed`; su
 *   pantalla y su salida se quedan en la nave, y su cola la deshace en la forma siguiente. La llegada de un capítulo
 *   (`arrival`, el epílogo) acaba en `EPILOGUE_ARRIVAL.morphEnd` (ADR-039). El último tramo se queda en la última
 *   forma, entera (`uT` 0: una sola forma en el shader).
 * - **Nave (`ship`):** su avance, de 0 a 2: de 0 a 1 en la llegada, 1 en la pantalla, de 1 a 2 en la salida y 2 en
 *   la cola. Fuera de un interludio, 0. Solo cuenta mientras hay una nave en la mezcla.
 */
export function journeySteps(segments: readonly ShapeSegment[]): JourneySteps {
  const shape: JourneyStep[] = [];
  const ship: JourneyStep[] = [];
  let ships = 0;
  for (const segment of segments) {
    const base = segment.base + ships;
    switch (segment.kind) {
      case 'interlude-arrival':
        shape.push({ base, morphStart: 0, morphEnd: SHIP_ARRIVAL.formed, linear: true });
        ship.push({ base: 0, morphStart: 0, linear: true });
        ships += 1;
        break;
      case 'interlude':
        shape.push({ base, morphStart: null });
        ship.push({ base: 1, morphStart: null });
        break;
      case 'interlude-exit':
        shape.push({ base, morphStart: null });
        ship.push({ base: 1, morphStart: 0, linear: true });
        break;
      case 'interlude-tail':
        shape.push({ base, morphStart: segment.morphStart });
        ship.push({ base: 2, morphStart: null });
        break;
      case 'arrival':
        shape.push({ base, morphStart: 0, morphEnd: EPILOGUE_ARRIVAL.morphEnd, linear: true });
        ship.push({ base: 0, morphStart: null });
        break;
      default:
        shape.push({ base, morphStart: segment.morphStart });
        ship.push({ base: 0, morphStart: null });
    }
  }
  return { shape, ship };
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
 * La posición en `CHAPTER_SHAPES` con la `m` de la escena: la de la forma (`arrivalShapeM`: en la llegada del epílogo
 * el retrato está formado antes de que acabe el tramo, ADR-039), acotada a la lista. Una `m` que no es un número, al
 * principio.
 */
export function shapePosition(m: number): number {
  if (Number.isNaN(m)) return 0;
  return clamp(arrivalShapeM(m), 0, CHAPTER_SHAPES.length - 1);
}

/**
 * La forma del sitio `index` de `track`, o `past` si se sale de la lista: pasa con la siguiente de la última
 * (`shapeMixAt` en la última). Con `index` ya acotado, el `past` de `from` no se usa nunca (está por
 * `noUncheckedIndexedAccess`).
 */
function trackShape(track: ShapeTrack, index: number, past: ShapeId): ShapeId {
  return track[index] ?? past;
}

/**
 * Las formas en la posición `s` de `track`: la de `floor(s)`, la siguiente y la fracción. En la última (o más allá),
 * quieta en ella (`from` y `to`, la misma, y `t` 0: el shader evalúa una sola). Escribe en `out` (se llama en cada
 * frame: sin objetos nuevos, ADR-004) y lo devuelve.
 */
export function shapeMixAt(s: number, track: ShapeTrack, out: ShapeMix): ShapeMix {
  const at = clamp(Number.isNaN(s) ? 0 : s, 0, track.length - 1);
  const index = Math.floor(at);
  out.from = trackShape(track, index, track[0]);
  out.to = trackShape(track, index + 1, out.from);
  out.t = at - index;
  return out;
}
