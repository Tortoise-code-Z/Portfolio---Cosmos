// Carga del «mantén pulsado para detonar» (docs/02-experiencia/capitulos/00-singularidad.md ·
// docs/03-diseno/movimiento.md → «Constantes de la experiencia»).

/** Segundos manteniendo pulsado para llenar la carga de 0 a 1. */
export const HOLD_FILL_SECONDS = 1.5;

/** Ritmo de descarga al soltar, en carga por segundo. */
export const HOLD_DRAIN_PER_SECOND = 1.8;

/** Paso máximo que se acepta entre dos frames: tras una pestaña oculta no se llena de golpe. */
export const HOLD_MAX_STEP_SECONDS = 0.1;

/** Margen para que la suma de pasos llegue a 1 exacto (0,1 + 0,1 + … no da 1 en coma flotante). */
const FULL_EPSILON = 1e-9;

/** Carga tras `dtSeconds`: sube mientras se mantiene y baja al soltar, siempre entre 0 y 1. */
export function stepCharge(charge: number, dtSeconds: number, holding: boolean): number {
  const dt = Math.min(Math.max(dtSeconds, 0), HOLD_MAX_STEP_SECONDS);
  const next = holding ? charge + dt / HOLD_FILL_SECONDS : charge - dt * HOLD_DRAIN_PER_SECOND;
  if (next >= 1 - FULL_EPSILON) return 1;
  return Math.max(0, next);
}
