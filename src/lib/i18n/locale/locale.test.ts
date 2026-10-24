import { describe, expect, it } from 'vitest';

import { browserLocale, languageSuggestion, localeFromPathname } from './locale';

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

describe('languageSuggestion', () => {
  it('en una página en inglés con el navegador en español, sugiere el español', () => {
    expect(languageSuggestion('en', ['es-ES', 'en'])).toBe('es');
  });

  it.each([
    ['en', ['en-GB', 'es']],
    ['en', ['fr-FR']],
    ['en', []],
    ['es', ['es-ES']],
    ['es', ['en-US']],
  ] as const)('página %s con %j: nada que sugerir', (page, languages) => {
    expect(languageSuggestion(page, languages)).toBeNull();
  });
});
