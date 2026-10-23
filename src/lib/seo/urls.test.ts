import { describe, expect, it } from 'vitest';

import { ORIGIN } from './fixtures';
import { absoluteUrl } from './urls';

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
