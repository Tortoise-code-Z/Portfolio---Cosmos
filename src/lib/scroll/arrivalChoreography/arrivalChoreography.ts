import { clamp } from '../../math/clamp/clamp';
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
