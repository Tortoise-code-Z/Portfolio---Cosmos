import type { Label, Locale } from '~/content/types';

/** Texto de un `Label` en el idioma: los nombres propios (string) no se traducen. */
export function localize(locale: Locale, label: Label): string {
  return typeof label === 'string' ? label : label[locale];
}
