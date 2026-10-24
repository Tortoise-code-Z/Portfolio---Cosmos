import { describe, expect, it } from 'vitest';

import { browserLocale, localeFromPathname } from './locale';

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

describe('browserLocale', () => {
  it.each([
    [['es-ES', 'en'], 'es'],
    [['es-419'], 'es'],
    [['ES'], 'es'],
    [['es'], 'es'],
    [['en-GB', 'es'], 'en'],
    [['en'], 'en'],
  ] as const)('%j → %s (manda la primera preferencia)', (languages, expected) => {
    expect(browserLocale(languages)).toBe(expected);
  });

  it.each([[['fr-FR', 'es']], [['esperanto']], [['']], [[]]] as const)(
    '%j → null (otro idioma, o ninguno, por delante)',
    (languages) => {
      expect(browserLocale(languages)).toBeNull();
    },
  );
});
