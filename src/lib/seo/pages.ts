// La lista única de páginas indexables (EST-F2-3, «Lo que doy por fijado»): de aquí salen el
// prerender, el sitemap y los hreflang. Imports relativos: lo carga `react-router.config.ts`.

import { LOCALES, type Locale } from '../../content/types';
import { homePath, notFoundPath, projectPath } from '../i18n/paths';

export type SitePage =
  | { readonly kind: 'home'; readonly paths: Readonly<Record<Locale, string>> }
  | {
      readonly kind: 'project';
      readonly slug: string;
      readonly paths: Readonly<Record<Locale, string>>;
    };

/** Un valor por idioma a partir de una función del idioma. */
export function byLocale(pathOf: (locale: Locale) => string): Readonly<Record<Locale, string>> {
  return { en: pathOf('en'), es: pathOf('es') };
}

/** Home y una página por proyecto, cada una con su ruta en cada idioma. */
export function sitePages(projects: readonly { readonly slug: string }[]): SitePage[] {
  return [
    { kind: 'home', paths: byLocale(homePath) },
    ...projects.map(({ slug }): SitePage => ({
      kind: 'project',
      slug,
      paths: byLocale((locale) => projectPath(locale, slug)),
    })),
  ];
}

/** Todas las rutas indexables, idioma por idioma (sitemap y prerender). */
export function indexablePaths(pages: readonly SitePage[]): string[] {
  return pages.flatMap((page) => LOCALES.map((locale) => page.paths[locale]));
}

/** Lo que se pre-renderiza: las páginas indexables y la 404 de cada idioma (EST-F2-3-12). */
export function prerenderPaths(pages: readonly SitePage[]): string[] {
  return [...indexablePaths(pages), ...LOCALES.map(notFoundPath)];
}
