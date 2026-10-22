// @vitest-environment node
// Lee archivos CSS del disco: no necesita DOM (y el URL de jsdom no acepta rutas file:).

import { readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * Invariantes del design system sobre los CSS de `src/` (ADR-005 · docs/03-diseno/design-system.md):
 * 1. Todo `var(--token)` que se usa está definido en el `:root` de nivel superior de `tokens.css`.
 *    Excepción: las variables privadas de un componente, con prefijo `--_` (`--_progress`).
 * 2. Fuera de `tokens.css`, las propiedades de color solo llevan tokens o palabras clave neutras.
 * 3. Fuera de `tokens.css`, ninguna duración literal en transiciones ni animaciones, y todo fundido
 *    de opacidad usa `--dur-fade-*` (docs/03-diseno/movimiento.md).
 * 4. Fuera de `tokens.css` y `fonts.css`, las familias tipográficas solo salen de `--font-*`.
 * 5. Los colores de texto cumplen contraste AA (≥ 4,5 : 1) sobre el fondo `--color-void`.
 * Cada comprobación tiene su test de guarda: demuestra que detecta lo que dice detectar.
 */

const SRC_DIR = fileURLToPath(new URL('..', import.meta.url));
const TOKENS_FILE = fileURLToPath(new URL('./tokens.css', import.meta.url));
const FONTS_FILE = fileURLToPath(new URL('./fonts.css', import.meta.url));
const WCAG_AA_TEXT = 4.5;
const TEXT_TOKENS = ['ink', 'ink-soft', 'dim', 'star', 'aurora'] as const;
const PRIVATE_VAR_PREFIX = '--_';

// ── Lectura de CSS ───────────────────────────────────────────────────────────

interface Declaration {
  readonly property: string;
  readonly value: string;
}

function listCssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listCssFiles(path);
    return entry.name.endsWith('.css') ? [path] : [];
  });
}

/** Quita los comentarios para no confundir texto explicativo con código. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function readCss(path: string): string {
  return stripComments(readFileSync(path, 'utf8'));
}

/** Declaraciones de un bloque `{ … }` sin anidar. */
function parseDeclarations(body: string): Declaration[] {
  return body.split(';').flatMap((chunk) => {
    const colon = chunk.indexOf(':');
    if (colon === -1) return [];
    const property = chunk.slice(0, colon).trim().toLowerCase();
    const value = chunk.slice(colon + 1).trim();
    return property === '' || value === '' ? [] : [{ property, value }];
  });
}

/** Cada bloque de reglas más interno (los selectores y las at-rules nunca quedan dentro). */
function ruleBlocks(css: string): Declaration[][] {
  return [...css.matchAll(/\{([^{}]*)\}/g)].map((match) => parseDeclarations(match[1] ?? ''));
}

/** Tokens del `:root` de nivel superior; lo que está dentro de una at-rule no cuenta. */
function rootTokens(css: string): Map<string, string> {
  const topLevel = css.replace(/@[^{;]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
  const tokens = new Map<string, string>();
  for (const match of topLevel.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (match[1]?.trim() !== ':root') continue;
    for (const { property, value } of parseDeclarations(match[2] ?? '')) {
      if (property.startsWith('--')) tokens.set(property, value);
    }
  }
  return tokens;
}

/** Quita los `var(…)`, también los anidados en el valor de reserva de otro. */
function withoutVars(value: string): string {
  let current = value;
  for (;;) {
    const next = current.replace(/var\([^()]*\)/g, ' ');
    if (next === current) return current;
    current = next;
  }
}

/** Parte una lista por comas de primer nivel (las de `cubic-bezier(…)` no cuentan). */
function splitTopLevel(value: string): string[] {
  const items: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '(') depth += 1;
    else if (char === ')') depth -= 1;
    else if (char === ',' && depth === 0) {
      items.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }
  items.push(value.slice(start).trim());
  return items;
}

function describeDeclaration({ property, value }: Declaration): string {
  return `${property}: ${value}`;
}

// ── 1 · Tokens sin definir ───────────────────────────────────────────────────

function undefinedTokens(css: string, defined: ReadonlySet<string>): string[] {
  return [...css.matchAll(/var\(\s*(--[\w-]+)/g)]
    .map((match) => match[1] ?? '')
    .filter((token) => !token.startsWith(PRIVATE_VAR_PREFIX) && !defined.has(token));
}

// ── 2 · Colores literales ────────────────────────────────────────────────────

const COLOR_PROPERTY =
  /^(?:color|background(?:-color|-image)?|border(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?(?:-color)?|outline(?:-color)?|fill|stroke|box-shadow|text-shadow|caret-color|accent-color|text-decoration(?:-color)?|column-rule(?:-color)?|scrollbar-color|text-emphasis(?:-color)?)$/;

/**
 * Lo único que puede quedar en una propiedad de color tras quitar los `var(…)`: palabras clave
 * que no son un color y números o medidas (grosores, desplazamientos de sombra).
 * Todo lo demás (`white`, `#fff`, `lab(…)`, `color-mix(…)`…) es un color escrito a mano.
 */
const NEUTRAL_COLOR_WORDS = new Set([
  'transparent',
  'currentcolor',
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
  'none',
  'auto',
  'inset',
  'solid',
  'dashed',
  'dotted',
  'double',
  'groove',
  'ridge',
  'outset',
  'hidden',
  'thin',
  'medium',
  'thick',
  'underline',
  'overline',
  'line-through',
  'wavy',
]);
const NUMBER_OR_LENGTH = /^-?(?:\d+\.?\d*|\.\d+)(?:[a-z]+|%)?$/i;

function colorLiterals(css: string): string[] {
  return ruleBlocks(css)
    .flat()
    .filter((declaration) => COLOR_PROPERTY.test(declaration.property))
    .filter((declaration) =>
      withoutVars(declaration.value)
        .split(/[\s,/]+/)
        .filter((part) => part !== '')
        .some(
          (part) => !NEUTRAL_COLOR_WORDS.has(part.toLowerCase()) && !NUMBER_OR_LENGTH.test(part),
        ),
    )
    .map(describeDeclaration);
}

// ── 3 · Duraciones literales y fundidos ──────────────────────────────────────

const TIMING_PROPERTY = /^(?:transition|animation)$|-(?:duration|delay)$/;
const LITERAL_TIME = /(?<![\w-])-?(?:\d+\.?\d*|\.\d+)m?s(?![\w-])/i;
const FADE_DURATION = 'var(--dur-fade-';

function isOpacity(item: string): boolean {
  return item.trim().split(/\s+/)[0]?.toLowerCase() === 'opacity';
}

function timingProblems(css: string): string[] {
  return ruleBlocks(css).flatMap((block) => {
    const problems = block
      .filter((declaration) => TIMING_PROPERTY.test(declaration.property))
      .filter((declaration) => LITERAL_TIME.test(withoutVars(declaration.value)))
      .map((declaration) => `literal duration · ${describeDeclaration(declaration)}`);

    for (const declaration of block.filter(({ property }) => property === 'transition')) {
      const fades = splitTopLevel(declaration.value).filter(isOpacity);
      if (fades.some((item) => !item.includes(FADE_DURATION))) {
        problems.push(`opacity without --dur-fade-* · ${describeDeclaration(declaration)}`);
      }
    }

    const properties = block.find(({ property }) => property === 'transition-property');
    if (properties !== undefined) {
      const durations = splitTopLevel(
        block.find(({ property }) => property === 'transition-duration')?.value ?? '',
      );
      splitTopLevel(properties.value).forEach((item, index) => {
        const duration = durations[index % durations.length] ?? '';
        if (isOpacity(item) && !duration.includes(FADE_DURATION)) {
          problems.push(`opacity without --dur-fade-* · transition-duration: ${duration}`);
        }
      });
    }
    return problems;
  });
}

// ── 4 · Familias tipográficas ────────────────────────────────────────────────

const FONT_TOKEN = /^var\(--font-[\w-]+\)$/;
const FONT_SHORTHAND_WITH_TOKEN = /\svar\(--font-[\w-]+\)$/;

function fontFamilyLiterals(css: string): string[] {
  return ruleBlocks(css)
    .flat()
    .filter(({ property, value }) => {
      if (property === 'font-family') return value !== 'inherit' && !FONT_TOKEN.test(value);
      if (property === 'font') {
        return (
          value !== 'inherit' && !(FONT_SHORTHAND_WITH_TOKEN.test(value) && !/["']/.test(value))
        );
      }
      return false;
    })
    .map(describeDeclaration);
}

// ── 5 · Contraste ────────────────────────────────────────────────────────────

/** Luminancia relativa de un color #rrggbb opaco (WCAG 2.x). */
function luminance(hex: string): number {
  if (!/^#[\da-f]{6}$/i.test(hex)) {
    throw new Error(`Contrast check needs an opaque #rrggbb color, got "${hex}"`);
  }
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

// ── Datos del repo ───────────────────────────────────────────────────────────

const tokens = rootTokens(readCss(TOKENS_FILE));
const definedTokens = new Set(tokens.keys());
const cssFiles = listCssFiles(SRC_DIR);
const asCases = (paths: readonly string[]): (readonly [string, string])[] =>
  paths.map((path) => [relative(SRC_DIR, path), path] as const);
const componentCss = cssFiles.filter((path) => path !== TOKENS_FILE);
const componentCssWithoutFonts = componentCss.filter((path) => path !== FONTS_FILE);

function tokenValue(name: string): string {
  const value = tokens.get(name);
  if (value === undefined)
    throw new Error(`Token ${name} not found in the top-level :root of tokens.css`);
  return value;
}

describe('design tokens', () => {
  it('finds the CSS files under src/', () => {
    expect(cssFiles.map((path) => basename(path))).toEqual(
      expect.arrayContaining(['tokens.css', 'global.css', 'fonts.css']),
    );
  });

  it.each(asCases(cssFiles))('%s only uses tokens defined in tokens.css', (_name, path) => {
    expect(undefinedTokens(readCss(path), definedTokens)).toEqual([]);
  });

  it.each(asCases(componentCss))('%s has no literal colors (only tokens)', (_name, path) => {
    expect(colorLiterals(readCss(path))).toEqual([]);
  });

  it.each(asCases(componentCss))(
    '%s has no literal durations and fades opacity with --dur-fade-*',
    (_name, path) => {
      expect(timingProblems(readCss(path))).toEqual([]);
    },
  );

  it.each(asCases(componentCssWithoutFonts))(
    '%s only sets fonts through --font-*',
    (_name, path) => {
      expect(fontFamilyLiterals(readCss(path))).toEqual([]);
    },
  );

  it.each(TEXT_TOKENS)('--color-%s meets WCAG AA contrast on --color-void', (name) => {
    const ratio = contrastRatio(tokenValue(`--color-${name}`), tokenValue('--color-void'));
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
  });
});

describe('invariant checks catch what they promise (guards)', () => {
  it('only counts tokens from the top-level :root', () => {
    const defined = rootTokens(
      ':root { --a: 1px; --gutter: 2px } @media (width < 520px) { :root { --only-small: 3px } }',
    );
    expect([...defined.keys()]).toEqual(['--a', '--gutter']);
    expect(
      undefinedTokens('a { margin: var(--a) var(--only-small) }', new Set(defined.keys())),
    ).toEqual(['--only-small']);
  });

  it('allows private component variables (--_x) and anchors token lookups', () => {
    expect(undefinedTokens('a { inline-size: var(--_progress) }', new Set())).toEqual([]);
    expect(rootTokens(':root { --dur-fade-base: 1ms; --dur-base: 2ms }').get('--dur-base')).toBe(
      '2ms',
    );
  });

  it('flags named colors and every color function', () => {
    const css = [
      'a { color: white }',
      'b { background: black }',
      'c { border-color: lab(50% 40 59) }',
      'd { fill: color-mix(in oklab, var(--color-star), red) }',
      'e { box-shadow: 0 0 4px hwb(0 0% 0%) }',
      'f { outline-color: #fff }',
    ].join('\n');
    expect(colorLiterals(css)).toHaveLength(6);
  });

  it('accepts tokens, neutral keywords and lengths, and ignores selectors', () => {
    const css = [
      '#add-button { color: var(--color-ink) }',
      'a { outline: var(--focus-width) solid var(--color-star) }',
      'b { border: var(--border-width) solid transparent; color: currentColor }',
      'c { box-shadow: inset 0 0 0 1px var(--color-faint, var(--color-dim)) }',
    ].join('\n');
    expect(colorLiterals(css)).toEqual([]);
  });

  it('flags literal durations and opacity fades without --dur-fade-*', () => {
    expect(timingProblems('a { transition: opacity 250ms }')).toHaveLength(2);
    expect(timingProblems('a { transition: opacity var(--dur-base) }')).toHaveLength(1);
    expect(timingProblems('a { animation: spin 1s linear }')).toHaveLength(1);
    expect(timingProblems('a { transition-delay: 0.2s }')).toHaveLength(1);
    expect(
      timingProblems(
        'a { transition-property: color, opacity; transition-duration: var(--dur-fast), var(--dur-base) }',
      ),
    ).toHaveLength(1);
  });

  it('accepts token durations and fades on --dur-fade-*', () => {
    const css = [
      'a { transition: opacity var(--dur-fade-base) cubic-bezier(0.16, 1, 0.3, 1), color var(--dur-fast) }',
      'b { transition-property: opacity; transition-duration: var(--dur-fade-slow) }',
    ].join('\n');
    expect(timingProblems(css)).toEqual([]);
  });

  it('flags font families that skip the --font-* tokens', () => {
    expect(fontFamilyLiterals("a { font-family: 'Geologica' }")).toHaveLength(1);
    expect(fontFamilyLiterals('a { font-family: Arial }')).toHaveLength(1);
    expect(fontFamilyLiterals('a { font: 400 1rem "Geologica" }')).toHaveLength(1);
    expect(
      fontFamilyLiterals(
        'a { font-family: var(--font-body) } b { font: inherit } c { font: 400 1rem/1.5 var(--font-mono) }',
      ),
    ).toEqual([]);
  });

  it('detects a failing contrast and refuses translucent colors', () => {
    expect(contrastRatio('#777777', '#888888')).toBeLessThan(WCAG_AA_TEXT);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
    expect(() => contrastRatio('#a4aac380', '#04050b')).toThrow(/opaque #rrggbb/);
  });
});
