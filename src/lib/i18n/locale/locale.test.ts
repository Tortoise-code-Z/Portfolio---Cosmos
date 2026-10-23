import { describe, expect, it } from 'vitest';

import { localeFromPathname } from './locale';

describe('localeFromPathname', () => {
  it.each([
    ['/', 'en'],
    ['/projects/chessmate', 'en'],
    ['/es', 'es'],
    ['/es/', 'es'],
    ['/es/projects/chessmate', 'es'],
    ['/estrella', 'en'],
    ['/en/es', 'en'],
  ] as const)('%s → %s', (pathname, expected) => {
    expect(localeFromPathname(pathname)).toBe(expected);
  });
});
