import { describe, expect, it } from 'vitest';

import { chapterPresence } from './chapterPresence';

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
