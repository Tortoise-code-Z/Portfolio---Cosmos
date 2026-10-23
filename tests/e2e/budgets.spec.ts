import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { expect, test } from '@playwright/test';

/**
 * Presupuestos que se pueden medir sobre el build antes de Lighthouse CI (F6).
 * Cifras en docs/05-tecnico/calidad.md («Presupuestos»).
 */

const CLIENT_DIR = fileURLToPath(new URL('../../build/client/', import.meta.url));
const ASSETS_DIR = join(CLIENT_DIR, 'assets');
/** Fuentes (todas, woff2 subconjunto latino) ≤ 150 KB. */
const FONT_BUDGET_BYTES = 150_000;
/** Caras de `src/styles/fonts.css`: Anybody, Geologica y Plex Mono 400 y 500. */
const EXPECTED_FONT_FILES = 4;
/**
 * JS inicial de la home (sin escena) ≤ 120 KB gzip. Es una alarma propia, no un requisito externo:
 * el objetivo real son los Core Web Vitals y Lighthouse (brief, F6). Con React 19 + React Router 8
 * el framework ya ocupa ~108 KB; en F2.4 se revisa con la home maquetada (deuda en STATE.md). La página
 * de proyecto (~123 KB en F2.3) queda como deuda anotada en STATE.md hasta entonces.
 */
const HOME_INITIAL_JS_BUDGET_BYTES = 120_000;

/** Todo el JS que pide el HTML pre-renderizado (scripts y modulepreload), comprimido con gzip estándar. */
function initialJsGzipBytes(htmlFile: string): { files: number; bytes: number } {
  const html = readFileSync(join(CLIENT_DIR, htmlFile), 'utf8');
  const scripts = new Set(Array.from(html.matchAll(/\/assets\/[^"']+\.js/g), (match) => match[0]));
  let bytes = 0;
  for (const script of scripts) bytes += gzipSync(readFileSync(join(CLIENT_DIR, script))).length;
  return { files: scripts.size, bytes };
}

test.describe('build budgets', () => {
  test('self-hosted fonts stay within the font budget', () => {
    test.skip(test.info().project.name !== 'chromium', 'Reads the build from disk: once is enough');
    const fonts = readdirSync(ASSETS_DIR).filter((name) => name.endsWith('.woff2'));
    const totalBytes = fonts.reduce((sum, name) => sum + statSync(join(ASSETS_DIR, name)).size, 0);
    expect(fonts).toHaveLength(EXPECTED_FONT_FILES);
    expect(totalBytes).toBeLessThanOrEqual(FONT_BUDGET_BYTES);
  });

  test('initial JS of the home stays within the JS budget', () => {
    test.skip(test.info().project.name !== 'chromium', 'Reads the build from disk: once is enough');
    const { files, bytes } = initialJsGzipBytes('index.html');
    expect(files).toBeGreaterThan(0);
    expect(bytes).toBeLessThanOrEqual(HOME_INITIAL_JS_BUDGET_BYTES);
  });
});
