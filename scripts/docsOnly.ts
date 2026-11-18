/**
 * Commits de solo documentación (ADR-033): van directos a `main`, sin PR. Un solo criterio para los tres sitios que
 * lo miran: el guardián del pre-push (`.husky/pre-push`), el CI del push a `main` (se salta Build, E2E y Visual; los
 * tests rápidos siguen, porque `src/code-references.test.ts` lee los docs) y Vercel (`ignoreCommand` de
 * `vercel.json`: no se vuelve a desplegar un sitio que no ha cambiado).
 *
 * Falla hacia el lado seguro: ante cualquier duda (un archivo que no es doc, ningún archivo, un commit que no es un
 * hash o que no está en el clon, git que no responde), la respuesta es «hay código».
 */
import { spawnSync } from 'node:child_process';

/** Carpetas de código o que van al sitio (`public/` se copia tal cual al build): sus `.md` no cuentan como docs. */
const NOT_DOCS_DIRS = ['src/', 'tests/', 'public/'] as const;
/** Un commit por su hash (40 o 64 cifras, o abreviado para probarlo a mano) o `HEAD` (el de Vercel). */
const COMMIT_REF = /^(?:HEAD|[0-9a-f]{7,64})$/;
/** El hash vacío con que git dice «no existe» (rama nueva o borrada en el pre-push; el `before` de un push nuevo). */
const NULL_COMMIT = /^0+$/;
/** Cuántas rutas de código se nombran en el mensaje (con más, se cuentan). */
const LISTED_CODE_PATHS = 5;

export interface DocsOnlyVerdict {
  readonly docsOnly: boolean;
  /** Una línea para el registro del hook, del CI o de Vercel. */
  readonly message: string;
}

/** Si una ruta del repo (con `/`, como las da git) es documentación. */
export function isDocPath(path: string): boolean {
  return path.endsWith('.md') && !NOT_DOCS_DIRS.some((dir) => path.startsWith(dir));
}

/** Si un cambio es solo de documentación. Sin rutas no lo es: un commit vacío no se salta nada. */
export function isDocsOnly(paths: readonly string[]): boolean {
  return paths.length > 0 && paths.every(isDocPath);
}

/**
 * Las rutas que cambian de `base` a `head` (`null` si git falla). Sin detectar renombrados: un `.ts` que pasa a ser
 * un `.md` aparece con las dos rutas, y la del `.ts` cuenta como código.
 */
export function changedPaths(base: string, head: string, cwd?: string): string[] | null {
  const result = spawnSync('git', ['diff', '--no-renames', '--name-only', '-z', base, head, '--'], {
    cwd,
    encoding: 'utf8',
  });
  if (result.error !== undefined || result.status !== 0) return null;
  return result.stdout.split('\0').filter((path) => path !== '');
}

/** El veredicto entre dos commits; ante cualquier fallo, «hay código». */
export function checkDocsOnly(base: string, head: string, cwd?: string): DocsOnlyVerdict {
  for (const ref of [base, head]) {
    if (!COMMIT_REF.test(ref) || NULL_COMMIT.test(ref)) {
      return {
        docsOnly: false,
        message: `[docs-only] no: "${ref}" is not a commit (treated as code)`,
      };
    }
  }
  const paths = changedPaths(base, head, cwd);
  if (paths === null) {
    return {
      docsOnly: false,
      message: `[docs-only] no: git could not compare ${base} and ${head} (treated as code)`,
    };
  }
  if (isDocsOnly(paths)) {
    return {
      docsOnly: true,
      message: `[docs-only] yes: ${String(paths.length)} docs file(s) changed`,
    };
  }
  if (paths.length === 0) {
    return { docsOnly: false, message: '[docs-only] no: nothing changed (treated as code)' };
  }
  const code = paths.filter((path) => !isDocPath(path));
  const listed = code.slice(0, LISTED_CODE_PATHS).join(', ');
  const more =
    code.length > LISTED_CODE_PATHS ? ` and ${String(code.length - LISTED_CODE_PATHS)} more` : '';
  return { docsOnly: false, message: `[docs-only] no: ${listed}${more}` };
}
