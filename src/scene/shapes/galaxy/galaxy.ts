import type { Rng } from '../prng/prng';
import { randomDirection, TAU, type Vec3 } from '../sampling/sampling';

/** Forma 2 · Galaxia (docs/04-escena/formas.md): un bulbo achatado y tres brazos en espiral (`pGal`). */
export const GALAXY = {
  /** Parte del bulbo, al azar por partícula. */
  bulgeShare: 0.15,
  bulge: { radius: 1.7, exponent: 1.8, flattenY: 0.55 },
  arms: {
    count: 3,
    /** Radio: `rng^exponente · alcance + mínimo`. */
    radiusExponent: 1.25,
    reach: 8,
    minRadius: 0.35,
    /** Cuánto gira el brazo por unidad de radio. */
    twist: 0.62,
    /** Dispersión: `rng^exponente · (base + r · pendiente)`, con signo al azar. */
    scatterExponent: 2.6,
    scatterBase: 0.35,
    scatterSlope: 0.14,
    /** Grosor vertical: `dispersión · escala · (offset − r / alcance)`, más fino hacia fuera. */
    thicknessScale: 0.45,
    thicknessOffset: 1.2,
  },
} as const;

/** Desvío de un brazo: concentrado cerca de 0 (`rng^2,6`), con signo al azar y hasta ±`spread`. */
function scatter(rng: Rng, spread: number): number {
  return rng() ** GALAXY.arms.scatterExponent * (rng() < 0.5 ? 1 : -1) * spread;
}

/** Escribe `count` posiciones (x, y, z) en `out`. El brazo de cada partícula va por índice (`i mod 3`). */
export function generateGalaxy(count: number, rng: Rng, out: Float32Array): void {
  const { bulge, arms } = GALAXY;
  const direction: Vec3 = [0, 0, 0];
  for (let i = 0; i < count; i++) {
    let x: number;
    let y: number;
    let z: number;
    if (rng() < GALAXY.bulgeShare) {
      randomDirection(rng, direction);
      const radius = rng() ** bulge.exponent * bulge.radius;
      x = direction[0] * radius;
      y = direction[1] * radius * bulge.flattenY;
      z = direction[2] * radius;
    } else {
      const radius = rng() ** arms.radiusExponent * arms.reach + arms.minRadius;
      const angle = ((i % arms.count) / arms.count) * TAU + radius * arms.twist;
      const spread = arms.scatterBase + radius * arms.scatterSlope;
      x = Math.cos(angle) * radius + scatter(rng, spread);
      z = Math.sin(angle) * radius + scatter(rng, spread);
      y = scatter(rng, spread) * arms.thicknessScale * (arms.thicknessOffset - radius / arms.reach);
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
}
