import { damp } from '../../math/damp/damp';

/**
 * Suavizado de `m` (docs/02-experiencia/scroll-y-escena.md → «Suavizado», ADR-028 y ADR-030): persigue a
 * `mTarget` a ritmo `rate` (`min(1, dt · rate)`), `reducedRate` con movimiento reducido (casi sin inercia), y llega
 * cuando le falta menos de `epsilon`. Lo comparten la escena y los efectos del Big Bang en el DOM, para que el
 * destello y el nombre vayan al paso de la explosión.
 */
export const M_SMOOTHING = { rate: 3.4, reducedRate: 12, epsilon: 1e-4 } as const;

/** Un paso del suavizado de `m`: `delta` son los segundos reales del frame. */
export function smoothM(current: number, target: number, delta: number, reduced: boolean): number {
  return damp(
    current,
    target,
    delta,
    reduced ? M_SMOOTHING.reducedRate : M_SMOOTHING.rate,
    M_SMOOTHING.epsilon,
  );
}
