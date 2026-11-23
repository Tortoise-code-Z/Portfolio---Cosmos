import { describe, expect, it } from 'vitest';

import { NO_PLATE } from '../../config/plateSlots/plateSlots';
import {
  createPlateCycle,
  createPlateStep,
  stepPlates,
  turtlePresence,
  type PlateCycle,
  type PlateStep,
} from './plateCycle';

const LABELS = [20, 21, 22] as const;

function at(m: number, delta: number, extra: Partial<PlateStep> = {}): PlateStep {
  return { ...createPlateStep(), m, delta, ...extra };
}

/** Avanza `seconds` a 60 fps en la tortuga y devuelve la última placa. */
function run(cycle: PlateCycle, seconds: number, extra: Partial<PlateStep> = {}): number {
  let plate = NO_PLATE;
  for (let t = 0; t < seconds - 1e-9; t += 1 / 60)
    plate = stepPlates(cycle, LABELS, at(3, 1 / 60, extra));
  return plate;
}

describe('turtlePresence', () => {
  it('is 1 at the turtle and fades out by 0.56 on either side', () => {
    expect(turtlePresence(3)).toBe(1);
    expect(turtlePresence(3.25)).toBeCloseTo(1 - 0.25 * 1.8, 10);
    expect(turtlePresence(2.75)).toBeCloseTo(1 - 0.25 * 1.8, 10);
    expect(turtlePresence(2.44)).toBe(0);
    expect(turtlePresence(4)).toBe(0);
  });
});

describe('stepPlates', () => {
  it('a fresh cycle starts on the first plate (the featured one) and none without content', () => {
    expect(createPlateCycle()).toEqual({ index: 0, elapsed: 0 });
    expect(createPlateStep()).toEqual({ m: 0, delta: 0, reducedMotion: false, pointed: NO_PLATE });
    expect(stepPlates(createPlateCycle(), LABELS, at(3, 0))).toBe(20);
    expect(stepPlates(createPlateCycle(), [], at(3, 1))).toBe(NO_PLATE);
  });

  it('lights the plates in turn every 2.6 s, back to the first after the last', () => {
    const cycle = createPlateCycle();
    expect(run(cycle, 2.5)).toBe(20);
    expect(run(cycle, 0.2)).toBe(21);
    expect(run(cycle, 2.6)).toBe(22);
    expect(run(cycle, 2.6)).toBe(20);
  });

  it('a long frame moves on as many plates as it covers', () => {
    const cycle = createPlateCycle();
    expect(stepPlates(cycle, LABELS, at(3, 2.6 * 4 + 0.1))).toBe(21);
    expect(cycle.elapsed).toBeCloseTo(0.1, 10);
  });

  it('a step that is not a number (or negative) does not move it nor break it', () => {
    const cycle = createPlateCycle();
    stepPlates(cycle, LABELS, at(3, 1));
    stepPlates(cycle, LABELS, at(3, Number.NaN));
    stepPlates(cycle, LABELS, at(3, -5));
    expect(cycle).toEqual({ index: 0, elapsed: 1 });
    expect(run(cycle, 1.7)).toBe(21);
  });

  it('a pointed project wins and stops the cycle; on release it counts from zero on the plate it was on', () => {
    const cycle = createPlateCycle();
    run(cycle, 2);
    expect(stepPlates(cycle, LABELS, at(3, 1 / 60, { pointed: 22 }))).toBe(22);
    expect(run(cycle, 10, { pointed: 22 })).toBe(22);
    expect(cycle).toEqual({ index: 0, elapsed: 0 });
    expect(run(cycle, 2.5)).toBe(20);
    expect(run(cycle, 0.2)).toBe(21);
  });

  it('with reduced motion there is no cycle: only the pointed plate lights', () => {
    const cycle = createPlateCycle();
    expect(run(cycle, 6, { reducedMotion: true })).toBe(NO_PLATE);
    expect(cycle).toEqual({ index: 0, elapsed: 0 });
    expect(stepPlates(cycle, LABELS, at(3, 1, { reducedMotion: true, pointed: 21 }))).toBe(21);
  });

  it('away from the turtle (presence 0.2 or less) no plate lights, not even the pointed one, and the cycle waits', () => {
    const cycle = createPlateCycle();
    run(cycle, 2);
    // Presencia 0,2 a |m − 3| = 0,444…: a 0,45, 0,19; a 0,43, 0,226.
    expect(stepPlates(cycle, LABELS, at(2.55, 1, { pointed: 21 }))).toBe(NO_PLATE);
    expect(stepPlates(cycle, LABELS, at(2, 5))).toBe(NO_PLATE);
    expect(cycle.elapsed).toBe(0);
    expect(stepPlates(cycle, LABELS, at(2.57, 0))).toBe(20);
    expect(stepPlates(cycle, LABELS, at(3.4, 0, { pointed: 22 }))).toBe(22);
  });
});
