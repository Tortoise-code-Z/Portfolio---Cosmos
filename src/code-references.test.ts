// @vitest-environment node
// Lee archivos del disco: no necesita DOM.

import { execFileSync } from 'node:child_process';
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
const CODE_DIRS = ['src', 'tests', 'scripts', '.husky', '.github', 'public'] as const;
/**
 * Las carpetas de la raíz que no están en `CODE_DIRS`, con su motivo. Las que git no sigue (`node_modules`,
 * `build`, los informes…) ni aparecen: el último caso las lista con git, que respeta `.gitignore`.
 */
const NOT_CODE_DIRS: Readonly<Record<string, string>> = {
  docs: 'Tiene su propio caso: solo los .md, sin el historial de cierres.',
};
const THIS_FILE = 'src/code-references.test.ts';
const CONFIG_FILE = /\.(?:ts|js|json)$/;
/** Imágenes y fuentes: binarios, sin texto que leer (y con bytes que casarían por azar). */
const BINARY_FILE = /\.(?:png|jpe?g|webp|avif|gif|ico|woff2?|ttf|otf)$/i;
/**
 * Vivas («viva S5 #1», «Viva-S5», «viva #9», «S22 #20»), encargos («AUD-F2-3-1»), claves de pregunta («F25-1-A»,
 * sin opción «F33-6», y de letras «CAM-1-B», «FIX-1»; no «ADR-027» ni «UTF-8»), opciones sueltas («la opción A»,
 * también en mayúscula) y el buzón (`_claude/`, el archivo de las vivas).
 */
const OFF_REPO_ALTERNATIVES = [
  String.raw`\b[Vv]ivas?[ -]S\d`,
  String.raw`\b[Vv]ivas? #\d`,
  String.raw`\bS\d{1,3} #\d`,
  String.raw`\b(?:EST|AUD)-F\d`,
  String.raw`\b[A-Z]+\d+-\d+-[A-Z]\b`,
  String.raw`\b[A-Z]+\d{2,}-\d+\b`,
  String.raw`\b(?!ADR-|UTF-)[A-Z]{3,}-\d+(?:-[A-Z])?\b`,
  String.raw`\b[Ll]a opción [A-C]\b`,
  String.raw`_claude\/`,
  String.raw`decisiones-vivas`,
] as const;
const OFF_REPO_REFERENCE = new RegExp(OFF_REPO_ALTERNATIVES.join('|'));

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

/** Citas al buzón, una por línea: entre todas, cada alternativa de la regex tiene alguna que solo casa ella. */
const OFF_REPO_EXAMPLES = [
  { path: 'a.ts', text: '// (viva S5 #1)\n// (vivas S4 #16–#31)' },
  { path: 'b.ts', text: '// EST-F2-3-12\n// AUD-F2-3-1\n// _claude/cadena/TABLERO.md' },
  { path: 'd.ts', text: '// F25-1-A\n// como dice la opción B' },
  { path: 'f.ts', text: '// F33-6 (sin opción)\n// lo decidió la viva #9' },
  {
    path: 'g.ts',
    text: '// CAM-1-B\n// FIX-1\n// Viva S5 #1\n// La opción A\n// (S22 #20)\n// decisiones-vivas-S22.md',
  },
  { path: 'h.ts', text: '// viva S5\n// Viva-S5\n// decisiones-vivas.md\n// F3-1-A' },
] as const;

describe('el código no cita notas de fuera del repo', () => {
  it('reconoce las citas al buzón y deja pasar las del repo', () => {
    const found = offRepoReferences([
      ...OFF_REPO_EXAMPLES,
      { path: 'c.ts', text: '// ADR-018 · arquitectura.md → «Rutas e idiomas» · F2.7 · STATE.md' },
      {
        path: 'e.ts',
        text: '// Tamaños: H1-2 · UTF-8 · ES-419 · F2.5-1 · ADR-027 · WCAG 2.1 · F3.3 · S22 · #20 · AB-1',
      },
    ]);
    expect(found).toHaveLength(19);
    expect(found.some((line) => line.startsWith('c.ts') || line.startsWith('e.ts'))).toBe(false);
  });

  it('cada alternativa de la regex tiene un ejemplo que solo casa ella (quitarla haría fallar el test anterior)', () => {
    const lines = OFF_REPO_EXAMPLES.flatMap(({ text }) => text.split('\n'));
    const patterns = OFF_REPO_ALTERNATIVES.map((source) => new RegExp(source));
    const unmatched = OFF_REPO_ALTERNATIVES.filter((_source, index) =>
      lines.every(
        (line) =>
          !patterns[index]?.test(line) ||
          patterns.some((other, otherIndex) => otherIndex !== index && other.test(line)),
      ),
    );
    expect(unmatched).toEqual([]);
  });

  it('src/, tests/, scripts/, public/, los hooks, el CI y las configs y JSON de la raíz no las tienen', () => {
    // `package-lock.json` lo genera npm (licencias como «BSD-2-Clause» casarían): no lo escribe nadie.
    const rootConfigs = readdirSync(REPO_DIR).filter(
      (name) => CONFIG_FILE.test(name) && name !== 'package-lock.json',
    );
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

  it('cada carpeta de la raíz que sigue git se lee arriba o tiene su motivo (una nueva no se escapa)', () => {
    // Las seguidas y las nuevas aún sin añadir; sin `--no-optional-locks`, git podría escribir en el índice.
    const listed = execFileSync(
      'git',
      ['--no-optional-locks', 'ls-files', '--cached', '--others', '--exclude-standard', '-z'],
      { cwd: REPO_DIR, encoding: 'utf8' },
    );
    const rootDirs = new Set(
      listed
        .split('\0')
        .filter((path) => path.includes('/'))
        .map((path) => path.slice(0, path.indexOf('/'))),
    );
    const known = new Set<string>([...CODE_DIRS, ...Object.keys(NOT_CODE_DIRS)]);
    expect(rootDirs.size).toBeGreaterThan(1);
    expect([...rootDirs].filter((dir) => !known.has(dir)).sort()).toEqual([]);
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
