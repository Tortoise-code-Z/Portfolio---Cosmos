import { describe, expect, it } from 'vitest';

import { localeFromPathname } from '../locale/locale';
import { homePath, isLowerCasePathname, notFoundPath, projectPath } from './paths';

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

  it('las rutas del sitio van en minúsculas (los slugs ya lo están: content.test.ts)', () => {
    for (const locale of ['en', 'es'] as const) {
      for (const path of [homePath(locale), notFoundPath(locale), projectPath(locale, 'a-b')]) {
        expect(isLowerCasePathname(path)).toBe(true);
      }
    }
  });

  it.each(['/ES', '/Es/projects/chessmate', '/PROJECTS/chessmate', '/projects/Chessmate'])(
    'una mayúscula en cualquier tramo no es una ruta del sitio: %s',
    (path) => {
      expect(isLowerCasePathname(path)).toBe(false);
    },
  );
});
