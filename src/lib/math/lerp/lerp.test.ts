import { describe, expect, it } from 'vitest';

import { lerp } from './lerp';

describe('lerp', () => {
  it('returns the ends at 0 and 1 and the midpoint at 0.5', () => {
    expect(lerp(2, 10, 0)).toBe(2);
    expect(lerp(2, 10, 1)).toBe(10);
    expect(lerp(2, 10, 0.5)).toBe(6);
  });

  it('extrapolates outside [0, 1]', () => {
    expect(lerp(0, 10, 1.5)).toBe(15);
  });
});
