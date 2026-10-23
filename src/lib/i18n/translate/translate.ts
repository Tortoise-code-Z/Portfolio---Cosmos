import { uiTexts } from '~/content/texts';
import type { Locale, UiKey, UiTemplate } from '~/content/types';

const PLACEHOLDER = /\{(\w+)\}/g;

/** Nombres de los huecos `{x}` de un texto literal: `'Open image {n} of {total}'` → `'n' | 'total'`. */
export type PlaceholderName<S extends string> = S extends `${string}{${infer Name}}${infer Rest}`
  ? Name | PlaceholderName<Rest>
  : never;

/**
 * Argumentos de `translate` para una clave: nada si su texto no tiene huecos; si los tiene, un objeto
 * con exactamente esos huecos y valores de texto (cada número lo formatea antes quien llama, porque
 * solo él sabe si es un año, que no se agrupa, o una distancia, que sí: EST-F2-3-4).
 */
export type TranslateParams<K extends UiKey> = [PlaceholderName<UiTemplate<K>>] extends [never]
  ? []
  : [values: Readonly<Record<PlaceholderName<UiTemplate<K>>, string>>];

/**
 * Texto de interfaz en un idioma, con sus huecos rellenos. Pura: la usan `useT` y las `meta` de
 * las rutas, que no pueden llamar hooks.
 */
export function translate<K extends UiKey>(
  locale: Locale,
  key: K,
  ...params: TranslateParams<K>
): string {
  const template = uiTexts[locale][key];
  const values: Readonly<Record<string, string>> | undefined = params[0];
  return values === undefined ? template : fillPlaceholders(template, values);
}

/**
 * Rellena cada `{x}` del texto con su valor, todas las veces que aparezca y en cualquier orden. El
 * tipo de `translate` ya exige todos los huecos; si aun así falta uno, se deja a la vista en vez de
 * «undefined». Exportada para probar el relleno con textos que hoy no existen en el contenido.
 */
export function fillPlaceholders(
  template: string,
  values: Readonly<Record<string, string>>,
): string {
  return template.replace(PLACEHOLDER, (match, name: string) => values[name] ?? match);
}
