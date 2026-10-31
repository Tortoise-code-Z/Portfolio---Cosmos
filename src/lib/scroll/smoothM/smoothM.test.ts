import { describe, expect, it } from 'vitest';

import { M_SMOOTHING, smoothM } from './smoothM';

describe('smoothM', () => {
  it('chases the target at rate 3.4 per second', () => {
    expect(smoothM(0, 1, 0.1, false)).toBeCloseTo(0.34, 10);
    expect(smoothM(3, 1, 0.05, false)).toBeCloseTo(3 - 2 * 0.05 * M_SMOOTHING.rate, 10);
  });

  it('with reduced motion it barely lags (rate 12)', () => {
    expect(smoothM(0, 1, 0.05, true)).toBeCloseTo(0.6, 10);
  });

  it('never overshoots and lands exactly when it is close enough', () => {
    expect(smoothM(0, 1, 1, false)).toBe(1);
    expect(smoothM(1 - 5e-5, 1, 0.001, false)).toBe(1);
  });

  it('does not move without time', () => {
    expect(smoothM(0.4, 1, 0, false)).toBe(0.4);
  });
});
