import { clamp } from '../../math/clamp/clamp';

/**
 * La llegada del epílogo (C.7 · ADR-039; docs/02-experiencia/capitulos/05-crew-file.md → «Transición»): el tramo de
 * scroll entre Contacto y el Crew file en el que la sección se queda fija mientras la Tierra se deshace en el retrato,
 * el haz baja y el visor se cierra. Todo se mide con `a`, lo que lleva la llegada (0 → 1): `m − base` con la `m` de
 * la escena (la suavizada), así que la escena y lo que el DOM pinte encima van a la par.
 *
 * - `base`: la forma de la que sale la llegada (la Tierra, 4; llega al retrato, `base + 1`). La misma que el tramo
 *   `arrival` de `JOURNEY_SEGMENTS` (lo comprueba el test del contenido).
 * - `morphEnd`: en qué punto de la llegada ya está formado el retrato (la forma cambia antes de que pase el haz).
 * - `beam`: dónde empieza y acaba el haz su bajada de la ventana, de arriba abajo.
 *
 * El PR 2 añade el visor, el encaje y las líneas guía.
 */
export const EPILOGUE_ARRIVAL = {
  base: 4,
  morphEnd: 0.55,
  beam: [0.05, 0.7],
} as const;

/** Lo que lleva la llegada (0 → 1) con la `m` de la escena: 0 antes de la llegada, 1 desde el epílogo. */
export function arrivalProgress(m: number): number {
  return clamp(Number.isNaN(m) ? 0 : m - EPILOGUE_ARRIVAL.base, 0, 1);
}

/**
 * La `m` de la forma (y de la cámara): la de la escena, salvo en la llegada, donde el cambio de la Tierra al retrato
 * acaba en `morphEnd` en vez de al final del tramo. La escena la usa para la cámara; el shader hace la misma cuenta
 * con sus constantes (`ARRIVAL_MORPH_END`).
 */
export function arrivalShapeM(m: number): number {
  if (!(m > EPILOGUE_ARRIVAL.base)) return m;
  return EPILOGUE_ARRIVAL.base + Math.min(arrivalProgress(m) / EPILOGUE_ARRIVAL.morphEnd, 1);
}

/** Dónde va el haz (0, arriba de la ventana → 1, abajo) con lo que lleva la llegada. */
export function arrivalBeam(progress: number): number {
  const [start, end] = EPILOGUE_ARRIVAL.beam;
  return clamp((progress - start) / (end - start), 0, 1);
}
