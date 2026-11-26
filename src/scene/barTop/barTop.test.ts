import { afterEach, describe, expect, it } from 'vitest';

import { barFraction, readBarHeight } from './barTop';

afterEach(() => {
  document.documentElement.style.scrollPaddingBlockStart = '';
});

describe('readBarHeight', () => {
  it('lo que tapa la barra: el scroll-padding de arriba del documento, en px', () => {
    document.documentElement.style.scrollPaddingBlockStart = '64px';
    expect(readBarHeight(document.documentElement)).toBe(64);
  });

  it('sin scroll-padding (`auto`) o con uno raro, 0', () => {
    expect(readBarHeight(document.documentElement)).toBe(0);
    document.documentElement.style.scrollPaddingBlockStart = 'auto';
    expect(readBarHeight(document.documentElement)).toBe(0);
  });
});

describe('barFraction', () => {
  it('la fracción del alto que tapa la barra', () => {
    expect(barFraction(64, 800)).toBe(0.08);
    expect(barFraction(0, 800)).toBe(0);
  });

  it('nunca más de la mitad, y 0 sin alto', () => {
    expect(barFraction(900, 800)).toBe(0.5);
    expect(barFraction(64, 0)).toBe(0);
  });
});
