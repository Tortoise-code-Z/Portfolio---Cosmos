/**
 * Commits de solo documentación (ADR-033): van directos a `main`, sin PR. Un solo criterio para los tres sitios que
 * lo miran: el guardián del pre-push (`.husky/pre-push`), el CI del push a `main` (se salta Build, E2E y Visual; los
 * tests rápidos siguen, porque `src/code-references.test.ts` lee los docs) y Vercel (`ignoreCommand` de
 * `vercel.json`: no se vuelve a desplegar un sitio que no ha cambiado).
 *
 * El CI y Vercel miran el árbol final (`checkDocsOnly`): es lo que se prueba y se despliega. El pre-push mira además
 * cada commit (`checkEachCommitDocsOnly`): lo que llega a `main` por push queda en su historia pública, aunque un
 * commit posterior lo quite.
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
/** Cifras de un hash en los mensajes. */
const SHORT_HASH = 7;

export interface DocsOnlyVerdict {
  readonly docsOnly: boolean;
  /** Una línea para el registro del hook, del CI o de Vercel. */
  readonly message: string;
}

interface GitResult {
  /** `null` si git no se pudo lanzar. */
  readonly status: number | null;
  readonly stdout: string;
}

function git(args: readonly string[], cwd: string | undefined): GitResult {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return { status: result.error === undefined ? result.status : null, stdout: result.stdout };
}

/** Rutas de una salida de git con `-z` (separadas por NUL; los huecos vacíos fuera). */
function splitPaths(stdout: string): string[] {
  return stdout.split('\0').filter((path) => path !== '');
}

function codeVerdict(reason: string): DocsOnlyVerdict {
  return { docsOnly: false, message: `[docs-only] no: ${reason}` };
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
  const result = git(['diff', '--no-renames', '--name-only', '-z', base, head, '--'], cwd);
  return result.status === 0 ? splitPaths(result.stdout) : null;
}

/** Por qué una ref no vale (`null` si vale): solo hashes y `HEAD`, así nada se lee como opción de git. */
function invalidRef(base: string, head: string): DocsOnlyVerdict | null {
  for (const ref of [base, head]) {
    if (!COMMIT_REF.test(ref) || NULL_COMMIT.test(ref)) {
      return codeVerdict(`"${ref}" is not a commit (treated as code)`);
    }
  }
  return null;
}

/** El veredicto de unas rutas ya leídas. */
function pathsVerdict(paths: readonly string[]): DocsOnlyVerdict {
  if (isDocsOnly(paths)) {
    return {
      docsOnly: true,
      message: `[docs-only] yes: ${String(paths.length)} docs file(s) changed`,
    };
  }
  if (paths.length === 0) return codeVerdict('nothing changed (treated as code)');
  const code = paths.filter((path) => !isDocPath(path));
  const listed = code.slice(0, LISTED_CODE_PATHS).join(', ');
  const rest = code.length - LISTED_CODE_PATHS;
  return codeVerdict(rest > 0 ? `${listed} and ${String(rest)} more` : listed);
}

/** El veredicto del árbol final, de `base` a `head` (el CI y Vercel); ante cualquier fallo, «hay código». */
export function checkDocsOnly(base: string, head: string, cwd?: string): DocsOnlyVerdict {
  const invalid = invalidRef(base, head);
  if (invalid !== null) return invalid;
  const paths = changedPaths(base, head, cwd);
  if (paths === null)
    return codeVerdict(`git could not compare ${base} and ${head} (treated as code)`);
  return pathsVerdict(paths);
}

/**
 * El veredicto de cada commit de `base` a `head` (el pre-push): `head` tiene que venir de `base` (nada de historia
 * reescrita), sin merges (con `git pull --rebase` no hay), y ningún commit puede tocar algo que no sea doc, aunque
 * otro lo quite después. Ante cualquier fallo, «hay código».
 */
export function checkEachCommitDocsOnly(base: string, head: string, cwd?: string): DocsOnlyVerdict {
  const invalid = invalidRef(base, head);
  if (invalid !== null) return invalid;

  const ancestor = git(['merge-base', '--is-ancestor', base, head], cwd);
  if (ancestor.status === 1) {
    return codeVerdict(`${head} does not come from ${base} (history rewritten; treated as code)`);
  }
  if (ancestor.status !== 0)
    return codeVerdict(`git could not compare ${base} and ${head} (treated as code)`);

  const range = `${base}..${head}`;
  const merges = git(['rev-list', '--merges', range], cwd);
  const perCommit = git(
    ['log', '--no-merges', '--format=', '--name-only', '--no-renames', '-z', range, '--'],
    cwd,
  );
  const net = changedPaths(base, head, cwd);
  if (merges.status !== 0 || perCommit.status !== 0 || net === null) {
    return codeVerdict(`git could not list the changes of ${range} (treated as code)`);
  }
  // `rev-list` da un hash por línea: las primeras cifras son las del primer merge.
  const firstMerge = merges.stdout.trim().slice(0, SHORT_HASH);
  if (firstMerge !== '') {
    return codeVerdict(`merge commit ${firstMerge} (use git pull --rebase; treated as code)`);
  }
  // Ordenadas como las da `git diff`, para que el mensaje no dependa del orden de los commits.
  return pathsVerdict([...new Set([...splitPaths(perCommit.stdout), ...net])].sort());
}
