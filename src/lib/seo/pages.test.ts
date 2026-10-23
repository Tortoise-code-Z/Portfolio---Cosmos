import { describe, expect, it } from 'vitest';

import { fakeProjects } from './fixtures';
import { indexablePaths, prerenderPaths, sitePages } from './pages';

describe('sitePages', () => {
  const pages = sitePages(fakeProjects);

  it('home y una página por proyecto, con su ruta en cada idioma', () => {
    expect(pages).toEqual([
      { kind: 'home', paths: { en: '/', es: '/es' } },
      {
        kind: 'project',
        slug: 'alpha',
        paths: { en: '/projects/alpha', es: '/es/projects/alpha' },
      },
      {
        kind: 'project',
        slug: 'beta-2',
        paths: { en: '/projects/beta-2', es: '/es/projects/beta-2' },
      },
    ]);
  });

  it('las rutas indexables no incluyen la 404 y no se repiten', () => {
    const paths = indexablePaths(pages);
    expect(paths).toHaveLength(6);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.some((path) => path.endsWith('/404'))).toBe(false);
  });

  it('el prerender son las indexables más la 404 de cada idioma', () => {
    expect(prerenderPaths(pages)).toEqual([...indexablePaths(pages), '/404', '/es/404']);
  });

  it('sin proyectos queda la home', () => {
    expect(indexablePaths(sitePages([]))).toEqual(['/', '/es']);
  });
});
