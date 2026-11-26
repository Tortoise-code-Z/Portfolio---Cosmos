import { describe, expect, it } from 'vitest';

import {
  CHAPTER_SHAPES,
  createShapeMix,
  SHAPE,
  shapeMixAt,
  shapePosition,
} from '~/lib/scroll/shapeTrack/shapeTrack';
import { arrivalShapeM } from '~/lib/scroll/arrival/arrival';

import { chapterPresence, shapePresence } from './chapterPresence';

describe('chapterPresence', () => {
  it('is 1 at its chapter and fades out by 0.56 on either side (the figure of the spec, 1.8)', () => {
    for (const chapter of [2, 3]) {
      expect(chapterPresence(chapter, chapter)).toBe(1);
      expect(chapterPresence(chapter + 0.25, chapter)).toBeCloseTo(1 - 0.25 * 1.8, 10);
      expect(chapterPresence(chapter - 0.25, chapter)).toBeCloseTo(1 - 0.25 * 1.8, 10);
      expect(chapterPresence(chapter - 0.56, chapter)).toBe(0);
      expect(chapterPresence(chapter + 1, chapter)).toBe(0);
    }
    expect(chapterPresence(0, 2)).toBe(0);
  });
});

describe('shapePresence', () => {
  it('without ships, the very same ramp as chapterPresence with the m of the shape, all along the journey', () => {
    const ids = [SHAPE.galaxy, SHAPE.turtle, SHAPE.earth];
    for (let m = 0; m <= 5; m += 0.01) {
      const mix = shapeMixAt(shapePosition(m), CHAPTER_SHAPES, createShapeMix());
      for (const id of ids) {
        expect(shapePresence(mix, id)).toBeCloseTo(
          chapterPresence(arrivalShapeM(m), CHAPTER_SHAPES.indexOf(id)),
          10,
        );
      }
    }
  });

  it('with a ship, the shape goes with its weight in the mix: the turtle as it becomes the mothership', () => {
    const mix = { from: SHAPE.turtle, to: SHAPE.mothership, t: 0.3 } as const;
    expect(shapePresence(mix, SHAPE.turtle)).toBeCloseTo(1 - 0.3 * 1.8, 10);
    expect(shapePresence({ ...mix, t: 0.6 }, SHAPE.turtle)).toBe(0);
    // La Tierra vuelve cuando la nave nodriza se deshace en ella.
    expect(
      shapePresence({ from: SHAPE.mothership, to: SHAPE.earth, t: 0.8 }, SHAPE.earth),
    ).toBeCloseTo(1 - 0.2 * 1.8, 10);
    expect(shapePresence({ from: SHAPE.mothership, to: SHAPE.earth, t: 0 }, SHAPE.earth)).toBe(0);
  });
});
