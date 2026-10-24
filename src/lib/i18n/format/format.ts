import type { Locale } from '~/content/types';

// Formateadores de `Intl` con la etiqueta del idioma tal cual (`en`, `es`). Se guardan
// por idioma y opciones: crearlos es lo caro y el HUD formatea a menudo.
const numberFormats = new Map<string, Intl.NumberFormat>();
const listFormats = new Map<string, Intl.ListFormat>();

/**
 * Número con el formato del idioma: EN `13,800`; ES `13.800`, pero `1000` sin punto (norma RAE,
 * docs/01-contenido/textos-sitio.md). Un año no pasa por aquí: se agruparía («2,026»); va con `String(year)`.
 */
export function formatNumber(
  locale: Locale,
  value: number,
  options: Intl.NumberFormatOptions = {},
): string {
  const cacheKey = `${locale}|${JSON.stringify(options)}`;
  let format = numberFormats.get(cacheKey);
  if (format === undefined) {
    format = new Intl.NumberFormat(locale, options);
    numberFormats.set(cacheKey, format);
  }
  return format.format(value);
}

export type ListKind = 'conjunction' | 'disjunction';

/** Lista con la conjunción del idioma: EN `a, b, or c` (coma de Oxford con `en`); ES `a, b o c`. */
export function formatList(locale: Locale, items: readonly string[], kind: ListKind): string {
  const cacheKey = `${locale}|${kind}`;
  let format = listFormats.get(cacheKey);
  if (format === undefined) {
    format = new Intl.ListFormat(locale, { type: kind });
    listFormats.set(cacheKey, format);
  }
  return format.format(items);
}

/** Primera letra en mayúscula según el idioma; el resto, tal cual. */
export function capitalize(locale: Locale, text: string): string {
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}
