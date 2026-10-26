import type { Rng } from '../prng/prng';
import { randomDirection, type Vec3 } from '../sampling/sampling';

/**
 * Estrellas de fondo (docs/04-escena/particulas-y-shaders.md → «Estrellas de fondo»): puntos en una cáscara
 * esférica lejana, con un número aleatorio por estrella (tamaño, titileo y tono). Se generan en el hilo
 * principal: son pocas (≤ 5.000, `LEVEL_SETTINGS`) y no viajan en el worker.
 */
export const STARS = { minRadius: 70, radiusRange: 60 } as const;

/** Escribe `count` posiciones en `positions` (3 por estrella) y su número aleatorio en `rand` (1 por estrella). */
export function generateStars(
  count: number,
  rng: Rng,
  positions: Float32Array,
  rand: Float32Array,
): void {
  const direction: Vec3 = [0, 0, 0];
  for (let i = 0; i < count; i++) {
    randomDirection(rng, direction);
    const radius = STARS.minRadius + rng() * STARS.radiusRange;
    positions[i * 3] = direction[0] * radius;
    positions[i * 3 + 1] = direction[1] * radius;
    positions[i * 3 + 2] = direction[2] * radius;
    rand[i] = rng();
  }
}
