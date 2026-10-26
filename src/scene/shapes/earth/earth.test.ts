import { describe, expect, it } from 'vitest';

import { mulberry32 } from '../prng/prng';
import { EARTH, EARTH_LAYERS, EARTH_TAG, generateEarth } from './earth';

const EPS = 1e-4;

function earth(count: number): { positions: Float32Array; rand: Float32Array } {
  const positions = new Float32Array(count * 3);
  const rand = new Float32Array(count * 4);
  generateEarth(count, mulberry32(41), positions, rand);
  return { positions, rand };
}

describe('generateEarth', () => {
  for (const count of [20_000, 60_000]) {
    it(`each layer at its radius, with its share of the particles (±1 %), at ${String(count)}`, () => {
      const { positions, rand } = earth(count);
      const tally = new Map<number, number>();
      for (let i = 0; i < count; i++) {
        const tag = rand[i * 4 + 2] ?? -1;
        tally.set(tag, (tally.get(tag) ?? 0) + 1);
        const radius = Math.hypot(
          positions[i * 3] ?? 0,
          positions[i * 3 + 1] ?? 0,
          positions[i * 3 + 2] ?? 0,
        );
        if (tag === EARTH_TAG.land || tag === EARTH_TAG.ocean) {
          expect(radius).toBeCloseTo(EARTH.surface.radius, 4);
        } else if (tag === EARTH_TAG.clouds) {
          expect(radius).toBeCloseTo(EARTH.clouds.radius, 4);
        } else {
          expect(tag).toBe(EARTH_TAG.atmosphere);
          expect(radius).toBeGreaterThanOrEqual(EARTH.atmosphere.innerRadius - EPS);
          expect(radius).toBeLessThanOrEqual(
            EARTH.atmosphere.innerRadius + EARTH.atmosphere.thickness + EPS,
          );
        }
      }
      const share = (...tags: number[]): number =>
        tags.reduce((sum, tag) => sum + (tally.get(tag) ?? 0), 0) / count;
      expect(share(EARTH_TAG.land, EARTH_TAG.ocean)).toBeCloseTo(EARTH_LAYERS.surface, 2);
      expect(share(EARTH_TAG.clouds)).toBeCloseTo(EARTH_LAYERS.clouds - EARTH_LAYERS.surface, 2);
      expect(share(EARTH_TAG.atmosphere)).toBeCloseTo(1 - EARTH_LAYERS.clouds, 2);
      // Hay continentes y océanos, no un planeta de un solo color.
      expect(share(EARTH_TAG.land)).toBeGreaterThan(0.15);
      expect(share(EARTH_TAG.ocean)).toBeGreaterThan(0.15);
    });
  }

  it('only touches aR.z (the Earth tag) in the shared aR array', () => {
    const count = 30;
    const positions = new Float32Array(count * 3);
    const rand = new Float32Array(count * 4).fill(7);
    generateEarth(count, mulberry32(1), positions, rand);
    for (let i = 0; i < count; i++) {
      expect([rand[i * 4], rand[i * 4 + 1], rand[i * 4 + 3]]).toEqual([7, 7, 7]);
    }
  });

  it('cloudless sky everywhere: after the attempts it keeps the last direction, on the cloud layer', () => {
    const count = 10;
    const positions = new Float32Array(count * 3);
    const rand = new Float32Array(count * 4);
    // El mismo número siempre: misma dirección en cada intento (el ruido no cambia), así que se agotan.
    generateEarth(count, () => 0.3, positions, rand);
    const last = count - 1;
    expect(rand[last * 4 + 2]).toBe(EARTH_TAG.atmosphere);
    const cloud = Math.floor(count * 0.8);
    expect(rand[cloud * 4 + 2]).toBe(EARTH_TAG.clouds);
    expect(
      Math.hypot(
        positions[cloud * 3] ?? 0,
        positions[cloud * 3 + 1] ?? 0,
        positions[cloud * 3 + 2] ?? 0,
      ),
    ).toBeCloseTo(EARTH.clouds.radius, 4);
  });
});
