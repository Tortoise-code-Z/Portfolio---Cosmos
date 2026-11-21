/**
 * La telemetría de Mission control (docs/02-experiencia/capitulos/interludio-2-mission-control.md → «Telemetría»;
 * ADR-035): las cifras del propio repo, contadas al construir el sitio, nunca a mano. Un plugin de Vite las sirve como
 * el módulo `virtual:site-telemetry`; el pre-renderizado las deja escritas en el HTML.
 *
 * - **Tests escritos**, no ejecuciones: cada llamada a `it` o `test` (también `.only`, `.concurrent`, `.fails` y un
 *   `it.each(…)(…)`) cuenta una vez, leída con el compilador de TypeScript (un comentario o un texto no cuentan).
 *   `test.describe`, `test.skip`, `test.use`… no son tests y no cuentan. Unitarios: lo que corre Vitest
 *   (`vitest.config.ts` → `include`); e2e: los specs de Playwright de `tests/e2e/`.
 * - **Navegadores**: la matriz de los e2e del CI (`.github/workflows/ci.yml`).
 * - **Decisiones**: los ADR de `DECISIONS.md` (`## ADR-NNN`).
 *
 * Si no encuentra lo que cuenta (sin tests, sin matriz, sin ADR), falla el build: una cifra falsa no llega al sitio.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import ts from 'typescript';
import type { Plugin } from 'vite';

import type { SiteTelemetry } from '../src/content/types.ts';

/** El módulo que importa el contenido (`src/content/telemetry.ts`). */
export const SITE_TELEMETRY_MODULE = 'virtual:site-telemetry';

/** Dónde están los tests: los de Vitest (su `include`) y los specs e2e de Playwright (su `testDir`). */
const UNIT_TESTS = /^(?:src\/.+\.test\.tsx?|scripts\/.+\.test\.ts)$/;
const E2E_TESTS = /^tests\/e2e\/.+\.spec\.ts$/;
/** Carpetas que no se recorren. */
const SKIPPED_DIRS = new Set(['node_modules', '.git', 'build', 'coverage', '.react-router']);

const TEST_FUNCTIONS = new Set(['it', 'test']);
/** Modificadores que siguen siendo un test (`it.only(…)`); los demás (`describe`, `skip`, `use`, `step`…) no. */
const TEST_MODIFIERS = new Set(['only', 'concurrent', 'fails']);

/** La matriz de los e2e: `project: [chromium, firefox, webkit]`. */
const CI_BROWSERS = /^\s*project:\s*\[([^\]]*)\]/m;
const ADR_HEADING = /^## ADR-\d+\b/gm;
const MONTH_DIGITS = 2;

function isTestFunction(node: ts.Expression): boolean {
  return ts.isIdentifier(node) && TEST_FUNCTIONS.has(node.text);
}

/** Si una llamada declara un test: `it(…)`, `test.only(…)` o la segunda llamada de `it.each(…)(…)`. */
function declaresTest(call: ts.CallExpression): boolean {
  const callee = call.expression;
  if (isTestFunction(callee)) return true;
  if (ts.isPropertyAccessExpression(callee)) {
    return isTestFunction(callee.expression) && TEST_MODIFIERS.has(callee.name.text);
  }
  if (ts.isCallExpression(callee) && ts.isPropertyAccessExpression(callee.expression)) {
    const each = callee.expression;
    return isTestFunction(each.expression) && each.name.text === 'each';
  }
  return false;
}

/** Los tests escritos en un archivo (su ruta solo dice si lleva JSX). */
export function countTests(source: string, fileName: string): number {
  const kind = fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, false, kind);
  let count = 0;
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && declaresTest(node)) count += 1;
    ts.forEachChild(node, visit);
  };
  visit(file);
  return count;
}

/** Los navegadores de la matriz de los e2e del CI. */
export function ciBrowsers(workflow: string): string[] {
  const list = CI_BROWSERS.exec(workflow)?.[1] ?? '';
  const browsers = list
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name !== '');
  if (browsers.length === 0) throw new Error('siteTelemetry: ci.yml sin matriz de navegadores.');
  return browsers;
}

/** Los ADR registrados. */
export function countDecisions(decisions: string): number {
  const count = decisions.match(ADR_HEADING)?.length ?? 0;
  if (count === 0) throw new Error('siteTelemetry: DECISIONS.md sin ADR.');
  return count;
}

/** El mes de una fecha, `AAAA-MM` en UTC. */
export function monthOf(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(MONTH_DIGITS, '0');
  return `${String(date.getUTCFullYear())}-${month}`;
}

/** Las rutas de los archivos del repo, relativas y con `/`. */
function listFiles(root: string): string[] {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      if (entry.isDirectory())
        return SKIPPED_DIRS.has(entry.name) ? [] : walk(join(dir, entry.name));
      return entry.isFile() ? [relative(root, join(dir, entry.name)).split(sep).join('/')] : [];
    });
  return walk(root);
}

function sumTests(root: string, files: readonly string[], pattern: RegExp): number {
  const total = files
    .filter((file) => pattern.test(file))
    .reduce((sum, file) => sum + countTests(readFileSync(join(root, file), 'utf8'), file), 0);
  if (total === 0) throw new Error(`siteTelemetry: ningún test en ${pattern.source}.`);
  return total;
}

/** Las cifras del repo en `root`, contadas en `date`. */
export function collectTelemetry(root: string, date: Date): SiteTelemetry {
  const files = listFiles(root);
  return {
    unitTests: sumTests(root, files, UNIT_TESTS),
    e2eTests: sumTests(root, files, E2E_TESTS),
    browsers: ciBrowsers(readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8')),
    decisions: countDecisions(readFileSync(join(root, 'DECISIONS.md'), 'utf8')),
    month: monthOf(date),
  };
}

/**
 * El plugin: sirve `virtual:site-telemetry` con las cifras de `root` (la raíz del repo), contadas al pedirlo (una vez
 * por build; en desarrollo y en Vitest, al arrancar).
 */
export function siteTelemetry(root: string): Plugin {
  const resolved = `\0${SITE_TELEMETRY_MODULE}`;
  return {
    name: 'cosmos:site-telemetry',
    resolveId(id) {
      return id === SITE_TELEMETRY_MODULE ? resolved : null;
    },
    load(id) {
      if (id !== resolved) return null;
      return `export default ${JSON.stringify(collectTelemetry(root, new Date()))};`;
    },
  };
}
