import { LEVEL_SETTINGS } from '~/lib/device/sceneLevel/sceneLevel';

import { FIRST_PLATE_LABEL, LAST_PLATE_LABEL } from '../../config/plateSlots/plateSlots';

/**
 * El contrato de las formas (docs/04-escena/formas.md → «Contrato»): lo que se pide, lo que vuelve y cuándo una
 * petición vale. Va aparte de los generadores para que el hilo principal valide sin cargarlos: los generadores
 * solo viajan en el worker y, si hay que reintentar, en su propio chunk.
 */

/** Lo que se pide: cuántas partículas, la semilla y las placas con proyecto. */
export interface ShapeRequest {
  readonly count: number;
  readonly seed: number;
  /** Etiquetas de placa (20..26) con proyecto: un conjunto (el orden no cambia el resultado). */
  readonly plates: readonly number[];
}

/** Las matrices de los atributos de `particulas-y-shaders.md`. */
export interface ShapeSet {
  readonly count: number;
  /** Forma 1 (`position`): 3 por partícula. */
  readonly nebula: Float32Array;
  /** Forma 2 (`pGal`). */
  readonly galaxy: Float32Array;
  /** Forma 3 (`pTur`). */
  readonly turtle: Float32Array;
  /** Forma 4 (`pEar`). */
  readonly earth: Float32Array;
  /** `aR`: 4 por partícula · x aleatorio · y etiqueta de la tortuga · z etiqueta de la Tierra · w aleatorio. */
  readonly rand: Float32Array;
}

/** Las matrices de posición de un `ShapeSet` (3 por partícula). */
export const POSITION_KEYS = ['nebula', 'galaxy', 'turtle', 'earth'] as const;

/** Nunca se generan más partículas que las del nivel Alto: los niveles solo bajan. */
export const MAX_SHAPE_COUNT = LEVEL_SETTINGS.high.particles;

/**
 * Etiquetas de `aR.y`, las partes de la tortuga (las de las placas, 20..26, están en `config/plateSlots`). Son
 * contrato: las escribe el generador y las lee el shader (`scene/shaders/glslHeader`), sin cargar los generadores.
 */
export const TURTLE_TAG = {
  shell: 0,
  /** Borde de celda o borde inferior del caparazón: la rejilla se lee por aquí. */
  shellEdge: 1,
  forest: 5,
  head: 6,
  /** Aletas: 7 y 8 delanteras, 9 y 10 traseras (`flipper + índice`). */
  flipper: 7,
  tail: 11,
  eyes: 12,
  wake: 13,
  plastron: 14,
} as const;

/** Aletas: 2 delanteras y 2 traseras (`TURTLE_TAG.flipper + índice`). */
export const TURTLE_FLIPPERS = 4;

/** Etiquetas de `aR.z`, las capas de la Tierra (contrato, como `TURTLE_TAG`). */
export const EARTH_TAG = { ocean: 0, land: 1, clouds: 2, atmosphere: 3 } as const;

const UINT32_MAX = 0xffff_ffff;

/** Por qué una petición no vale, o `null` si vale. Lo usan `generateShapes` y el protocolo del worker. */
export function shapeRequestProblem({ count, seed, plates }: ShapeRequest): string | null {
  if (!Number.isInteger(count) || count < 1 || count > MAX_SHAPE_COUNT) {
    return `count must be an integer from 1 to ${String(MAX_SHAPE_COUNT)}`;
  }
  if (!Number.isInteger(seed) || seed < 0 || seed > UINT32_MAX) {
    return 'seed must be a 32-bit unsigned integer';
  }
  const valid = plates.every(
    (label) => Number.isInteger(label) && label >= FIRST_PLATE_LABEL && label <= LAST_PLATE_LABEL,
  );
  if (!valid) {
    return `plates must be labels from ${String(FIRST_PLATE_LABEL)} to ${String(LAST_PLATE_LABEL)}`;
  }
  if (new Set(plates).size !== plates.length) return 'plates must not repeat';
  return null;
}
