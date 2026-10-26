import { describe, expect, it } from 'vitest';

import { mulberry32 } from '../prng/prng';
import { generateStars, STARS } from './stars';

const EPS = 1e-4;

describe('generateStars', () => {
  const count = 5000;
  const positions = new Float32Array(count * 3);
  const rand = new Float32Array(count);
  generateStars(count, mulberry32(7), positions, rand);

  it('every star in the far shell, with its random number in [0, 1)', () => {
    for (let i = 0; i < count; i++) {
      const radius = Math.hypot(
        positions[i * 3] ?? 0,
        positions[i * 3 + 1] ?? 0,
        positions[i * 3 + 2] ?? 0,
      );
      expect(radius).toBeGreaterThanOrEqual(STARS.minRadius - EPS);
      expect(radius).toBeLessThanOrEqual(STARS.minRadius + STARS.radiusRange + EPS);
      expect(rand[i]).toBeGreaterThanOrEqual(0);
      expect(rand[i]).toBeLessThan(1);
    }
  });

  it('all around the sky, not in one corner (every octant has stars)', () => {
    const octants = new Array<number>(8).fill(0);
    for (let i = 0; i < count; i++) {
      const octant =
        Number((positions[i * 3] ?? 0) > 0) +
        Number((positions[i * 3 + 1] ?? 0) > 0) * 2 +
        Number((positions[i * 3 + 2] ?? 0) > 0) * 4;
      octants[octant] = (octants[octant] ?? 0) + 1;
    }
    for (const stars of octants) expect(stars / count).toBeGreaterThan(0.1);
  });

  it('the same seed gives the same sky', () => {
    const again = new Float32Array(count * 3);
    generateStars(count, mulberry32(7), again, new Float32Array(count));
    expect(again).toEqual(positions);
  });
});
