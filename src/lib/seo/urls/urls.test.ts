import { describe, expect, it } from 'vitest';

import { ORIGIN } from '../fixtures';
import { absoluteUrl, assetUrl } from './urls';

describe('absoluteUrl', () => {
  it.each([
    ['/', 'https://cosmos.test/'],
    ['/es', 'https://cosmos.test/es'],
    ['/projects/chessmate', 'https://cosmos.test/projects/chessmate'],
    ['/es/projects/beta-2', 'https://cosmos.test/es/projects/beta-2'],
    ['/sitemap.xml', 'https://cosmos.test/sitemap.xml'],
  ])('%s → %s', (path, expected) => {
    expect(absoluteUrl(ORIGIN, path)).toBe(expected);
  });

  it.each([
    ['/es/'],
    ['es'],
    [''],
    ['/x?y=1'],
    ['/x#y'],
    ['/Projects/a'],
    ['//evil.test/x'],
    ['/a//b'],
    ['/..'],
    ['/a/./b'],
    ['/a/'],
  ])('rechaza la ruta no canónica «%s»', (path) => {
    expect(() => absoluteUrl(ORIGIN, path)).toThrow('ruta no canónica');
  });
});

describe('assetUrl', () => {
  it.each([
    ['/assets/01-home-CaIUKrxu.jpeg', 'https://cosmos.test/assets/01-home-CaIUKrxu.jpeg'],
    ['/assets/01-home-BT_LfYPm.avif', 'https://cosmos.test/assets/01-home-BT_LfYPm.avif'],
    ['/assets/home-a-.webp', 'https://cosmos.test/assets/home-a-.webp'],
    ['/og/og-en.png', 'https://cosmos.test/og/og-en.png'],
    ['/favicon.svg', 'https://cosmos.test/favicon.svg'],
  ])('%s → %s', (path, expected) => {
    expect(assetUrl(ORIGIN, path)).toBe(expected);
  });

  it.each([
    ['assets/a.jpeg'],
    ['/assets/a'],
    ['/assets/'],
    ['/assets/a.jpeg?v=1'],
    ['/assets/a.jpeg#x'],
    ['/assets/../a.jpeg'],
    ['/assets/..jpeg'],
    ['//evil.test/a.jpeg'],
    ['/assets//a.jpeg'],
    ['/assets/a b.jpeg'],
    ['/assets/a.JPEG'],
    ['https://cosmos.test/a.jpeg'],
  ])('rechaza «%s»', (path) => {
    expect(() => assetUrl(ORIGIN, path)).toThrow('ruta de archivo no válida');
  });
});
