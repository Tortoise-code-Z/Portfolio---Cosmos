// Comprobaciones puras de las invariantes del contenido (docs/01-contenido/modelo-de-datos.md →
// «Reglas que comprueban los tests»). Cada función devuelve la lista de problemas con la ruta del dato:
// vacía = todo bien. `content.test.ts` las pasa sobre el contenido real; `validate.test.ts`
// demuestra con casos rotos que cada una detecta lo que dice. No se usan en tiempo de ejecución.

import { DEFAULT_LOCALE, LOCALES, type Locale } from './types';

/** Ids y slugs: minúsculas, dígitos y guiones sueltos entre palabras ('react-ts'). */
export const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

interface OrderedProject {
  readonly slug: string;
  readonly order: number;
  readonly featured: boolean;
}

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
      .filter((key) => !(key in current))
      .map((key) => `ui.${locale}: falta la clave «${key}»`);
    const extra = Object.keys(current)
      .filter((key) => !(key in reference))
      .map((key) => `ui.${locale}: sobra la clave «${key}»`);
    const perKey = Object.entries(current).flatMap(([key, text]) => {
      const problem = textProblem(text, `ui.${locale}.${key}`);
      const base = reference[key];
      const placeholders =
        base === undefined || placeholdersOf(base).join() === placeholdersOf(text).join()
          ? []
          : [
              `ui.${locale}.${key}: huecos {${placeholdersOf(text).join(', ')}}, se esperaban {${placeholdersOf(base).join(', ')}}`,
            ];
      return problem === null ? placeholders : [problem, ...placeholders];
    });
    return [...missing, ...extra, ...perKey];
  });
}
