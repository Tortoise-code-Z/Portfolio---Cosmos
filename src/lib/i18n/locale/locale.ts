import { DEFAULT_LOCALE, LOCALES, type Locale } from '~/content/types';

/** El idioma se deriva de la ruta, nunca del navegador (ADR-006): `/es` y `/es/…` → `es`. */
export function localeFromPathname(pathname: string): Locale {
  return pathname === '/es' || pathname.startsWith('/es/') ? 'es' : DEFAULT_LOCALE;
}

/**
 * Idioma del sitio que prefiere el navegador: el de su **primera** preferencia (`navigator.languages`),
 * si es uno de los nuestros (`es-ES`, `es-419` y `es` → `es`). Si la primera es otro idioma, `null`:
 * quien pone el inglés por delante del español no quiere que le ofrezcan el español. Solo sirve para
 * sugerir (docs/02-experiencia/navegacion.md → «Idioma»); la página nunca cambia de idioma sola.
 */
export function browserLocale(languages: readonly string[]): Locale | null {
  const primary = languages[0]?.split('-', 1)[0]?.toLowerCase();
  return LOCALES.find((locale) => locale === primary) ?? null;
}
