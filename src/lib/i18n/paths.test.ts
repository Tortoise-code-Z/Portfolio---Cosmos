import { describe, expect, it } from 'vitest';

import { localeFromPathname } from './locale';
import { homePath, notFoundPath, projectPath } from './paths';

describe('rutas por idioma', () => {
  it.each([
    ['en', '/', '/projects/chessmate', '/404'],
    ['es', '/es', '/es/projects/chessmate', '/es/404'],
  ] as const)('%s', (locale, home, project, notFound) => {
    expect(homePath(locale)).toBe(home);
    expect(projectPath(locale, 'chessmate')).toBe(project);
    expect(notFoundPath(locale)).toBe(notFound);
  });

  it('cada ruta se lee de vuelta con su idioma', () => {
    for (const locale of ['en', 'es'] as const) {
      for (const path of [homePath(locale), projectPath(locale, 'x'), notFoundPath(locale)]) {
        expect(localeFromPathname(path)).toBe(locale);
      }
    }
  });
});
