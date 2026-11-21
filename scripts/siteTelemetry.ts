/**
 * La telemetría de Mission control (docs/02-experiencia/capitulos/interludio-2-mission-control.md → «Telemetría»;
 * ADR-035): las cifras del propio repo, contadas al construir el sitio, nunca a mano. Un plugin de Vite las sirve como
 * el módulo `virtual:site-telemetry`; el pre-renderizado las deja escritas en el HTML.
 *
 * - **Tests escritos**, no ejecuciones: cada llamada a `it` o `test` (también `.only`, `.concurrent`, `.fails` y un
 *   `it.each(…)(…)`) cuenta una vez, leída con el compilador de TypeScript (un comentario o un texto no cuentan).
 *   `test.describe`, `test.skip`, `test.use`… no son tests y no cuentan; una forma que no está en ninguna de las dos
 *   listas (`it.for`, `it.skipIf`, `it.only.each`, ``it.each`tabla` ``…) hace fallar el build: alguien decide si
 *   cuenta. Unitarios: lo que corre Vitest (`UNIT_TEST_GLOBS`, su `include`); e2e: los specs de Playwright
 *   (`E2E_TEST_DIR` y `E2E_TEST_MATCH`, su `testDir` y su `testMatch`). Las dos configs los leen de aquí.
 * - **Navegadores**: la matriz del job `e2e` del CI (`.github/workflows/ci.yml`), cada uno un proyecto de
 *   `playwright.config.ts`.
 * - **Decisiones**: los ADR de `DECISIONS.md` (`## ADR-NNN`), sin números repetidos.
 *
 * Si no encuentra lo que cuenta (sin tests, sin matriz, sin ADR) o algo no cuadra, falla el build: una cifra falsa no
 * llega al sitio.
 */
import { globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import ts from 'typescript';
import type { Plugin } from 'vite';

import type { SiteTelemetry } from '../src/content/types.ts';

/** El módulo que importa el contenido (`src/content/telemetry.ts`). */
export const SITE_TELEMETRY_MODULE = 'virtual:site-telemetry';

/** Los tests que corre Vitest: su `include` (vitest.config.ts) sale de aquí. */
export const UNIT_TEST_GLOBS = ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'];
/** Los specs e2e de Playwright: su `testDir` y su `testMatch` (playwright.config.ts) salen de aquí. */
export const E2E_TEST_DIR = 'tests/e2e';
export const E2E_TEST_MATCH = '**/*.spec.ts';

const TEST_FUNCTIONS = new Set(['it', 'test']);
/** Modificadores que siguen siendo un test (`it.only(…)`). */
const COUNTED_MODIFIERS = new Set(['only', 'concurrent', 'fails']);
/** Modificadores que no son un test: grupos, saltos, ganchos y ayudas de Vitest y Playwright. */
const IGNORED_MODIFIERS = new Set([
  'describe',
  'skip',
  'todo',
  'fixme',
  'use',
  'step',
  'info',
  'slow',
  'setTimeout',
  'extend',
  'beforeEach',
  'afterEach',
  'beforeAll',
  'afterAll',
]);

/** El job de los e2e en ci.yml, hasta el siguiente job (o el final). */
const CI_E2E_JOB = /^ {2}e2e:\n([\s\S]*?)(?=^ {2}[\w-]+:\s*$|(?![\s\S]))/m;
/** Su matriz: `project: [chromium, firefox, webkit]`. */
const CI_BROWSERS = /^\s*project:\s*\[([^\]]*)\]/m;
/** Un nombre de proyecto de Playwright: minúsculas, cifras y guiones (sin comillas). */
const PROJECT_NAME = /^[a-z][a-z0-9-]*$/;
/** Los proyectos de `playwright.config.ts`: `{ name: 'chromium', … }`. */
const PLAYWRIGHT_PROJECT = /\{\s*name:\s*'([^']+)'/g;
const ADR_HEADING = /^## ADR-(\d+)\b/gm;
const MONTH_DIGITS = 2;

function isTestFunction(node: ts.Expression): boolean {
  return ts.isIdentifier(node) && TEST_FUNCTIONS.has(node.text);
}

/** Si `node` es lo que se llama en `parent` (`parent(…)`). */
function isCalleeOf(node: ts.Node, parent: ts.Node | undefined): parent is ts.CallExpression {
  return parent !== undefined && ts.isCallExpression(parent) && parent.expression === node;
}

/** Si una llamada declara un test: `it(…)`, `test.only(…)` o la segunda llamada de `it.each(…)(…)`. */
function declaresTest(call: ts.CallExpression): boolean {
  const callee = call.expression;
  if (isTestFunction(callee)) return true;
  if (ts.isPropertyAccessExpression(callee)) {
    return isTestFunction(callee.expression) && COUNTED_MODIFIERS.has(callee.name.text);
  }
  if (ts.isCallExpression(callee) && ts.isPropertyAccessExpression(callee.expression)) {
    const each = callee.expression;
    return isTestFunction(each.expression) && each.name.text === 'each';
  }
  return false;
}

/**
 * Falla con una forma de `it.<x>`/`test.<x>` que no se sabe contar: un modificador desconocido, uno de los que cuentan
 * seguido de otro (`it.only.each`) o un `each` que no sea `it.each(…)(…)` (``it.each`tabla` ``).
 */
function checkTestForm(access: ts.PropertyAccessExpression, fileName: string): void {
  if (!isTestFunction(access.expression)) return;
  const modifier = access.name.text;
  if (IGNORED_MODIFIERS.has(modifier)) return;
  const call = access.parent;
  const known = COUNTED_MODIFIERS.has(modifier)
    ? isCalleeOf(access, call)
    : modifier === 'each' && isCalleeOf(access, call) && isCalleeOf(call, call.parent);
  if (!known) {
    const form = `${access.expression.getText()}.${modifier}`;
    throw new Error(`siteTelemetry: forma de test desconocida («${form}») en ${fileName}.`);
  }
}

/** Los tests escritos en un archivo (su ruta solo dice si lleva JSX). */
export function countTests(source: string, fileName: string): number {
  const kind = fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, kind);
  let count = 0;
  const visit = (node: ts.Node): void => {
    if (ts.isPropertyAccessExpression(node)) checkTestForm(node, fileName);
    if (ts.isCallExpression(node) && declaresTest(node)) count += 1;
    ts.forEachChild(node, visit);
  };
  visit(file);
  return count;
}

/** Los proyectos de `playwright.config.ts`. */
export function playwrightProjects(config: string): string[] {
  return [...config.matchAll(PLAYWRIGHT_PROJECT)].map((match) => match[1] ?? '');
}

/** Los navegadores de la matriz del job `e2e` del CI: cada uno, un proyecto de Playwright. */
export function ciBrowsers(workflow: string, projects: readonly string[]): string[] {
  const job = CI_E2E_JOB.exec(workflow)?.[1] ?? '';
  const list = CI_BROWSERS.exec(job)?.[1] ?? '';
  const browsers = list
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name !== '');
  if (browsers.length === 0) throw new Error('siteTelemetry: ci.yml sin matriz de navegadores.');
  for (const name of browsers) {
    if (!PROJECT_NAME.test(name) || !projects.includes(name)) {
      throw new Error(`siteTelemetry: «${name}» no es un proyecto de playwright.config.ts.`);
    }
  }
  return browsers;
}

/** Los ADR registrados: cada número una vez. */
export function countDecisions(decisions: string): number {
  const numbers = [...decisions.matchAll(ADR_HEADING)].map((match) => match[1] ?? '');
  if (numbers.length === 0) throw new Error('siteTelemetry: DECISIONS.md sin ADR.');
  const unique = new Set(numbers);
  if (unique.size !== numbers.length) {
    const repeated = numbers.filter((number, index) => numbers.indexOf(number) !== index);
    throw new Error(`siteTelemetry: ADR-${repeated[0] ?? ''} repetido en DECISIONS.md.`);
  }
  return unique.size;
}

/** El mes de una fecha, `AAAA-MM` en UTC. */
export function monthOf(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(MONTH_DIGITS, '0');
  return `${String(date.getUTCFullYear())}-${month}`;
}

/** Los tests escritos en los archivos de `root` que casan con `globs`. */
function sumTests(root: string, globs: readonly string[]): number {
  const total = globSync([...globs], { cwd: root })
    .map((file) => file.replaceAll('\\', '/'))
    .reduce((sum, file) => sum + countTests(readFileSync(join(root, file), 'utf8'), file), 0);
  if (total === 0) throw new Error(`siteTelemetry: ningún test en ${globs.join(', ')}.`);
  return total;
}

/** Las cifras del repo en `root`, contadas en `date`. */
export function collectTelemetry(root: string, date: Date): SiteTelemetry {
  const projects = playwrightProjects(readFileSync(join(root, 'playwright.config.ts'), 'utf8'));
  return {
    unitTests: sumTests(root, UNIT_TEST_GLOBS),
    e2eTests: sumTests(root, [`${E2E_TEST_DIR}/${E2E_TEST_MATCH}`]),
    browsers: ciBrowsers(readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8'), projects),
    decisions: countDecisions(readFileSync(join(root, 'DECISIONS.md'), 'utf8')),
    month: monthOf(date),
  };
}

/**
 * El plugin: sirve `virtual:site-telemetry` con las cifras de `root` (la raíz del repo). Cuenta una sola vez, la
 * primera que se pide, y da lo mismo a cada entorno del build (el cliente y el pre-renderizado): si contaran cada uno,
 * podrían diferir (un cambio de mes a mitad del build) y la hidratación fallaría en ese texto. En desarrollo, las
 * cifras son las del arranque.
 */
export function siteTelemetry(root: string): Plugin {
  const resolved = `\0${SITE_TELEMETRY_MODULE}`;
  let counted: SiteTelemetry | null = null;
  return {
    name: 'cosmos:site-telemetry',
    resolveId(id) {
      return id === SITE_TELEMETRY_MODULE ? resolved : null;
    },
    load(id) {
      if (id !== resolved) return null;
      counted ??= collectTelemetry(root, new Date());
      return `export default ${JSON.stringify(counted)};`;
    },
  };
}
