// @vitest-environment node
// Lee los CSS del disco: no necesita DOM (y el URL de jsdom no acepta rutas file:).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { coverSizes, PROJECT_LAYOUT, thumbSizes } from './imageSizes';

const css = (path: string): string =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  );

const TOKENS = css('../../../styles/tokens.css');
const GALLERY_CSS = css('../ProjectGallery/ProjectGallery.module.css');
const PAGE_CSS = css('../ProjectPage/ProjectPage.module.css');

/** El cuerpo del primer bloque cuya cabecera es `header` (`:root`, `@media (width < 520px)`…). */
function block(source: string, header: string): string {
  const start = source.indexOf(`${header} {`);
  if (start === -1) throw new Error(`No está el bloque «${header}»`);
  return source.slice(start, source.indexOf('}', start));
}

/** Valor de un token en un bloque, en px, siguiendo un `var(--space-n)` o el primero de un `max(…)`. */
function px(body: string, token: string): number {
  const value = new RegExp(`${token}:\\s*([^;]+);`).exec(body)?.[1]?.trim() ?? '';
  const reference = /^(?:max\()?var\((--[\w-]+)\)/.exec(value)?.[1];
  if (reference !== undefined) return px(block(TOKENS, ':root'), reference);
  const number = /^(\d+)px$/.exec(value)?.[1];
  if (number === undefined) throw new Error(`${token}: «${value}» no es un valor en px`);
  return Number(number);
}

describe('medidas de la página de proyecto', () => {
  it('son las de los tokens (columna, columnas de la galería, hueco y margen lateral)', () => {
    const root = block(TOKENS, ':root');
    expect(PROJECT_LAYOUT).toEqual({
      readWidth: px(root, '--read-w'),
      columnMin: px(root, '--project-col-min'),
      gap: px(root, '--space-3'),
      gutter: px(root, '--gutter'),
      gutterSmall: px(
        block(TOKENS, `@media (width < ${String(PROJECT_LAYOUT.smallBelow)}px)`),
        '--gutter',
      ),
      smallBelow: 520,
    });
  });

  it('y las que usan los CSS de la página y de la galería', () => {
    expect(PAGE_CSS).toMatch(/\.page \{[^}]*var\(--gutter\)/);
    expect(PAGE_CSS).toMatch(/\.column \{[^}]*max-inline-size: var\(--read-w\)/);
    expect(PAGE_CSS).toMatch(/\.cover \{[^}]*padding: var\(--space-3\)/);
    expect(GALLERY_CSS).toMatch(
      /\.grid \{[^}]*repeat\(auto-fill, minmax\(var\(--project-col-min\), 1fr\)\)[^}]*gap: var\(--space-3\)/,
    );
  });

  it('en la columna de lectura caben tres miniaturas y no cuatro', () => {
    const { readWidth, columnMin, gap } = PROJECT_LAYOUT;
    expect(3 * columnMin + 2 * gap).toBeLessThanOrEqual(readWidth);
    expect(4 * columnMin + 3 * gap).toBeGreaterThan(readWidth);
  });

  it('portada: 696 px (720 menos su marco) desde 768 px de ventana; por debajo, la ventana', () => {
    expect(coverSizes()).toBe('(min-width: 768px) 696px, 100vw');
  });

  it('miniaturas: tres columnas desde 732 px, dos desde 484 px (margen de 16 px) y una', () => {
    expect(thumbSizes()).toBe('(min-width: 732px) 232px, (min-width: 484px) 50vw, 100vw');
  });
});
