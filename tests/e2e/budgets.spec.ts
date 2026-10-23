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
 * JS inicial (sin escena), gzip, en dos partes (ADR-020). Es una alarma propia, no un requisito externo:
 * lo que manda son los Core Web Vitals y Lighthouse del brief (F6).
 * - Framework: React 19 + React Router 8 y demás dependencias, en un solo chunk (`entry.client-*`, por
 *   el grupo `framework` de `vite.config.ts`). Medido en F2.4: 107,3 KB. Salta si una subida de versión
 *   lo engorda.
 * - Código propio de cada página: todo lo demás que pide su HTML. Medido en F2.4: home 17,4 KB, proyecto
 *   12,6 KB, 404 7,0 KB; el margen cubre lo que falta de F2 (navegación, misión rápida, galería).
 */
const FRAMEWORK_JS_BUDGET_BYTES = 112_000;
const PAGE_OWN_JS_BUDGET_BYTES = 35_000;
const FRAMEWORK_CHUNK = /\/assets\/entry\.client-[^/]+\.js$/;

/** Una página de cada tipo, en los dos idiomas. */
const PAGES = [
  'index.html',
  'es/index.html',
  'projects/chessmate/index.html',
  'es/projects/chessmate/index.html',
  '404.html',
  'es/404/index.html',
] as const;

/** JS que pide el HTML pre-renderizado (scripts y modulepreload), comprimido con gzip estándar. */
function initialJs(htmlFile: string): {
  framework: string[];
  frameworkBytes: number;
  ownBytes: number;
} {
  const html = readFileSync(join(CLIENT_DIR, htmlFile), 'utf8');
  const scripts = new Set(Array.from(html.matchAll(/\/assets\/[^"']+\.js/g), (match) => match[0]));
  const result = { framework: [] as string[], frameworkBytes: 0, ownBytes: 0 };
  for (const script of scripts) {
    const bytes = gzipSync(readFileSync(join(CLIENT_DIR, script))).length;
    if (FRAMEWORK_CHUNK.test(script)) {
      result.framework.push(script);
      result.frameworkBytes += bytes;
    } else {
      result.ownBytes += bytes;
    }
  }
  return result;
}

test.describe('build budgets', () => {
  test('self-hosted fonts stay within the font budget', () => {
    test.skip(test.info().project.name !== 'chromium', 'Reads the build from disk: once is enough');
    const fonts = readdirSync(ASSETS_DIR).filter((name) => name.endsWith('.woff2'));
    const totalBytes = fonts.reduce((sum, name) => sum + statSync(join(ASSETS_DIR, name)).size, 0);
    expect(fonts).toHaveLength(EXPECTED_FONT_FILES);
    expect(totalBytes).toBeLessThanOrEqual(FONT_BUDGET_BYTES);
  });

  for (const page of PAGES) {
    test(`${page}: framework and own initial JS stay within budget`, () => {
      test.skip(
        test.info().project.name !== 'chromium',
        'Reads the build from disk: once is enough',
      );
      const { framework, frameworkBytes, ownBytes } = initialJs(page);
      expect(framework).toHaveLength(1);
      expect(frameworkBytes).toBeLessThanOrEqual(FRAMEWORK_JS_BUDGET_BYTES);
      expect(ownBytes).toBeGreaterThan(0);
      expect(ownBytes).toBeLessThanOrEqual(PAGE_OWN_JS_BUDGET_BYTES);
    });
  }
});
