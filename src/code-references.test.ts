// @vitest-environment node
// Lee archivos del disco: no necesita DOM.

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * Regla de citas (DEVELOPMENT_RULES.md §5): el código, `DECISIONS.md` y `docs/` citan docs y ADR del
 * repo, nunca las notas de trabajo que viven fuera de git (el buzón, las decisiones vivas, las claves de
 * encargo). El repo es público y esas referencias no se pueden seguir.
 */

const REPO_DIR = fileURLToPath(new URL('..', import.meta.url));
const CODE_DIRS = ['src', 'tests', '.husky', '.github'] as const;
const THIS_FILE = 'src/code-references.test.ts';
const CONFIG_FILE = /\.(?:ts|js)$/;
/** Imágenes y fuentes: binarios, sin texto que leer (y con bytes que casarían por azar). */
const BINARY_FILE = /\.(?:png|jpe?g|webp|avif|gif|ico|woff2?|ttf|otf)$/i;
/**
 * Vivas («viva S5 #1», «viva #9»), encargos («AUD-F2-3-1»), claves de pregunta («F25-1-A», y sin opción,
 * «F33-6») y opciones sueltas («la opción A»), y el buzón.
 */
const OFF_REPO_REFERENCE =
  /\bvivas? S\d|\bvivas? #\d|\b(?:EST|AUD)-F\d|\b[A-Z]+\d+-\d+-[A-Z]\b|\b[A-Z]+\d{2,}-\d+\b|\bla opción [A-C]\b|_claude\//;

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

/** Líneas que citan algo de fuera del repo, como `ruta:línea: texto`. */
function offRepoReferences(files: readonly { path: string; text: string }[]): string[] {
  return files.flatMap(({ path, text }) =>
    text
      .split('\n')
      .flatMap((line, index) =>
        OFF_REPO_REFERENCE.test(line) ? [`${path}:${String(index + 1)}: ${line.trim()}`] : [],
      ),
  );
}

describe('el código no cita notas de fuera del repo', () => {
  it('reconoce las citas al buzón y deja pasar las del repo', () => {
    const found = offRepoReferences([
      { path: 'a.ts', text: '// (viva S5 #1)\n// (vivas S4 #16–#31)' },
      { path: 'b.ts', text: '// EST-F2-3-12\n// AUD-F2-3-1\n// _claude/cadena/TABLERO.md' },
      { path: 'c.ts', text: '// ADR-018 · arquitectura.md → «Rutas e idiomas» · F2.7 · STATE.md' },
      { path: 'd.ts', text: '// F25-1-A\n// como dice la opción B' },
      {
        path: 'e.ts',
        text: '// Tamaños: H1-2 · UTF-8 · ES-419 · F2.5-1 · ADR-027 · WCAG 2.1 · F3.3',
      },
      { path: 'f.ts', text: '// F33-6 (sin opción)\n// lo decidió la viva #9' },
    ]);
    expect(found).toHaveLength(9);
    expect(found.some((line) => line.startsWith('c.ts') || line.startsWith('e.ts'))).toBe(false);
  });

  it('src/, tests/, los hooks, el CI y las configs de la raíz no las tienen', () => {
    const rootConfigs = readdirSync(REPO_DIR).filter((name) => CONFIG_FILE.test(name));
    const paths = [
      ...CODE_DIRS.flatMap((dir) => listFiles(join(REPO_DIR, dir))).filter(
        (path) => !BINARY_FILE.test(path),
      ),
      ...rootConfigs.map((name) => join(REPO_DIR, name)),
    ];
    const files = paths
      .map((path) => ({
        path: relative(REPO_DIR, path).replaceAll('\\', '/'),
        text: readFileSync(path, 'utf8'),
      }))
      // Este archivo no: sus ejemplos son citas a propósito.
      .filter(({ path }) => path !== THIS_FILE);
    expect(files.length).toBeGreaterThan(0);
    expect(offRepoReferences(files)).toEqual([]);
  });

  it('DECISIONS.md y docs/ tampoco (salvo el historial de cierres, que es diario de trabajo)', () => {
    const paths = [
      join(REPO_DIR, 'DECISIONS.md'),
      ...listFiles(join(REPO_DIR, 'docs')).filter(
        (path) => path.endsWith('.md') && !relative(REPO_DIR, path).includes('_historial'),
      ),
    ];
    const files = paths.map((path) => ({
      path: relative(REPO_DIR, path).replaceAll('\\', '/'),
      text: readFileSync(path, 'utf8'),
    }));
    expect(files.length).toBeGreaterThan(1);
    expect(offRepoReferences(files)).toEqual([]);
  });
});
