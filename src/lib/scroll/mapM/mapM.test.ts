import { describe, expect, it } from 'vitest';

import { mapM, toScrollLayout, type ChapterLayout } from './mapM';

// Alturas del prototipo a 1000 px de ventana: 150 / 210 / 220 / 240 / 130 vh.
const LAYOUT: ChapterLayout = [
  { top: 0, height: 1500 },
  { top: 1500, height: 2100 },
  { top: 3600, height: 2200 },
  { top: 5800, height: 2400 },
  { top: 8200, height: 1300 },
];
const WINDOWS = [0, 0.52, 0.52, 0.55];

describe('mapM', () => {
  it('is 0 at the very start and before it (overscroll)', () => {
    expect(mapM(0, LAYOUT, WINDOWS)).toBe(0);
    expect(mapM(-80, LAYOUT, WINDOWS)).toBe(0);
  });

  it('is the chapter index exactly where each chapter starts', () => {
    LAYOUT.forEach((box, index) => {
      expect(mapM(box.top, LAYOUT, WINDOWS)).toBe(index);
    });
  });

  it('starts the explosion with the first scroll (window 0 in the hero)', () => {
    expect(mapM(1, LAYOUT, WINDOWS)).toBeGreaterThan(0);
    expect(mapM(750, LAYOUT, WINDOWS)).toBeCloseTo(0.5, 10);
  });

  it('holds the shape still until its window and then morphs', () => {
    // About: ventana al 52 % de 2100 px = 1092 px desde su inicio.
    expect(mapM(1500 + 1092, LAYOUT, WINDOWS)).toBe(1);
    expect(mapM(1500 + 1500, LAYOUT, WINDOWS)).toBeGreaterThan(1);
    expect(mapM(1500 + 1500, LAYOUT, WINDOWS)).toBeLessThan(2);
  });

  it('is continuous at every chapter change', () => {
    LAYOUT.slice(1).forEach((box, previous) => {
      expect(mapM(box.top - 0.01, LAYOUT, WINDOWS)).toBeCloseTo(previous + 1, 6);
    });
  });

  it('never goes back while scrolling down and stays within [0, last]', () => {
    let last = -1;
    for (let y = -100; y <= 10_000; y += 25) {
      const m = mapM(y, LAYOUT, WINDOWS);
      expect(m).toBeGreaterThanOrEqual(last);
      expect(m).toBeLessThanOrEqual(4);
      last = m;
    }
  });

  it('stays at the last chapter from its start to the end of the page', () => {
    expect(mapM(8200, LAYOUT, WINDOWS)).toBe(4);
    expect(mapM(99_999, LAYOUT, WINDOWS)).toBe(4);
  });

  it('follows the measured heights: a chapter that grew on resize moves its window', () => {
    const grown: ChapterLayout = [
      { top: 0, height: 1500 },
      { top: 1500, height: 3000 },
      { top: 4500, height: 2200 },
      { top: 6700, height: 2400 },
      { top: 9100, height: 1300 },
    ];
    // 1500 px dentro de About: con 2100 px de alto ya ha pasado su ventana (1092 px); con 3000 px aún
    // no (52 % de 3000 = 1560 px). A 2000 px, sí.
    expect(mapM(1500 + 1500, LAYOUT, WINDOWS)).toBeGreaterThan(1);
    expect(mapM(1500 + 1500, grown, WINDOWS)).toBe(1);
    expect(mapM(1500 + 2000, grown, WINDOWS)).toBeGreaterThan(1);
  });

  it('a missing window means the morph takes the whole chapter', () => {
    expect(mapM(1500 + 1050, LAYOUT, [0])).toBeCloseTo(1.5, 10);
  });

  it('a chapter of height 0 counts as fully travelled', () => {
    const flat: ChapterLayout = [
      { top: 0, height: 0 },
      { top: 0, height: 500 },
    ];
    expect(mapM(0, flat, WINDOWS)).toBe(1);
    expect(mapM(-1, flat, WINDOWS)).toBe(1);
  });

  it('a single chapter is always 0, and no chapters is 0', () => {
    expect(mapM(500, [{ top: 0, height: 1000 }], WINDOWS)).toBe(0);
    expect(mapM(500, [], WINDOWS)).toBe(0);
  });
});

describe('toScrollLayout', () => {
  it('moves every chapter start up by the bar, never before 0, and keeps them back to back', () => {
    expect(toScrollLayout(LAYOUT, 64)).toEqual([
      { top: 0, height: 1436 },
      { top: 1436, height: 2100 },
      { top: 3536, height: 2200 },
      { top: 5736, height: 2400 },
      { top: 8136, height: 1300 },
    ]);
  });

  it('with the bar, the top of the page is still the singularity and an anchor is its chapter', () => {
    const scroll = toScrollLayout(LAYOUT, 64);
    expect(mapM(0, scroll, WINDOWS)).toBe(0);
    expect(mapM(1500 - 64, scroll, WINDOWS)).toBe(1);
    expect(mapM(8200 - 64, scroll, WINDOWS)).toBe(4);
  });

  it('without a bar nothing changes', () => {
    expect(toScrollLayout(LAYOUT, 0)).toEqual(LAYOUT);
    expect(toScrollLayout([], 64)).toEqual([]);
  });
});
