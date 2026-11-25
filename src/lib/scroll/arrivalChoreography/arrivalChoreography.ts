import { clamp } from '../../math/clamp/clamp';
import { smoothstep } from '../../math/smoothstep/smoothstep';
import { EPILOGUE_ARRIVAL } from '../arrival/arrival';

// Lo que pinta la página durante la llegada del epílogo (ADR-039): fuera de `lib/scroll/arrival`, que entra en la
// huella de las fotos fijas (la lee la escena). Ajustar la coreografía no cambia ninguna foto.

/**
 * Lo que ha bajado el haz (0, arriba → 1, al final de su bajada) con lo que lleva la llegada: la misma cuenta que
 * `arrivalBeam()` del shader de las partículas.
 */
export function arrivalBeam(progress: number): number {
  const start = EPILOGUE_ARRIVAL.beam[0];
  const end = EPILOGUE_ARRIVAL.beam[1];
  return clamp((progress - start) / (end - start), 0, 1);
}

/**
 * Dónde va la línea del haz, en altos de la ventana desde su borde de arriba (0 → `beamReach`): la misma línea que
 * pinta el shader en pantalla, para que el haz de la página coincida con el de las partículas.
 */
export function arrivalBeamLine(progress: number): number {
  return arrivalBeam(progress) * EPILOGUE_ARRIVAL.beamReach;
}

/**
 * Los cortes de lo que pinta la página en la llegada, en lo que lleva la llegada (`a`, 0 → 1; avanza en línea recta con
 * el scroll): docs/02-experiencia/capitulos/05-crew-file.md → «Transición», como en la prueba aprobada.
 *
 * - `cornersShow`: las esquinas del visor aparecen en las de lo que se ve del escenario;
 * - `corners`: se cierran sobre el destino (el marco del visor), con una curva suave;
 * - `lock`: encajan; desde aquí la ficha se escribe con el teletipo y se enciende «Identity verified»;
 * - `guides`: las líneas guía salen del visor hacia los recuadros de la ficha.
 */
export const ARRIVAL_CHOREOGRAPHY = {
  cornersShow: [0.08, 0.2],
  corners: [0.15, 0.75],
  lock: 0.78,
  guides: [0.78, 0.92],
} as const;

/** Lo que se ven las esquinas (0 → 1): aparecen en las de lo que se ve del escenario al empezar la llegada. */
export function arrivalCornersShow(progress: number): number {
  const [start, end] = ARRIVAL_CHOREOGRAPHY.cornersShow;
  return clamp((progress - start) / (end - start), 0, 1);
}

/**
 * Lo que se han cerrado las esquinas (0, las de lo que se ve del escenario → 1, las del destino), con una curva suave.
 */
export function arrivalCorners(progress: number): number {
  const [start, end] = ARRIVAL_CHOREOGRAPHY.corners;
  return smoothstep(start, end, progress);
}

/** Si las esquinas ya han encajado en el destino: la ficha se escribe desde aquí. */
export function arrivalLocked(progress: number): boolean {
  return progress >= ARRIVAL_CHOREOGRAPHY.lock;
}

/** Lo que han salido las líneas guía del visor (0 → 1), en línea recta desde el encaje. */
export function arrivalGuides(progress: number): number {
  const [start, end] = ARRIVAL_CHOREOGRAPHY.guides;
  return clamp((progress - start) / (end - start), 0, 1);
}
