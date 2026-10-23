import { describe, expect, it } from 'vitest';

import { smoothstep } from './smoothstep';

describe('smoothstep', () => {
  it('is 0 before the first edge, 1 after the second and 0.5 halfway', () => {
    expect(smoothstep(0.5, 1, 0.2)).toBe(0);
    expect(smoothstep(0.5, 1, 0.5)).toBe(0);
    expect(smoothstep(0.5, 1, 0.75)).toBe(0.5);
    expect(smoothstep(0.5, 1, 1)).toBe(1);
    expect(smoothstep(0.5, 1, 3)).toBe(1);
  });

  it('follows 3t² − 2t³ in between', () => {
    expect(smoothstep(0, 1, 0.25)).toBeCloseTo(0.15625, 10);
  });

  it('is a step when both edges match', () => {
    expect(smoothstep(1, 1, 0.99)).toBe(0);
    expect(smoothstep(1, 1, 1)).toBe(1);
  });
});
