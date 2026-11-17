import { describe, expect, it } from 'vitest';

import { HOLD_MAX_STEP_SECONDS } from '~/lib/hold/charge/charge';

import { createSceneClock, MAX_STEP_S } from './sceneClock';

describe('createSceneClock', () => {
  it('advances with the frames, from 0 on the first one', () => {
    const clock = createSceneClock();
    clock.tick(5);
    expect(clock.time).toBe(0);
    expect(clock.delta).toBe(0);
    clock.tick(5.05);
    clock.tick(5.1);
    expect(clock.time).toBeCloseTo(0.1, 10);
    expect(clock.delta).toBeCloseTo(0.05, 10);
  });

  it('a long gap (a hidden tab) moves it at most MAX_STEP_S; time never goes back', () => {
    const clock = createSceneClock();
    clock.tick(0);
    clock.tick(30);
    expect(clock.time).toBe(MAX_STEP_S);
    expect(clock.delta).toBe(MAX_STEP_S);
    clock.tick(29);
    expect(clock.time).toBe(MAX_STEP_S);
    expect(clock.delta).toBe(0);
  });

  it('reduced from the first frame: stands still from 0, while the real delta runs', () => {
    const clock = createSceneClock();
    clock.setReduced(true);
    clock.tick(0);
    clock.tick(0.05);
    expect(clock.time).toBe(0);
    expect(clock.delta).toBeCloseTo(0.05, 10);
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
    // El tiempo real sigue corriendo para los suavizados (el paralaje).
    expect(clock.delta).toBeCloseTo(0.05, 10);
    clock.setReduced(false);
    clock.tick(0.2);
    expect(clock.time).toBeCloseTo(0.1, 10);
  });
});

describe('MAX_STEP_S', () => {
  it('is the step cap of the Big Bang loop in the DOM: both copies of m stay together on slow frames (ADR-030)', () => {
    // `useBigBang` topa su paso con el de la carga (`HOLD_MAX_STEP_SECONDS`) y la escena, con este: si uno cambia,
    // con frames lentos sus `m` se desfasan sin que falle nada más.
    expect(HOLD_MAX_STEP_SECONDS).toBe(MAX_STEP_S);
  });
});
