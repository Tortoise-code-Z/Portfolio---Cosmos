import { describe, expect, it } from 'vitest';

import { cosmicClock, cosmicScale, formatYears, superscript, type ClockText } from './cosmicClock';

const text = ({ before, value, after }: ClockText): string => `${before}${value}${after}`;

describe('cosmicClock', () => {
  it('reads t = 0 at the singularity and for the very first pixel of scroll', () => {
    expect(cosmicClock('en', 0)).toEqual({ before: 't = 0 s · singularity', value: '', after: '' });
    expect(text(cosmicClock('es', 0.003))).toBe('t = 0 s · singularidad');
  });

  it('starts counting at Planck time with the explosion', () => {
    expect(cosmicClock('en', 0.004)).toEqual({ before: 't = 10', value: '⁻⁴³', after: ' s' });
  });

  it('lands on each chapter eyebrow: 200 million, 1 billion and 13.8 billion years', () => {
    expect(cosmicClock('en', 1)).toEqual({ before: 't ≈ ', value: '200', after: ' million years' });
    expect(text(cosmicClock('es', 1))).toBe('t ≈ 200 millones de años');
    expect(text(cosmicClock('en', 2))).toBe('t ≈ 1 billion years');
    expect(text(cosmicClock('es', 2))).toBe('t ≈ 1000 millones de años');
    expect(cosmicClock('en', 4)).toEqual({
      before: 't ≈ ',
      value: '13.8',
      after: ' billion years',
    });
    expect(text(cosmicClock('es', 4))).toBe('t ≈ 13.800 millones de años');
  });

  it('interpolates on a log scale between chapters 0 → 1 → 2', () => {
    // A mitad de camino entre 200 y 1000 millones en escala log: √(200 · 1000) ≈ 447 → 450.
    expect(text(cosmicClock('en', 1.5))).toBe('t ≈ 450 million years');
    // Entre Planck y 200 millones el reloj pasa por segundos y por años.
    expect(text(cosmicClock('en', 0.5))).toMatch(/^t = 10[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+ s$/);
    expect(text(cosmicClock('en', 0.9))).toMatch(/^t ≈ [\d,]+ years$/);
  });

  it('never goes back in time while m grows up to the galaxy', () => {
    const seconds = (m: number): number => {
      const clock = text(cosmicClock('en', m));
      const exponent = /10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+) s/.exec(clock)?.[1];
      if (exponent !== undefined) {
        const digits = Array.from(exponent, (c) => '⁻⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c) - 1);
        const sign = digits[0] === -1 ? -1 : 1;
        return 10 ** (sign * Number(digits.filter((d) => d >= 0).join('')));
      }
      const [, n = '0', unit = ''] = /≈ ([\d.,]+) (\w+)/.exec(clock) ?? [];
      const factor = unit === 'million' ? 1e6 : unit === 'billion' ? 1e9 : 1;
      return Number(n.replaceAll(',', '')) * factor * 31_557_600;
    };
    let last = 0;
    for (let m = 0.004; m <= 2; m += 0.01) {
      const now = seconds(m);
      expect(now).toBeGreaterThanOrEqual(last);
      last = now;
    }
  });

  it('holds 1 billion years until the turtle and shows mythic time around it', () => {
    expect(text(cosmicClock('en', 2.49))).toBe('t ≈ 1 billion years');
    expect(cosmicClock('en', 2.5)).toEqual({ before: 't = ∞ · mythic time', value: '', after: '' });
    expect(text(cosmicClock('es', 3))).toBe('t = ∞ · tiempo mítico');
    expect(text(cosmicClock('en', 3.49))).toBe('t = ∞ · mythic time');
    expect(text(cosmicClock('en', 3.5))).toBe('t ≈ 13.8 billion years');
  });
});

describe('formatYears', () => {
  it('counts in seconds up to a year, then in years with two significant digits', () => {
    expect(text(formatYears('en', 1 / 31_557_600))).toBe('t = 10⁰ s');
    expect(text(formatYears('en', 0.99))).toBe('t = 10⁷ s');
    expect(text(formatYears('en', 1.5))).toBe('t ≈ 1.5 years');
    expect(text(formatYears('en', 123_456))).toBe('t ≈ 120,000 years');
    expect(text(formatYears('es', 123_456))).toBe('t ≈ 120.000 años');
  });

  it('switches to millions at a million and to billions once rounding reaches a thousand', () => {
    expect(text(formatYears('en', 999_999))).toBe('t ≈ 1,000,000 years');
    expect(text(formatYears('en', 1_000_000))).toBe('t ≈ 1 million years');
    expect(text(formatYears('en', 996_000_000))).toBe('t ≈ 1 billion years');
    expect(text(formatYears('es', 996_000_000))).toBe('t ≈ 1000 millones de años');
  });
});

describe('superscript', () => {
  it('writes signed exponents with superscript characters', () => {
    expect(superscript(-43)).toBe('⁻⁴³');
    expect(superscript(7)).toBe('⁷');
    expect(superscript(10)).toBe('¹⁰');
  });
});

describe('cosmicScale', () => {
  it('is the scale of the given chapter in each language', () => {
    expect(cosmicScale('en', 0)).toBe('scale ≈ 10⁻³⁵ m');
    expect(cosmicScale('es', 2)).toBe('escala ≈ 100.000 años luz');
    expect(cosmicScale('en', 4)).toBe('scale · 12,742 km across');
  });
});
