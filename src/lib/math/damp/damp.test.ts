import { describe, expect, it } from 'vitest';

import { damp } from './damp';

describe('damp', () => {
  it('moves min(1, dt · rate) of the way to the target', () => {
    expect(damp(0, 2, 0.05, 3.4)).toBeCloseTo(0.34, 10);
    expect(damp(4, 2, 0.1, 3.4)).toBeCloseTo(3.32, 10);
  });

  it('a long frame lands on the target, never past it', () => {
    expect(damp(0, 2, 1, 3.4)).toBe(2);
    expect(damp(3, 1, 10, 12)).toBe(1);
  });

  it('without time (dt ≤ 0) it stays where it is', () => {
    expect(damp(1, 3, 0, 3.4)).toBe(1);
    expect(damp(1, 3, -0.5, 3.4)).toBe(1);
  });

  it('without a rate (rate ≤ 0) it stays where it is, never moving away', () => {
    expect(damp(1, 3, 0.1, 0)).toBe(1);
    expect(damp(1, 3, 0.1, -3.4)).toBe(1);
    // Ni con los dos negativos (su producto sería positivo).
    expect(damp(1, 3, -0.1, -3.4)).toBe(1);
  });

  it('a NaN time or rate does not move it (nor turn it into NaN)', () => {
    expect(damp(1, 3, Number.NaN, 3.4)).toBe(1);
    expect(damp(1, 3, 0.1, Number.NaN)).toBe(1);
  });

  it('an infinite rate lands on the target; without time it stays (no 0 · ∞)', () => {
    expect(damp(1, 3, 0.1, Infinity)).toBe(3);
    expect(damp(1, 3, 0, Infinity)).toBe(1);
  });

  it('closer than epsilon, it arrives (and stays there)', () => {
    expect(damp(1.9999, 2, 0.016, 3.4, 1e-4)).toBe(2);
    expect(damp(2, 2, 0.016, 3.4, 1e-4)).toBe(2);
    // También sin tiempo: el igualado no depende de `dt`.
    expect(damp(1.99995, 2, 0, 3.4, 1e-4)).toBe(2);
    // Sin epsilon, solo se acerca.
    expect(damp(1.9999, 2, 0.016, 3.4)).toBeLessThan(2);
  });

  it('a faster rate gets there sooner', () => {
    expect(damp(0, 1, 0.05, 12)).toBeGreaterThan(damp(0, 1, 0.05, 3.4));
  });
});
