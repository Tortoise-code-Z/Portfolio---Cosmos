import { describe, expect, it } from 'vitest';

import { createPortraitShift, portraitShift } from './portraitShift';

describe('portraitShift', () => {
  it('starts with no shift', () => {
    expect(createPortraitShift()).toEqual({ x: 0, y: 0 });
  });

  it('is how far the centre of the frame is from the centre of the window', () => {
    const frame = { left: 400, top: 300, width: 200, height: 400 };
    expect(portraitShift(frame, 1000, 800, createPortraitShift())).toEqual({ x: 0, y: 100 });
  });

  it('goes up and to the left as negative numbers', () => {
    const frame = { left: 100, top: -500, width: 200, height: 400 };
    expect(portraitShift(frame, 1000, 800, createPortraitShift())).toEqual({ x: -300, y: -700 });
  });

  it('a frame with no size (hidden or not laid out) moves nothing', () => {
    expect(
      portraitShift({ left: 10, top: 900, width: 0, height: 0 }, 1000, 800, createPortraitShift()),
    ).toEqual({
      x: 0,
      y: 0,
    });
    expect(
      portraitShift(
        { left: 10, top: 900, width: 200, height: 0 },
        1000,
        800,
        createPortraitShift(),
      ),
    ).toEqual({ x: 0, y: 0 });
  });

  it('a measure that is not a number moves nothing', () => {
    const shift = portraitShift(
      { left: Number.NaN, top: Number.POSITIVE_INFINITY, width: 10, height: 10 },
      1000,
      800,
      createPortraitShift(),
    );
    expect(shift).toEqual({ x: 0, y: 0 });
  });

  it('writes in the object it gets and returns it (no new objects per measure)', () => {
    const out = createPortraitShift();
    expect(portraitShift({ left: 0, top: 0, width: 10, height: 10 }, 10, 10, out)).toBe(out);
    expect(out).toEqual({ x: 0, y: 0 });
  });
});
