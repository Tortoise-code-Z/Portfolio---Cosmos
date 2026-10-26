import { describe, expect, it } from 'vitest';

import { PLATE_SLOTS } from '../../config/plateSlots/plateSlots';
import { MAX_SHAPE_COUNT, type ShapeRequest, shapeRequestProblem } from './shapeContract';

const request = (overrides: Partial<ShapeRequest> = {}): ShapeRequest => ({
  count: 30,
  seed: 1,
  plates: [20, 21, 22],
  ...overrides,
});

describe('shapeRequestProblem', () => {
  it.each<[string, Partial<ShapeRequest>, RegExp]>([
    ['count 0', { count: 0 }, /count/],
    ['count over the high level', { count: MAX_SHAPE_COUNT + 1 }, /count/],
    ['count not an integer', { count: 10.5 }, /count/],
    ['count NaN', { count: Number.NaN }, /count/],
    ['seed negative', { seed: -1 }, /seed/],
    ['seed over 32 bits', { seed: 2 ** 32 }, /seed/],
    ['seed not an integer', { seed: 1.5 }, /seed/],
    ['a plate label out of 20..26', { plates: [19] }, /plates/],
    ['a plate label not an integer', { plates: [20.5] }, /plates/],
    ['a repeated plate', { plates: [20, 20] }, /repeat/],
  ])('rejects %s, and says why', (_name, overrides, message) => {
    expect(shapeRequestProblem(request(overrides))).toMatch(message);
  });

  it('accepts the edges of the range: no plates or all seven, count 1 and the high level, seed 0 and 2³² − 1', () => {
    expect(shapeRequestProblem(request({ plates: [] }))).toBeNull();
    expect(
      shapeRequestProblem(
        request({ plates: PLATE_SLOTS.map(({ label }) => label), count: 1, seed: 0 }),
      ),
    ).toBeNull();
    expect(shapeRequestProblem(request({ count: MAX_SHAPE_COUNT, seed: 2 ** 32 - 1 }))).toBeNull();
  });
});
