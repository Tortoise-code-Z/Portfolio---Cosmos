// @vitest-environment node
// Lee archivos CSS del disco: no necesita DOM (y el URL de jsdom no acepta rutas file:).

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * Invariantes del design system sobre los CSS de `src/` (ADR-005 · docs/03-diseno/design-system.md):
 * 1. Todo `var(--token)` que se usa está definido en `tokens.css`.
 * 2. Ningún CSS fuera de `tokens.css` escribe un color literal.
 * 3. Los colores de texto cumplen contraste AA (≥ 4,5 : 1) sobre el fondo `--color-void`.
 */

const SRC_DIR = fileURLToPath(new URL('..', import.meta.url));
const TOKENS_FILE = fileURLToPath(new URL('./tokens.css', import.meta.url));
const WCAG_AA_TEXT = 4.5;
const TEXT_TOKENS = ['ink', 'ink-soft', 'dim', 'star', 'aurora'] as const;

function listCssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listCssFiles(path);
    return entry.name.endsWith('.css') ? [path] : [];
  });
}

/** Quita los comentarios para no confundir texto explicativo con código. */
function readCss(path: string): string {
  return readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
}

const tokensCss = readCss(TOKENS_FILE);
const definedTokens = new Set([...tokensCss.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
const cssFiles = listCssFiles(SRC_DIR);

function tokenValue(name: string): string {
  const match = new RegExp(`${name}\\s*:\\s*([^;]+);`).exec(tokensCss);
  if (match?.[1] === undefined) throw new Error(`Token ${name} not found in tokens.css`);
  return match[1].trim();
}

/** Luminancia relativa de un color #rrggbb (WCAG 2.x). */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const [r = 0, g = 0, b = 0] = channels;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground: string, background: string): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

describe('design tokens', () => {
  it('finds the CSS files under src/', () => {
    expect(cssFiles.length).toBeGreaterThanOrEqual(3);
  });

  it.each(cssFiles.map((path) => [relative(SRC_DIR, path), path] as const))(
    '%s only uses tokens defined in tokens.css',
    (_name, path) => {
      const used = [...readCss(path).matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]);
      const undefinedTokens = used.filter((token) => !definedTokens.has(token));
      expect(undefinedTokens).toEqual([]);
    },
  );

  it.each(
    cssFiles
      .filter((path) => path !== TOKENS_FILE)
      .map((path) => [relative(SRC_DIR, path), path] as const),
  )('%s has no literal colors (only tokens)', (_name, path) => {
    const literals = readCss(path).match(/#[\da-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab)\(/gi);
    expect(literals).toBeNull();
  });

  it.each(TEXT_TOKENS)('--color-%s meets WCAG AA contrast on --color-void', (name) => {
    const ratio = contrastRatio(tokenValue(`--color-${name}`), tokenValue('--color-void'));
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
  });

  it('detects a failing contrast (guard for the check itself)', () => {
    expect(contrastRatio('#777777', '#888888')).toBeLessThan(WCAG_AA_TEXT);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
  });
});
