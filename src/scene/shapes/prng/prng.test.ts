import { describe, expect, it } from 'vitest';

import { mulberry32, subSeed } from './prng';

const take = (rng: () => number, n: number): number[] => Array.from({ length: n }, rng);

describe('mulberry32', () => {
  it('the same seed gives the same sequence', () => {
    expect(take(mulberry32(42), 5)).toEqual(take(mulberry32(42), 5));
  });

  it('known values: the algorithm does not drift (the universe would change)', () => {
    expect(take(mulberry32(1), 3)).toEqual([
      0.6270739405881613, 0.002735721180215478, 0.5274470399599522,
    ]);
  });

  it('different seeds give different sequences', () => {
    expect(take(mulberry32(1), 5)).not.toEqual(take(mulberry32(2), 5));
  });

  it('stays in [0, 1) and spreads evenly', () => {
    const values = take(mulberry32(7), 20_000);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThan(1);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    expect(mean).toBeCloseTo(0.5, 1);
    const lowHalf = values.filter((value) => value < 0.5).length / values.length;
    expect(lowHalf).toBeCloseTo(0.5, 1);
  });

  it('takes any number as seed, kept to 32 bits', () => {
    expect(take(mulberry32(2 ** 32 + 5), 3)).toEqual(take(mulberry32(5), 3));
  });
});

describe('subSeed', () => {
  it('is stable: the same seed and name give the same 32-bit result', () => {
    expect(subSeed(123, 'nebula')).toBe(subSeed(123, 'nebula'));
    expect(Number.isInteger(subSeed(123, 'nebula'))).toBe(true);
    expect(subSeed(123, 'nebula')).toBeGreaterThanOrEqual(0);
    expect(subSeed(123, 'nebula')).toBeLessThan(2 ** 32);
  });

  it('every part gets its own stream, and the project seed changes them all', () => {
    const parts = ['nebula', 'galaxy', 'turtle', 'earth', 'rand'];
    expect(new Set(parts.map((name) => subSeed(1, name))).size).toBe(parts.length);
    for (const name of parts) expect(subSeed(1, name)).not.toBe(subSeed(2, name));
  });
});
