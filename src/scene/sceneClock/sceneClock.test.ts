import { describe, expect, it } from 'vitest';

import { createSceneClock, MAX_STEP_S } from './sceneClock';

describe('createSceneClock', () => {
  it('advances with the frames, from 0 on the first one', () => {
    const clock = createSceneClock();
    clock.tick(5);
    expect(clock.time).toBe(0);
    clock.tick(5.05);
    clock.tick(5.1);
    expect(clock.time).toBeCloseTo(0.1, 10);
  });

  it('a long gap (a hidden tab) moves it at most MAX_STEP_S; time never goes back', () => {
    const clock = createSceneClock();
    clock.tick(0);
    clock.tick(30);
    expect(clock.time).toBe(MAX_STEP_S);
    clock.tick(29);
    expect(clock.time).toBe(MAX_STEP_S);
  });

  it('stands still with reduced motion, and goes on from there without a jump', () => {
    const clock = createSceneClock();
    clock.tick(0);
    clock.tick(0.05);
    clock.setReduced(true);
    expect(clock.reduced).toBe(true);
    clock.tick(0.1);
    clock.tick(0.15);
    expect(clock.time).toBeCloseTo(0.05, 10);
    clock.setReduced(false);
    clock.tick(0.2);
    expect(clock.time).toBeCloseTo(0.1, 10);
  });
});
