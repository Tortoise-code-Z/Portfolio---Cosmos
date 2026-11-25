import { clamp } from '../../math/clamp/clamp';

/**
 * La llegada del epílogo (C.7 · ADR-039; docs/02-experiencia/capitulos/05-crew-file.md → «Transición»): el tramo de
 * scroll entre Contacto y el Crew file en el que la sección se queda fija mientras la Tierra se deshace en el retrato,
 * el haz baja y el visor se cierra. Todo se mide con `a`, lo que lleva la llegada (0 → 1): `m − base` con la `m` de
 * la escena (la suavizada), así que la escena y lo que el DOM pinte encima van a la par. El tramo avanza al ritmo del
 * scroll, sin suavizar (`linear` en `JOURNEY_SEGMENTS`): `a` es también la fracción recorrida de la llegada.
 *
 * Aquí va solo lo que lee la escena (el shader, por su cabecera; la cámara, el Sol y la gravedad): esta carpeta entra
 * en la huella de las fotos fijas. Lo que solo pinta la página va en `lib/scroll/arrivalChoreography`, fuera de ella.
 *
 * - `base`: la forma de la que sale la llegada (la Tierra, 4; llega al retrato, `base + 1`). La misma que el tramo
 *   `arrival` de `JOURNEY_SEGMENTS` (lo comprueba `routes/journey/journey.test.tsx`).
 * - `morphEnd`: en qué punto de la llegada ya está formado el retrato (la forma cambia antes de que pase el haz).
 * - `beam`: dónde empieza y acaba el haz su bajada de la ventana, de arriba abajo.
 * - `beamReach`: hasta dónde baja la línea del haz, en altos de la ventana desde arriba: algo más allá del borde de
 *   abajo, para que su brillo salga entero de la pantalla antes de pararse.
 */
export const EPILOGUE_ARRIVAL = {
  base: 4,
  morphEnd: 0.55,
  beam: [0.05, 0.7],
  beamReach: 1.025,
} as const;

/** Lo que lleva la llegada (0 → 1) con la `m` de la escena: 0 antes de la llegada, 1 desde el epílogo. */
export function arrivalProgress(m: number): number {
  return clamp(Number.isNaN(m) ? 0 : m - EPILOGUE_ARRIVAL.base, 0, 1);
}

/**
 * La `m` de la forma (y de la cámara): la de la escena, salvo en la llegada, donde el cambio de la Tierra al retrato
 * acaba en `morphEnd` en vez de al final del tramo. La escena la usa para la cámara, el Sol y la gravedad, y el modo
 * sin WebGL para elegir la foto fija; el shader la recibe en sus formas (`uFrom`, `uTo`, `uT`: `lib/scroll/shapeTrack`,
 * ADR-041).
 */
export function arrivalShapeM(m: number): number {
  if (!(m > EPILOGUE_ARRIVAL.base)) return m;
  return EPILOGUE_ARRIVAL.base + Math.min(arrivalProgress(m) / EPILOGUE_ARRIVAL.morphEnd, 1);
}
