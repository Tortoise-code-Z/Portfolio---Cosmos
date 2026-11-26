import { describe, expect, it } from 'vitest';

import { NO_PLATE, PLATE_LOOK } from '../../config/plateSlots/plateSlots';
import { chapterPresence } from '../chapterPresence/chapterPresence';
import {
  createPlateCycle,
  createPlateStep,
  stepPlates,
  type PlateCycle,
  type PlateStep,
} from './plateCycle';

const LABELS = [20, 21, 22] as const;

/** Un paso; con `pointed`, señalado (`pointing`) salvo que se diga lo contrario. */
function at(m: number, delta: number, extra: Partial<PlateStep> = {}): PlateStep {
  const pointing = extra.pointing ?? (extra.pointed !== undefined && extra.pointed !== NO_PLATE);
  // La tortuga, con la rampa de siempre: sin naves, su presencia es la de su capítulo con esa `m`.
  return {
    ...createPlateStep(),
    presence: chapterPresence(m, PLATE_LOOK.chapter),
    delta,
    ...extra,
    pointing,
  };
}

/** Avanza `seconds` a 60 fps en la tortuga y devuelve la última placa. */
function run(cycle: PlateCycle, seconds: number, extra: Partial<PlateStep> = {}): number {
  let plate = NO_PLATE;
  for (let t = 0; t < seconds - 1e-9; t += 1 / 60)
    plate = stepPlates(cycle, LABELS, at(3, 1 / 60, extra));
  return plate;
}

describe('stepPlates', () => {
  it('a fresh cycle starts on the first plate (the featured one) and none without content', () => {
    expect(createPlateCycle()).toEqual({ index: 0, elapsed: 0 });
    expect(createPlateStep()).toEqual({
      presence: 0,
      delta: 0,
      reducedMotion: false,
      transmission: false,
      pointing: false,
      pointed: NO_PLATE,
    });
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
    // En la segunda placa (índice 1), a 0,4 s de la tercera: si el ciclo volviera al principio, se notaría.
    expect(run(cycle, 3)).toBe(21);
    expect(stepPlates(cycle, LABELS, at(3, 1 / 60, { pointed: 22 }))).toBe(22);
    expect(run(cycle, 10, { pointed: 22 })).toBe(22);
    expect(cycle).toEqual({ index: 1, elapsed: 0 });
    expect(run(cycle, 2.5)).toBe(21);
    expect(run(cycle, 0.2)).toBe(22);
  });

  it('a pointed project without a plate (an 8th one) stops the cycle too, and lights none', () => {
    const cycle = createPlateCycle();
    run(cycle, 3);
    expect(run(cycle, 10, { pointing: true, pointed: NO_PLATE })).toBe(NO_PLATE);
    expect(cycle).toEqual({ index: 1, elapsed: 0 });
    expect(run(cycle, 0.1)).toBe(21);
  });

  it('with reduced motion there is no cycle: only the pointed plate lights', () => {
    const cycle = createPlateCycle();
    expect(run(cycle, 6, { reducedMotion: true })).toBe(NO_PLATE);
    expect(cycle).toEqual({ index: 0, elapsed: 0 });
    expect(stepPlates(cycle, LABELS, at(3, 1, { reducedMotion: true, pointed: 21 }))).toBe(21);
  });

  it('while an interlude is read (the turtle behind the veil of Mission control) no plate lights and the cycle waits', () => {
    const cycle = createPlateCycle();
    expect(run(cycle, 3)).toBe(21);
    expect(run(cycle, 10, { transmission: true })).toBe(NO_PLATE);
    expect(cycle).toEqual({ index: 1, elapsed: 0 });
    expect(stepPlates(cycle, LABELS, at(3, 0, { transmission: true, pointed: 22 }))).toBe(NO_PLATE);
    // Al salir, vuelve a contar desde cero en la placa en la que estaba.
    expect(run(cycle, 2.5)).toBe(21);
    expect(run(cycle, 0.2)).toBe(22);
  });

  it('away from the turtle (presence 0.2 or less) no plate lights, not even the pointed one, and the cycle waits', () => {
    const cycle = createPlateCycle();
    run(cycle, 3);
    // Presencia 0,2 a |m − 3| = 0,444…: a 0,45, 0,19; a 0,43, 0,226.
    expect(stepPlates(cycle, LABELS, at(2.55, 1, { pointed: 21 }))).toBe(NO_PLATE);
    expect(stepPlates(cycle, LABELS, at(2, 5))).toBe(NO_PLATE);
    expect(cycle).toEqual({ index: 1, elapsed: 0 });
    expect(stepPlates(cycle, LABELS, at(2.57, 0))).toBe(21);
    expect(stepPlates(cycle, LABELS, at(3.4, 0, { pointed: 22 }))).toBe(22);
  });
});
