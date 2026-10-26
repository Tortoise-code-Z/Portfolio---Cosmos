import { describe, expect, it } from 'vitest';

import { mulberry32 } from '../prng/prng';
import { boundedGauss, randomDirection, type Vec3 } from './sampling';

describe('randomDirection', () => {
  it('writes a unit vector into the vector it is given, and returns it', () => {
    const rng = mulberry32(11);
    const out: Vec3 = [0, 0, 0];
    for (let i = 0; i < 1000; i++) {
      expect(randomDirection(rng, out)).toBe(out);
      expect(Math.hypot(...out)).toBeCloseTo(1, 12);
    }
  });

  it('covers the sphere evenly: each axis averages ~0 and each half gets ~half', () => {
    const rng = mulberry32(5);
    const out: Vec3 = [0, 0, 0];
    const sums = [0, 0, 0];
    let up = 0;
    const n = 20_000;
    for (let i = 0; i < n; i++) {
      randomDirection(rng, out);
      sums[0] = (sums[0] ?? 0) + out[0];
      sums[1] = (sums[1] ?? 0) + out[1];
      sums[2] = (sums[2] ?? 0) + out[2];
      if (out[1] > 0) up++;
    }
    for (const sum of sums) expect(sum / n).toBeCloseTo(0, 1);
    expect(up / n).toBeCloseTo(0.5, 1);
  });

  it('the edges of the random range give the poles', () => {
    const out: Vec3 = [0, 0, 0];
    randomDirection(() => 0, out);
    expect(out).toEqual([0, -1, 0]);
  });
});

describe('boundedGauss', () => {
  it('stays within [−1, 1], centred, with a standard deviation of ~0.29', () => {
    const rng = mulberry32(9);
    const values = Array.from({ length: 20_000 }, () => boundedGauss(rng));
    expect(Math.min(...values)).toBeGreaterThanOrEqual(-1);
    expect(Math.max(...values)).toBeLessThanOrEqual(1);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
    expect(mean).toBeCloseTo(0, 1);
    expect(Math.sqrt(variance)).toBeCloseTo(Math.sqrt(1 / 12), 1);
  });

  it('its extremes are exactly ±1', () => {
    expect(boundedGauss(() => 0)).toBe(-1);
    expect(boundedGauss(() => 1)).toBe(1);
  });
});
