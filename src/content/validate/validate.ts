// Comprobaciones puras de las invariantes del contenido (docs/01-contenido/modelo-de-datos.md →
// «Reglas que comprueban los tests»). Cada función devuelve la lista de problemas con la ruta del dato:
// vacía = todo bien. `content.test.ts` las pasa sobre el contenido real; `validate.test.ts`
// demuestra con casos rotos que cada una detecta lo que dice. No se usan en tiempo de ejecución.

import {
  DEFAULT_LOCALE,
  LOCALES,
  type ImageFile,
  type Locale,
  type Project,
  type ResponsiveImage,
} from '../types';

/** Ids y slugs: minúsculas, dígitos y guiones sueltos entre palabras ('react-ts'). */
export const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Parte local sin espacios, `@` ni `:` (nada de `mailto:` delante); dominio con puntos entre trozos no vacíos. */
const EMAIL_PATTERN = /^[^\s@:]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
const PLACEHOLDER_PATTERN = /\{(\w+)\}/g;

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Un texto vale si no está vacío y no tiene espacios sobrantes en los extremos. */
function textProblem(value: string, path: string): string | null {
  if (value.trim() === '') return `${path}: texto vacío`;
  if (value !== value.trim()) return `${path}: espacios sobrantes al principio o al final`;
  return null;
}

function localizedPairProblems(en: unknown, es: unknown, path: string): string[] {
  if (en === null || es === null) {
    return en === es ? [] : [`${path}: null en un idioma y no en el otro`];
  }
  if (typeof en === 'string' && typeof es === 'string') {
    return [textProblem(en, `${path}.en`), textProblem(es, `${path}.es`)].filter(
      (problem) => problem !== null,
    );
  }
  if (Array.isArray(en) && Array.isArray(es)) {
    const problems =
      en.length === es.length
        ? []
        : [`${path}: ${String(en.length)} elementos en en y ${String(es.length)} en es`];
    return [
      ...problems,
      ...findTextProblems(en, `${path}.en`),
      ...findTextProblems(es, `${path}.es`),
    ];
  }
  return [`${path}: en y es deben ser los dos texto, los dos lista o los dos null`];
}

/**
 * Recorre cualquier dato del contenido. Todo texto, no vacío; todo `Localized` (objeto con clave de
 * idioma), con exactamente las claves de `LOCALES`, del mismo tipo y, si son listas, de la misma longitud.
 */
export function findTextProblems(value: unknown, path = '$'): string[] {
  if (typeof value === 'string') {
    const problem = textProblem(value, path);
    return problem === null ? [] : [problem];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findTextProblems(item, `${path}[${String(index)}]`));
  }
  if (!isRecord(value)) return [];

  const keys = Object.keys(value);
  const localeKeys = keys.filter((key): key is Locale =>
    (LOCALES as readonly string[]).includes(key),
  );
  if (localeKeys.length === 0) {
    return keys.flatMap((key) => findTextProblems(value[key], `${path}.${key}`));
  }
  if (keys.length !== LOCALES.length || localeKeys.length !== LOCALES.length) {
    return [
      `${path}: un Localized lleva exactamente ${LOCALES.join(' y ')} (tiene ${keys.join(', ')})`,
    ];
  }
  return localizedPairProblems(value.en, value.es, path);
}

/** Ids con formato `ID_PATTERN` y sin repetir dentro de la lista. */
export function findIdProblems(ids: readonly string[], what: string): string[] {
  const seen = new Set<string>();
  return ids.flatMap((id) => {
    const problems: string[] = [];
    if (!ID_PATTERN.test(id)) problems.push(`${what} «${id}»: formato no válido`);
    if (seen.has(id)) problems.push(`${what} «${id}»: repetido`);
    seen.add(id);
    return problems;
  });
}

type OrderedProject = Pick<Project, 'slug' | 'order' | 'featured'>;

/** La lista va en orden de lectura: `order` = 1, 2, 3… en su posición; exactamente un `featured`. */
export function findProjectOrderProblems(projects: readonly OrderedProject[]): string[] {
  const problems = projects.flatMap((project, index) =>
    project.order === index + 1
      ? []
      : [
          `proyecto «${project.slug}»: order ${String(project.order)}, se esperaba ${String(index + 1)}`,
        ],
  );
  const featured = projects.filter((project) => project.featured).length;
  if (featured !== 1) {
    problems.push(`${String(featured)} proyectos featured, debe haber exactamente uno`);
  }
  return problems;
}

/** URLs absolutas con `https://`. `null` = enlace que no existe (se omite). */
export function findUrlProblems(urls: Readonly<Record<string, string | null>>): string[] {
  return Object.entries(urls).flatMap(([path, url]) => {
    if (url === null) return [];
    if (!URL.canParse(url)) return [`${path}: URL no válida («${url}»)`];
    return url.startsWith('https://') ? [] : [`${path}: la URL debe empezar por https://`];
  });
}

/** Números enteros y mayores que cero (horas de un curso…), por ruta. */
export function findPositiveIntegerProblems(values: Readonly<Record<string, number>>): string[] {
  return Object.entries(values).flatMap(([path, value]) =>
    Number.isInteger(value) && value > 0
      ? []
      : [`${path}: ${String(value)} no es un entero positivo`],
  );
}

/** Listas que la interfaz siempre pinta (bio, features…): al menos un elemento, por ruta. */
export function findEmptyListProblems(
  lists: Readonly<Record<string, readonly unknown[]>>,
): string[] {
  return Object.entries(lists).flatMap(([path, list]) =>
    list.length > 0 ? [] : [`${path}: lista vacía`],
  );
}

/** Una entrada de `srcset`: URL sin espacios y ancho entero positivo (`/a-640.avif 640w`). */
const SRCSET_ENTRY = /^(\S+) ([1-9]\d*)w$/;

function sizeProblems(image: ImageFile, path: string): string[] {
  return [
    image.src === '' ? `${path}.src: vacío` : null,
    Number.isInteger(image.width) && image.width > 0
      ? null
      : `${path}.width: no es un entero positivo`,
    Number.isInteger(image.height) && image.height > 0
      ? null
      : `${path}.height: no es un entero positivo`,
  ].filter((problem) => problem !== null);
}

function srcsetProblems(srcset: string, image: ResponsiveImage, path: string): string[] {
  const entries = srcset.split(', ').map((entry) => SRCSET_ENTRY.exec(entry));
  if (srcset === '' || entries.some((entry) => entry === null)) {
    return [`${path}: srcset mal formado («${srcset}»)`];
  }
  const widths = entries.map((entry) => Number(entry?.[2]));
  const problems: string[] = [];
  if (widths.some((width, index) => index > 0 && width <= (widths[index - 1] ?? 0))) {
    problems.push(`${path}: anchos sin orden creciente o repetidos`);
  }
  if (widths.at(-1) !== image.width) {
    problems.push(
      `${path}: la variante mayor (${String(widths.at(-1))}w) no mide el ancho de la imagen`,
    );
  }
  return problems;
}

/**
 * Imágenes del contenido (regla 5), por ruta: `src` no vacío, medidas enteras positivas (reservan el hueco)
 * y un `srcset` por formato, de menor a mayor, cuya variante mayor mide `width`; `src` es la WebP mayor.
 * Que el archivo exista lo garantiza el import (el build, y el sustituto de Vitest, fallan si falta).
 */
export function findImageProblems(images: Readonly<Record<string, ResponsiveImage>>): string[] {
  return Object.entries(images).flatMap(([path, image]) => {
    const webpLargest = image.sources.webp.split(', ').at(-1)?.split(' ')[0];
    return [
      ...sizeProblems(image, path),
      ...srcsetProblems(image.sources.avif, image, `${path}.sources.avif`),
      ...srcsetProblems(image.sources.webp, image, `${path}.sources.webp`),
      ...(webpLargest === image.src ? [] : [`${path}.src: no es la variante WebP mayor`]),
    ];
  });
}

/** Archivos sin variantes (la imagen para compartir): `src` no vacío y medidas enteras positivas. */
export function findImageFileProblems(files: Readonly<Record<string, ImageFile>>): string[] {
  return Object.entries(files).flatMap(([path, file]) => sizeProblems(file, path));
}

export function findEmailProblems(email: string, path: string): string[] {
  return EMAIL_PATTERN.test(email) ? [] : [`${path}: email no válido («${email}»)`];
}

/** Huecos `{x}` de un texto, ordenados y sin repetir. */
export function placeholdersOf(text: string): string[] {
  return [
    ...new Set(Array.from(text.matchAll(PLACEHOLDER_PATTERN), (match) => match[1] ?? '')),
  ].sort();
}

/**
 * Textos de interfaz: cada idioma con exactamente las claves del idioma principal, cada texto no vacío
 * y los mismos huecos `{x}` que en el idioma principal.
 */
export function findUiProblems(
  texts: Readonly<Record<Locale, Readonly<Record<string, string>>>>,
): string[] {
  const reference = texts[DEFAULT_LOCALE];
  const referenceKeys = Object.keys(reference);

  return LOCALES.flatMap((locale) => {
    const current = texts[locale];
    const missing = referenceKeys
      .filter((key) => !Object.hasOwn(current, key))
      .map((key) => `uiTexts.${locale}: falta la clave «${key}»`);
    const extra = Object.keys(current)
      .filter((key) => !Object.hasOwn(reference, key))
      .map((key) => `uiTexts.${locale}: sobra la clave «${key}»`);
    const perKey = Object.entries(current).flatMap(([key, text]) => {
      const problem = textProblem(text, `uiTexts.${locale}.${key}`);
      const base = Object.hasOwn(reference, key) ? reference[key] : undefined;
      const placeholders =
        base === undefined || placeholdersOf(base).join() === placeholdersOf(text).join()
          ? []
          : [
              `uiTexts.${locale}.${key}: huecos {${placeholdersOf(text).join(', ')}}, se esperaban {${placeholdersOf(base).join(', ')}}`,
            ];
      return problem === null ? placeholders : [problem, ...placeholders];
    });
    return [...missing, ...extra, ...perKey];
  });
}
