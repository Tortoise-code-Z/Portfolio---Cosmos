import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { expect, test } from '@playwright/test';

import { PROJECT_IMAGE_WIDTHS } from '../../src/content/imageWidths.ts';

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
 * - Framework: React 19 + React Router 8 y demás dependencias del JS inicial, en un solo chunk por el
 *   grupo `framework` de `vite.config.ts`. Se llama `entry.client-*` porque la entrada por defecto de
 *   React Router vive en node_modules y el grupo la absorbe; con una entrada propia en src/ saldría como
 *   `framework-*`: se aceptan los dos nombres. Medido en F2.4: 107,3 KB. Salta si una subida de versión
 *   lo engorda.
 * - Código propio de cada página: todo lo demás que pide su HTML. Medido en F2.4: home 17,4 KB, proyecto
 *   12,6 KB, 404 7,0 KB; el margen cubre lo que falta de F2 (navegación, misión rápida, galería).
 */
const FRAMEWORK_JS_BUDGET_BYTES = 112_000;
const PAGE_OWN_JS_BUDGET_BYTES = 35_000;
const FRAMEWORK_CHUNK = /\/assets\/(?:entry\.client|framework)-[^/]+\.js$/;
/**
 * Cada variante de imagen que ofrecen las páginas (AVIF, WebP y el JPEG para compartir), sin comprimir más:
 * ≤ 200 KB. Medido en F2.8: la mayor, 148 KB (WebP de 1920 px de las noticias de AstroHub).
 */
const IMAGE_BUDGET_BYTES = 200_000;
const IMAGE_FILE = /\/assets\/[^"' ,]+\.(?:avif|webp|jpe?g|png)/g;
/** Hoja única (ADR-019), gzip: por encima, revisar si conviene volver a partirla. */
const CSS_BUDGET_BYTES = 50_000;

/** Todos los HTML del build, relativos a build/client: una página nueva entra sola en el presupuesto. */
function htmlPages(dir = CLIENT_DIR): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlPages(path);
    return entry.name.endsWith('.html') ? [relative(CLIENT_DIR, path).replaceAll('\\', '/')] : [];
  });
}

const PAGES = htmlPages();

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

  test('the single stylesheet stays within the CSS budget', () => {
    test.skip(test.info().project.name !== 'chromium', 'Reads the build from disk: once is enough');
    // La hoja que piden las páginas (no lo que haya en assets/, que puede guardar restos de otro build).
    const sheets = new Set(
      PAGES.flatMap((page) =>
        Array.from(
          readFileSync(join(CLIENT_DIR, page), 'utf8').matchAll(/\/assets\/[^"']+\.css/g),
          (match) => match[0],
        ),
      ),
    );
    expect(sheets.size).toBe(1);
    for (const sheet of sheets) {
      expect(gzipSync(readFileSync(join(CLIENT_DIR, sheet))).length).toBeLessThanOrEqual(
        CSS_BUDGET_BYTES,
      );
    }
  });

  test('every image variant the pages offer stays within the image budget', () => {
    test.skip(test.info().project.name !== 'chromium', 'Reads the build from disk: once is enough');
    // Las que piden las páginas (srcset, src y og:image), no lo que haya en assets/ de otro build.
    const images = new Set(
      PAGES.flatMap((page) =>
        Array.from(
          readFileSync(join(CLIENT_DIR, page), 'utf8').matchAll(IMAGE_FILE),
          (match) => match[0],
        ),
      ),
    );
    // Chessmate y AstroHub: 21 capturas × 2 formatos × 3 anchos + 2 JPEG para compartir (128).
    expect(images.size).toBe(21 * 2 * PROJECT_IMAGE_WIDTHS.length + 2);
    const over = [...images]
      .map((image) => ({ image, bytes: statSync(join(CLIENT_DIR, image)).size }))
      .filter(({ bytes }) => bytes > IMAGE_BUDGET_BYTES);
    expect(over).toEqual([]);
  });

  test('the budgets see every page type (home, project and 404, in both languages)', () => {
    test.skip(test.info().project.name !== 'chromium', 'Reads the build from disk: once is enough');
    expect(PAGES).toEqual(
      expect.arrayContaining([
        'index.html',
        'es/index.html',
        'projects/chessmate/index.html',
        'es/projects/chessmate/index.html',
        '404.html',
        'es/404/index.html',
      ]),
    );
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
