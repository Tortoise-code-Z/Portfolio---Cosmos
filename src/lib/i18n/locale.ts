import { DEFAULT_LOCALE, type Locale } from '~/content/types';

/** El idioma se deriva de la ruta, nunca del navegador (ADR-006): `/es` y `/es/…` → `es`. */
export function localeFromPathname(pathname: string): Locale {
  return pathname === '/es' || pathname.startsWith('/es/') ? 'es' : DEFAULT_LOCALE;
}
