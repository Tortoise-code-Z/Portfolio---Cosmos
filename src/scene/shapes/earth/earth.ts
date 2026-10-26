import { fbm } from '../noise/noise';
import type { Rng } from '../prng/prng';
import { randomDirection, type Vec3 } from '../sampling/sampling';

/**
 * Forma 4 · Tierra (docs/04-escena/formas.md): superficie con continentes y océanos, nubes y atmósfera (`pEar`),
 * con la etiqueta de cada capa en `aR.z`. Las capas van por índice; los números son los del prototipo.
 */

/** Etiquetas de `aR.z`. */
export const EARTH_TAG = { ocean: 0, land: 1, clouds: 2, atmosphere: 3 } as const;

/** Hasta qué fracción del índice llega cada capa (el resto, la atmósfera). */
export const EARTH_LAYERS = { surface: 0.74, clouds: 0.88 } as const;

export const EARTH = {
  surface: {
    radius: 3,
    /** Tierra donde el ruido pasa del umbral; desplazado para que los continentes caigan donde el prototipo. */
    noiseScale: 1.6,
    noiseOffset: [4, 0, -2],
    landAbove: 0.1,
  },
  clouds: {
    radius: 3.09,
    /** Escala del ruido por eje (más estirado en Y: bandas) y su desplazamiento. */
    noiseScale: [2.4, 3.2, 2.4],
    noiseOffset: [0, 7, 0],
    /** Se rechaza una dirección donde el ruido no llega (cielo despejado), con tope de intentos. */
    clearBelow: 0.05,
    maxAttempts: 20,
  },
  atmosphere: { innerRadius: 3.12, thickness: 0.3 },
} as const;

/** Escribe `count` posiciones (x, y, z) en `positions` y la capa de cada partícula en `rand` (`aR.z`). */
export function generateEarth(
  count: number,
  rng: Rng,
  positions: Float32Array,
  rand: Float32Array,
): void {
  const { surface, clouds, atmosphere } = EARTH;
  const direction: Vec3 = [0, 0, 0];
  for (let i = 0; i < count; i++) {
    const f = i / count;
    randomDirection(rng, direction);
    let radius: number;
    let tag: number;
    if (f < EARTH_LAYERS.surface) {
      const [ox, oy, oz] = surface.noiseOffset;
      const noise = fbm(
        direction[0] * surface.noiseScale + ox,
        direction[1] * surface.noiseScale + oy,
        direction[2] * surface.noiseScale + oz,
      );
      radius = surface.radius;
      tag = noise > surface.landAbove ? EARTH_TAG.land : EARTH_TAG.ocean;
    } else if (f < EARTH_LAYERS.clouds) {
      // Como el prototipo: se vuelve a sortear la dirección mientras el cielo esté despejado; si se agotan
      // los intentos, se queda la última (sigue sobre la capa de nubes).
      const [sx, sy, sz] = clouds.noiseScale;
      const [ox, oy, oz] = clouds.noiseOffset;
      for (let attempt = 1; attempt < clouds.maxAttempts; attempt++) {
        const noise = fbm(direction[0] * sx + ox, direction[1] * sy + oy, direction[2] * sz + oz);
        if (noise >= clouds.clearBelow) break;
        randomDirection(rng, direction);
      }
      radius = clouds.radius;
      tag = EARTH_TAG.clouds;
    } else {
      radius = atmosphere.innerRadius + rng() ** 2 * atmosphere.thickness;
      tag = EARTH_TAG.atmosphere;
    }
    positions[i * 3] = direction[0] * radius;
    positions[i * 3 + 1] = direction[1] * radius;
    positions[i * 3 + 2] = direction[2] * radius;
    rand[i * 4 + 2] = tag;
  }
}
