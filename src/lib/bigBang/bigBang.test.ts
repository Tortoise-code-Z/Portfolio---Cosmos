import { describe, expect, it } from 'vitest';

import {
  BIG_BANG_VARS,
  decayBoost,
  flashOpacity,
  haloFade,
  haloScale,
  heroTracking,
  heroWidth,
  shakeAmplitude,
  shakeOffset,
} from './bigBang';

describe('flashOpacity', () => {
  it('peaks at 0.75 halfway through the start of the explosion and is 0 outside it', () => {
    expect(flashOpacity(0, 0)).toBe(0);
    expect(flashOpacity(0.1, 0)).toBeCloseTo(0.75, 10);
    expect(flashOpacity(0.05, 0)).toBeCloseTo(Math.sin(Math.PI / 4) * 0.75, 10);
    expect(flashOpacity(0.2, 0)).toBe(0);
    expect(flashOpacity(2, 0)).toBe(0);
    expect(flashOpacity(-0.1, 0)).toBe(0);
  });

  it('detonating hits harder (0.95) and the stronger of the two wins', () => {
    expect(flashOpacity(0, 1)).toBeCloseTo(0.95, 10);
    expect(flashOpacity(0.1, 0.5)).toBeCloseTo(0.75, 10);
    expect(flashOpacity(0.1, 0.9)).toBeCloseTo(0.855, 10);
    expect(flashOpacity(0, 3)).toBeCloseTo(0.95, 10);
  });
});

describe('decayBoost', () => {
  it('fades the detonation hit in about 0.6 s and stays at 0', () => {
    expect(decayBoost(1, 0.25)).toBeCloseTo(0.6, 10);
    expect(decayBoost(0.1, 1)).toBe(0);
    expect(decayBoost(0.5, -1)).toBe(0.5);
  });
});

describe('shakeAmplitude', () => {
  it('is 9 px per flash and 3 px per charge, and nothing below a twentieth of a pixel', () => {
    expect(shakeAmplitude(1, 1)).toBe(12);
    expect(shakeAmplitude(0, 0.5)).toBe(1.5);
    expect(shakeAmplitude(0.95, 0)).toBeCloseTo(8.55, 10);
    expect(shakeAmplitude(0, 0.01)).toBe(0);
    expect(shakeAmplitude(0, 0)).toBe(0);
  });
});

describe('shakeOffset', () => {
  it('stays within half the amplitude either way and is the same for the same frame', () => {
    for (let step = 0; step < 200; step += 1) {
      for (const axis of [0, 1] as const) {
        const offset = shakeOffset(8, step, axis);
        expect(Math.abs(offset)).toBeLessThanOrEqual(4);
        expect(shakeOffset(8, step, axis)).toBe(offset);
      }
    }
  });

  it('moves from frame to frame and differs between axes', () => {
    expect(shakeOffset(8, 1, 0)).not.toBe(shakeOffset(8, 2, 0));
    expect(shakeOffset(8, 1, 0)).not.toBe(shakeOffset(8, 1, 1));
    expect(shakeOffset(0, 5, 0) === 0).toBe(true);
  });
});

describe('heroWidth', () => {
  it('rests at 62, squeezes to the axis minimum (50) with a full charge', () => {
    expect(heroWidth(0, 0)).toBe(62);
    expect(heroWidth(0.5, 0)).toBe(56);
    expect(heroWidth(1, 0)).toBe(50);
    expect(heroWidth(2, 0)).toBe(50);
  });

  it('widens to 150 as the explosion goes on (by m 0.35) and never past it', () => {
    expect(heroWidth(0, 0.35)).toBe(150);
    expect(heroWidth(0, 3)).toBe(150);
    expect(heroWidth(1, 0.35)).toBe(138);
    expect(heroWidth(0, 0.175)).toBeCloseTo(62 + 44, 10);
  });
});

describe('heroTracking', () => {
  it('spreads the letters from 0 to 0.25 em with m from 0 to 1', () => {
    expect(heroTracking(0)).toBe(0);
    expect(heroTracking(0.4)).toBeCloseTo(0.1, 10);
    expect(heroTracking(1)).toBe(0.25);
    expect(heroTracking(4)).toBe(0.25);
    expect(heroTracking(-1)).toBe(0);
  });
});

describe('halo', () => {
  it('fades out with the explosion, by m 0.12', () => {
    expect(haloFade(0)).toBe(1);
    expect(haloFade(0.06)).toBeCloseTo(0.5, 10);
    expect(haloFade(0.12)).toBe(0);
    expect(haloFade(3)).toBe(0);
  });

  it('grows with the charge up to ×2.6', () => {
    expect(haloScale(0)).toBe(1);
    expect(haloScale(1)).toBeCloseTo(2.6, 10);
    expect(haloScale(-1)).toBe(1);
  });
});

describe('BIG_BANG_VARS', () => {
  it('are distinct custom properties', () => {
    const names = Object.values(BIG_BANG_VARS);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) expect(name).toMatch(/^--_bang-[a-z-]+$/);
  });
});
