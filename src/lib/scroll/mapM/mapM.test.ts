import { describe, expect, it } from 'vitest';

import { chapterSteps } from './chapterSteps';
import { mapM, segmentAt, stepAt, toScrollLayout, type ChapterLayout } from './mapM';

// Alturas del prototipo a 1000 px de ventana: 150 / 210 / 220 / 240 / 130 vh.
const LAYOUT: ChapterLayout = [
  { top: 0, height: 1500 },
  { top: 1500, height: 2100 },
  { top: 3600, height: 2200 },
  { top: 5800, height: 2400 },
  { top: 8200, height: 1300 },
];
const WINDOWS = chapterSteps([0, 0.52, 0.52, 0.55], 5);

/**
 * El último píxel de un tramo que aún es suyo: el tramo siguiente empieza 1 px antes de su `top` (el margen del ancla,
 * `ANCHOR_SLACK_PX`), así que justo antes de `top − 1`.
 */
const lastOfSegmentBefore = (top: number): number => top - 1 - 0.001;

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

  it('is continuous at every chapter change: each chapter ends where the next one starts', () => {
    LAYOUT.slice(1).forEach((box, previous) => {
      expect(segmentAt(lastOfSegmentBefore(box.top), LAYOUT)).toBe(previous);
      expect(mapM(lastOfSegmentBefore(box.top), LAYOUT, WINDOWS)).toBeCloseTo(previous + 1, 4);
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

  it('a missing step means the segment is its own shape and morphs all the way', () => {
    expect(mapM(1500 + 1050, LAYOUT, chapterSteps([0], 1))).toBeCloseTo(1.5, 10);
  });

  it('an interlude holds the shape of the chapter before it, and its tail morphs to the next one', () => {
    // Inicio · About (quieta) · interludio (quieto) · su cola (cambia) · Skills.
    const layout: ChapterLayout = [
      { top: 0, height: 1000 },
      { top: 1000, height: 2000 },
      { top: 3000, height: 1500 },
      { top: 4500, height: 1000 },
      { top: 5500, height: 2000 },
    ];
    const steps = [
      { base: 0, morphStart: 0 },
      { base: 1, morphStart: null },
      { base: 1, morphStart: null },
      { base: 1, morphStart: 0 },
      { base: 2, morphStart: null },
    ];
    // El final de cada tramo, de verdad en él (`lastOfSegmentBefore`): About, la pantalla y la cola.
    expect(mapM(1000, layout, steps)).toBe(1);
    expect(segmentAt(lastOfSegmentBefore(3000), layout)).toBe(1);
    expect(mapM(lastOfSegmentBefore(3000), layout, steps)).toBe(1);
    expect(mapM(3000, layout, steps)).toBe(1);
    expect(segmentAt(lastOfSegmentBefore(4500), layout)).toBe(2);
    expect(mapM(lastOfSegmentBefore(4500), layout, steps)).toBe(1);
    expect(mapM(5000, layout, steps)).toBeCloseTo(1.5, 10);
    expect(segmentAt(lastOfSegmentBefore(5500), layout)).toBe(3);
    expect(mapM(lastOfSegmentBefore(5500), layout, steps)).toBeCloseTo(2, 4);
    expect(mapM(5500, layout, steps)).toBe(2);
    expect(segmentAt(3200, layout)).toBe(2);
    // Un ancla redondeada al píxel (el tramo empieza en 2999,6 y el scroll se queda en 2999) ya es el interludio.
    expect(segmentAt(2999, [...layout.slice(0, 2), { top: 2999.6, height: 1500 }])).toBe(2);
    expect(segmentAt(2998, [...layout.slice(0, 2), { top: 2999.6, height: 1500 }])).toBe(1);
    expect(segmentAt(4600, layout)).toBe(3);
  });

  it('a linear step morphs at the pace of the scroll, from its window to its end (the arrival, ADR-039)', () => {
    const layout: ChapterLayout = [
      { top: 0, height: 1000 },
      { top: 1000, height: 1600 },
      { top: 2600, height: 1000 },
    ];
    const earth = { base: 4, morphStart: null };
    const crewFile = { base: 5, morphStart: null };
    const steps = [earth, { base: 4, morphStart: 0, linear: true }, crewFile];
    expect(mapM(1000, layout, steps)).toBe(4);
    expect(mapM(1000 + 160, layout, steps)).toBeCloseTo(4.1, 10);
    expect(mapM(1000 + 880, layout, steps)).toBeCloseTo(4.55, 10);
    expect(mapM(lastOfSegmentBefore(2600), layout, steps)).toBeCloseTo(5, 2);
    expect(mapM(2600, layout, steps)).toBe(5);
    // Con ventana, quieta hasta ella y lineal después; con la ventana al final, ya en la siguiente.
    const late = [earth, { base: 4, morphStart: 0.5, linear: true }, crewFile];
    expect(mapM(1000 + 400, layout, late)).toBe(4);
    expect(mapM(1000 + 1200, layout, late)).toBeCloseTo(4.5, 10);
    const edge = [earth, { base: 4, morphStart: 1, linear: true }, crewFile];
    expect(mapM(1000 + 400, layout, edge)).toBe(5);
  });

  it('a chapter of height 0 counts as fully travelled', () => {
    const flat: ChapterLayout = [
      { top: 0, height: 0 },
      { top: 0, height: 500 },
    ];
    expect(mapM(0, flat, WINDOWS)).toBe(1);
    expect(mapM(-1, flat, WINDOWS)).toBe(1);
    // Con el margen del ancla (1 px), y = 0 y y = −1 ya caen en el tramo siguiente: y = −2 es el que cae en el de altura
    // 0, y cuenta como recorrido.
    expect(segmentAt(-2, flat)).toBe(0);
    expect(mapM(-2, flat, WINDOWS)).toBe(1);
  });

  it('a single chapter is always 0, and no chapters is 0', () => {
    expect(mapM(500, [{ top: 0, height: 1000 }], WINDOWS)).toBe(0);
    expect(mapM(500, [], WINDOWS)).toBe(0);
    expect(segmentAt(500, [])).toBe(0);
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

describe('stepAt', () => {
  it('without a window, its base all the way', () => {
    expect(stepAt({ base: 2, morphStart: null }, 0.7)).toBe(2);
  });

  it('smooth by default, from `morphStart` to the end of the segment', () => {
    const step = { base: 1, morphStart: 0.5 };
    expect(stepAt(step, 0.5)).toBe(1);
    expect(stepAt(step, 0.75)).toBeCloseTo(1.5);
    expect(stepAt(step, 1)).toBe(2);
  });

  it('ends at `morphEnd` when it has one (a shape formed before its segment ends)', () => {
    expect(stepAt({ base: 1, morphStart: 0, morphEnd: 0.5 }, 0.25)).toBeCloseTo(1.5);
    expect(stepAt({ base: 1, morphStart: 0, morphEnd: 0.5 }, 0.8)).toBe(2);
    expect(stepAt({ base: 1, morphStart: 0, morphEnd: 0.4, linear: true }, 0.1)).toBeCloseTo(1.25);
    expect(stepAt({ base: 1, morphStart: 0, morphEnd: 0.4, linear: true }, 0.9)).toBe(2);
  });

  it('linear steps stay within their window before and after it', () => {
    const step = { base: 4, morphStart: 0.2, morphEnd: 0.6, linear: true };
    expect(stepAt(step, 0)).toBe(4);
    expect(stepAt(step, 0.4)).toBeCloseTo(4.5);
    expect(stepAt(step, 1)).toBe(5);
  });

  it('a linear window with no length is already crossed', () => {
    expect(stepAt({ base: 0, morphStart: 1, linear: true }, 0.5)).toBe(1);
  });
});
