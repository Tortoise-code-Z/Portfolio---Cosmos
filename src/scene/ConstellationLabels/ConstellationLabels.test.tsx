import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { skillGroups } from '~/content/skills';

import { STAR_LABEL_BOX } from '../config/constellationLayout/constellationLayout';
import { ConstellationLabels, createStarLabelElements, registerLabel } from './ConstellationLabels';

/** Su CSS, del disco (con jsdom, `new URL` no lleva a rutas `file:`). */
const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'ConstellationLabels.module.css'),
  'utf8',
);

/** El cuerpo de la regla cuya cabecera, al principio de una línea, es `selector`. */
function rule(selector: string): string {
  const start = css.indexOf(`\n${selector} {`);
  if (start === -1) throw new Error(`No está la regla «${selector}»`);
  return css.slice(start, css.indexOf('}', start));
}

const texts = { html: 'HTML', 'ai-pair': 'AI pair programming' };

describe('ConstellationLabels', () => {
  it('one decorative label per skill, in the panel order, in a layer of its own in body', () => {
    const elements = createStarLabelElements();
    render(<ConstellationLabels texts={texts} elements={elements} />);
    const layer = document.body.querySelector('[data-constellation-labels]');
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(layer?.parentElement).toBe(document.body);
    const ids = skillGroups.flatMap((group) => group.skills.map(({ id }) => id));
    expect(
      [...(layer?.querySelectorAll('[data-skill]') ?? [])].map((el) =>
        el.getAttribute('data-skill'),
      ),
    ).toEqual(ids);
    expect(elements.get('ai-pair')?.textContent).toBe('AI pair programming');
    expect(elements.get('ai-pair')).toHaveAttribute('data-group', 'ai');
    expect(elements.size).toBe(ids.length);
  });

  it('a label without its text is empty; registering nothing does nothing', () => {
    const elements = createStarLabelElements();
    render(<ConstellationLabels texts={texts} elements={elements} />);
    expect(elements.get('vms')?.textContent).toBe('');
    expect(registerLabel(elements, 'vms', null)).toBeUndefined();
    expect(elements.has('vms')).toBe(true);
  });

  it('without texts, nothing', () => {
    const elements = createStarLabelElements();
    const { container } = render(<ConstellationLabels texts={null} elements={elements} />);
    expect(container).toBeEmptyDOMElement();
    expect(elements.size).toBe(0);
  });

  it('its box is STAR_LABEL_BOX: padding, line height, the 6 px stroke, and hidden until the scene places it', () => {
    const { startPx, endPx, padBlockPx, lineHeightPx, heightPx } = STAR_LABEL_BOX;
    expect(lineHeightPx + 2 * padBlockPx).toBe(heightPx);
    const label = rule('.label');
    expect(label).toContain(
      `padding: ${String(padBlockPx)}px ${String(endPx)}px ${String(padBlockPx)}px ${String(startPx)}px;`,
    );
    expect(label).toContain(`line-height: ${String(lineHeightPx)}px;`);
    expect(label).toContain('font-size: var(--text-micro);');
    expect(label).toContain('font-family: var(--font-mono);');
    expect(label).toContain('visibility: hidden;');
    expect(rule('.label::before')).toContain('inline-size: 6px;');
    expect(css).toMatch(
      /@media \(width < 900px\) \{\s+\.label \{\s+font-size: var\(--text-nano\);/,
    );
    expect(rule('.layer')).toContain('z-index: var(--z-labels);');
    expect(rule('.layer')).toContain('pointer-events: none;');
  });

  it('the letter sizes are the ones of the tokens (11 px and 10 px at the root size)', () => {
    const tokens = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../../styles/tokens.css'),
      'utf8',
    );
    const rem = (name: string): number =>
      Number(new RegExp(`${name}:\\s*([\\d.]+)rem;`).exec(tokens)?.[1]) * 16;
    expect(rem('--text-micro')).toBe(STAR_LABEL_BOX.fontPx);
    expect(rem('--text-nano')).toBe(STAR_LABEL_BOX.narrowFontPx);
  });
});
