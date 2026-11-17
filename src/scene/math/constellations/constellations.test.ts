import { describe, expect, it } from 'vitest';

import { CONSTELLATION_LOOK } from '../../config/constellationLayout/constellationLayout';
import {
  chapterPresence,
  constellationLook,
  createConstellationLook,
  followHot,
} from './constellations';

describe('chapterPresence', () => {
  it('is 1 at the galaxy and fades out by 0.56 on either side', () => {
    expect(chapterPresence(2)).toBe(1);
    expect(chapterPresence(2.25)).toBeCloseTo(1 - 0.25 * 1.8, 10);
    expect(chapterPresence(1.75)).toBeCloseTo(1 - 0.25 * 1.8, 10);
    expect(chapterPresence(1.44)).toBe(0);
    expect(chapterPresence(3)).toBe(0);
    expect(chapterPresence(0)).toBe(0);
  });
});

describe('followHot', () => {
  it('lights up and goes out smoothly at rate 8', () => {
    expect(followHot(0, true, 0.05, false)).toBeCloseTo(0.05 * CONSTELLATION_LOOK.hotRate, 10);
    let hot = 0;
    for (let frame = 0; frame < 60; frame += 1) hot = followHot(hot, true, 1 / 60, false);
    expect(hot).toBe(1);
    expect(followHot(1, false, 0.05, false)).toBeCloseTo(1 - 0.05 * CONSTELLATION_LOOK.hotRate, 10);
  });

  it('with reduced motion, at once', () => {
    expect(followHot(0, true, 0.016, true)).toBe(1);
    expect(followHot(0.7, false, 0.016, true)).toBe(0);
  });

  it('without time, it stays', () => {
    expect(followHot(0.3, true, 0, false)).toBe(0.3);
  });
});

describe('constellationLook', () => {
  it('at rest: 22 px stars at 0.65, lines at 0.22, labels at 0.6 (by the presence)', () => {
    const look = constellationLook(1, 0, createConstellationLook());
    expect(look).toEqual({ starPx: 22, starOpacity: 0.65, lineOpacity: 0.22, labelOpacity: 0.6 });
    expect(constellationLook(0.5, 0, look).starOpacity).toBeCloseTo(0.325, 10);
  });

  it('lit: stars 1.55 times larger and at 1, lines at 0.9, labels at 1', () => {
    const look = constellationLook(1, 1, createConstellationLook());
    expect(look.starPx).toBeCloseTo(22 * 1.55, 10);
    expect([look.starOpacity, look.lineOpacity, look.labelOpacity]).toEqual([
      1,
      expect.closeTo(0.9, 10),
      1,
    ]);
  });

  it('with the chapter gone, nothing shows whatever the group', () => {
    const look = constellationLook(0, 1, createConstellationLook());
    expect([look.starOpacity, look.lineOpacity, look.labelOpacity]).toEqual([0, 0, 0]);
  });

  it('writes into the same object', () => {
    const out = createConstellationLook();
    expect(constellationLook(1, 0.5, out)).toBe(out);
  });
});
