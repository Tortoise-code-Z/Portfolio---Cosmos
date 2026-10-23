// Rutas del sitio por idioma (docs/05-tecnico/arquitectura.md → «Rutas e idiomas»).
// Imports relativos a propósito: lo carga `react-router.config.ts` (prerender), donde el alias `~/`
// no existe (comprobado en F2.3: el build falla con «Cannot find module '~/…'»).

import type { Locale } from '../../../content/types';

/**
 * Todas las rutas del sitio van en minúsculas (`absoluteUrl` rechaza otra forma). Una ruta con
 * mayúsculas en cualquier tramo (`/ES`, `/PROJECTS/chessmate`, `/projects/Chessmate`) es 404, sin
 * redirección. Hay que comprobarlo a mano: React Router 8.4 casa las rutas del cliente sin
 * distinguir mayúsculas (no les pasa `caseSensitive`).
 */
export function isLowerCasePathname(pathname: string): boolean {
  return pathname === pathname.toLowerCase();
}

/** Prefijo de cada idioma: EN sin prefijo, ES en `/es` (ADR-006). */
export const LOCALE_PREFIX: Readonly<Record<Locale, string>> = { en: '', es: '/es' };

/** Home del idioma: `/` y `/es` (sin barra final, como sirve Vercel con `trailingSlash: false`). */
export function homePath(locale: Locale): string {
  return LOCALE_PREFIX[locale] === '' ? '/' : LOCALE_PREFIX[locale];
}

/** Página de un proyecto: `/projects/chessmate` y `/es/projects/chessmate`. */
export function projectPath(locale: Locale, slug: string): string {
  return `${LOCALE_PREFIX[locale]}/projects/${slug}`;
}

/** Ruta que se pre-renderiza como 404 del idioma (la sirve la ruta `*`): `/404` y `/es/404`. */
export function notFoundPath(locale: Locale): string {
  return `${LOCALE_PREFIX[locale]}/404`;
}
