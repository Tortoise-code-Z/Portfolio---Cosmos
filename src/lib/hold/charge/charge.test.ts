import { describe, expect, it } from 'vitest';

import {
  HOLD_DRAIN_PER_SECOND,
  HOLD_FILL_SECONDS,
  HOLD_MAX_STEP_SECONDS,
  stepCharge,
} from './charge';

/** Avanza `seconds` en pasos de 1/60 s, como lo haría el bucle de frames. */
function run(start: number, seconds: number, holding: boolean): number {
  let charge = start;
  const frames = Math.round(seconds * 60);
  for (let frame = 0; frame < frames; frame += 1) charge = stepCharge(charge, 1 / 60, holding);
  return charge;
}

describe('stepCharge', () => {
  it('fills in exactly HOLD_FILL_SECONDS while held', () => {
    expect(HOLD_FILL_SECONDS).toBe(1.5);
    expect(run(0, HOLD_FILL_SECONDS - 0.05, true)).toBeLessThan(1);
    expect(run(0, HOLD_FILL_SECONDS, true)).toBeCloseTo(1, 6);
  });

  it('drains at HOLD_DRAIN_PER_SECOND when released', () => {
    expect(HOLD_DRAIN_PER_SECOND).toBe(1.8);
    expect(stepCharge(0.5, 0.1, false)).toBeCloseTo(0.5 - 0.18, 6);
  });

  it('reaches exactly 1 despite floating point steps', () => {
    let charge = 0;
    for (let step = 0; step < 15; step += 1) charge = stepCharge(charge, 0.1, true);
    expect(charge).toBe(1);
  });

  it('stays between 0 and 1', () => {
    expect(stepCharge(0.99, 0.1, true)).toBe(1);
    expect(stepCharge(0.01, 0.1, false)).toBe(0);
  });

  it('caps a long gap between frames and ignores negative ones', () => {
    expect(stepCharge(0, 5, true)).toBeCloseTo(HOLD_MAX_STEP_SECONDS / HOLD_FILL_SECONDS, 6);
    expect(stepCharge(0.4, -1, true)).toBe(0.4);
  });
});
