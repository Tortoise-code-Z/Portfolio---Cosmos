import { describe, expect, it } from 'vitest';

import { mulberry32 } from '../prng/prng';
import { fbm, n3 } from './noise';

/** La fórmula del prototipo (docs/referencia/prototipo-v0.1.html), tal cual: la referencia de los valores. */
const prototypeN3 = (x: number, y: number, z: number): number =>
  (Math.sin(x * 1.7 + Math.sin(y * 1.3 + z * 0.7) * 1.5) +
    Math.sin(y * 2.1 + Math.sin(z * 1.9 + x * 0.5) * 1.2) +
    Math.sin(z * 1.5 + Math.sin(x * 2.3 + y * 0.9) * 1.4)) /
  3;
const prototypeFbm = (x: number, y: number, z: number): number =>
  (prototypeN3(x, y, z) +
    0.5 * prototypeN3(x * 2.03, y * 2.03, z * 2.03) +
    0.25 * prototypeN3(x * 4.1, y * 4.1, z * 4.1)) /
  1.75;

const points = (() => {
  const rng = mulberry32(3);
  return Array.from(
    { length: 500 },
    () => [rng() * 20 - 10, rng() * 20 - 10, rng() * 20 - 10] as const,
  );
})();

describe('n3 and fbm', () => {
  it('give the prototype values (the look Víctor approved)', () => {
    for (const [x, y, z] of points) {
      expect(n3(x, y, z)).toBeCloseTo(prototypeN3(x, y, z), 12);
      expect(fbm(x, y, z)).toBeCloseTo(prototypeFbm(x, y, z), 12);
    }
  });

  it('stay within [−1, 1] and are not flat', () => {
    const values = points.flatMap(([x, y, z]) => [n3(x, y, z), fbm(x, y, z)]);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(-1);
    expect(Math.max(...values)).toBeLessThanOrEqual(1);
    expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(0.5);
  });

  it('are pure: the same point gives the same value', () => {
    expect(fbm(1.25, -3.5, 0.75)).toBe(fbm(1.25, -3.5, 0.75));
  });
});
