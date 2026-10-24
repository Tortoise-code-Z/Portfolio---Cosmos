// @vitest-environment node
// Lee la estructura de carpetas del disco: no necesita DOM.

import { readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * Regla de estructura (ADR-018 · DEVELOPMENT_RULES.md §5): si dos o más archivos de la misma carpeta
 * comparten el nombre base (lo que va antes del primer punto: `meta.ts`, `meta.test.ts`,
 * `meta.module.css`), van juntos en una carpeta con ese nombre (`meta/meta.ts`, `meta/meta.test.ts`).
 * Y al revés: un archivo sin pareja va suelto, no en una carpeta con su nombre en la que esté solo.
 * Vale para el código: `src/` y `tests/`. Única excepción: `src/root.tsx`, cuyo nombre y sitio fija
 * React Router; su test va al lado (`src/root.test.tsx`).
 */

const REPO_DIR = fileURLToPath(new URL('..', import.meta.url));
const CODE_DIRS = ['src', 'tests'] as const;
const FRAMEWORK_FIXED = new Set(['src/root.tsx', 'src/root.test.tsx']);

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

/** Grupos de archivos sueltos que comparten carpeta y nombre base (cada uno, rutas con `/`). */
function sameNameGroups(paths: readonly string[]): string[][] {
  const groups = new Map<string, string[]>();
  for (const path of paths) {
    const normalized = path.replaceAll('\\', '/');
    const name = normalized.slice(normalized.lastIndexOf('/') + 1);
    const key = `${dirname(normalized)}/${name.split('.', 1)[0] ?? name}`;
    groups.set(key, [...(groups.get(key) ?? []), normalized]);
  }
  return [...groups.values()].filter((group) => group.length > 1);
}

/** Carpetas con el nombre de su único archivo y nada más dentro (`x/x.ts` solo): sobra la carpeta. */
function lonelyOwnFolders(paths: readonly string[]): string[] {
  const normalized = paths.map((path) => path.replaceAll('\\', '/'));
  return normalized.filter((path) => {
    const folder = dirname(path);
    const name = path.slice(path.lastIndexOf('/') + 1);
    if (folder.slice(folder.lastIndexOf('/') + 1) !== name.split('.', 1)[0]) return false;
    return normalized.every((other) => other === path || !other.startsWith(`${folder}/`));
  });
}

describe('estructura: archivos con el mismo nombre, en su carpeta', () => {
  it('detecta una pareja suelta y no confunde nombres parecidos ni carpetas distintas', () => {
    expect(
      sameNameGroups([
        'src/lib/meta.ts',
        'src/lib/meta.test.ts',
        'src/lib/metadata.ts',
        'src/lib/other/meta.ts',
        'src/ui/Button/Button.tsx',
        'src/ui/Button/Button.module.css',
      ]),
    ).toEqual([
      ['src/lib/meta.ts', 'src/lib/meta.test.ts'],
      ['src/ui/Button/Button.tsx', 'src/ui/Button/Button.module.css'],
    ]);
  });

  it('acepta una pareja dentro de su carpeta', () => {
    const inFolder = ['src/lib/meta/meta.ts', 'src/lib/meta/meta.test.ts'];
    expect(sameNameGroups(inFolder).filter((group) => !isAllowed(group))).toEqual([]);
  });

  it('excepción: root.tsx y su test van sueltos en src/, pero nada más se cuela con ellos', () => {
    expect(isAllowed(['src/root.tsx', 'src/root.test.tsx'])).toBe(true);
    expect(isAllowed(['src/root.tsx', 'src/root.test.tsx', 'src/root.module.css'])).toBe(false);
    expect(isAllowed(['src/lib/root.ts', 'src/lib/root.test.ts'])).toBe(false);
  });

  it('detecta una carpeta con su nombre y un solo archivo, y no una con pareja o con más cosas', () => {
    expect(
      lonelyOwnFolders([
        'src/features/navigation/quickMission/quickMission.ts',
        'src/lib/meta/meta.ts',
        'src/lib/meta/meta.test.ts',
        'src/ui/Icon/Icon.tsx',
        'src/ui/Icon/icons/arrow.svg',
        'src/lib/other/thing.ts',
      ]),
    ).toEqual(['src/features/navigation/quickMission/quickMission.ts']);
  });

  it('src/ y tests/ no tienen archivos con el mismo nombre sueltos en una carpeta', () => {
    const files = CODE_DIRS.flatMap((dir) => listFiles(join(REPO_DIR, dir))).map((path) =>
      relative(REPO_DIR, path),
    );
    expect(files.length).toBeGreaterThan(0);
    expect(sameNameGroups(files).filter((group) => !isAllowed(group))).toEqual([]);
  });

  it('src/ y tests/ no tienen un archivo solo en una carpeta con su nombre (va suelto)', () => {
    const files = CODE_DIRS.flatMap((dir) => listFiles(join(REPO_DIR, dir))).map((path) =>
      relative(REPO_DIR, path),
    );
    expect(lonelyOwnFolders(files)).toEqual([]);
  });
});

/** Pareja que cumple la regla: ya vive en una carpeta con su nombre (`meta/meta.ts`) o es la excepción de la raíz. */
function isAllowed(group: readonly string[]): boolean {
  return group.every((path) => FRAMEWORK_FIXED.has(path)) || isOwnFolder(group);
}

/** La pareja ya vive en una carpeta con su nombre (`meta/meta.ts`). */
function isOwnFolder(group: readonly string[]): boolean {
  return group.every((path) => {
    const parts = path.split('/');
    const folder = parts.at(-2);
    const name = parts.at(-1) ?? '';
    return folder !== undefined && name.split('.', 1)[0] === folder;
  });
}
