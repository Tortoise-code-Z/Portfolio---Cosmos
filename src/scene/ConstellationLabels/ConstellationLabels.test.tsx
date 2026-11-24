import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { skillGroups } from '~/content/skills';
import { selectActiveSkillGroup, setActiveSkillGroup, useUiStore } from '~/stores/uiStore/uiStore';

import { STAR_LABEL_BOX } from '../config/constellationLayout/constellationLayout';
import { WIDE_LAYOUT_QUERY } from '../config/sceneConfig';
import { registerLabel } from '../labelWriter/labelWriter';
import { ConstellationLabels, createStarLabelElements } from './ConstellationLabels';

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

afterEach(() => {
  useUiStore.setState(useUiStore.getInitialState(), true);
});

function lit(): string | null {
  return selectActiveSkillGroup(useUiStore.getState());
}

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

  it('without texts, nothing (the layer goes to body, so look there); and it leaves when they go', () => {
    const layer = (): Element | null => document.body.querySelector('[data-constellation-labels]');
    const elements = createStarLabelElements();
    const { rerender, unmount } = render(<ConstellationLabels texts={null} elements={elements} />);
    expect(layer()).toBeNull();
    expect(elements.size).toBe(0);
    rerender(<ConstellationLabels texts={texts} elements={elements} />);
    expect(layer()).not.toBeNull();
    rerender(<ConstellationLabels texts={null} elements={elements} />);
    expect(layer()).toBeNull();
    expect(elements.size).toBe(0);
    rerender(<ConstellationLabels texts={texts} elements={elements} />);
    unmount();
    expect(layer()).toBeNull();
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
    expect(label).toContain('font-size: var(--text-star-label);');
    expect(label).not.toMatch(/text-transform|letter-spacing/);
    expect(label).toContain('font-family: var(--font-mono);');
    expect(label).toContain('visibility: hidden;');
    expect(rule('.label::before')).toContain(`inline-size: ${String(STAR_LABEL_BOX.strokePx)}px;`);
    expect(STAR_LABEL_BOX.strokePx).toBeLessThan(startPx);
    // El corte de la letra pequeña es el de la escena (`frame.wide`, que elige su ancho).
    const wideFrom = /\(width >= (\d+)px\)/.exec(WIDE_LAYOUT_QUERY)?.[1] ?? 'none';
    expect(css).toMatch(
      new RegExp(
        String.raw`@media \(width < ${wideFrom}px\) \{\s+\.label \{\s+font-size: var\(--text-star-label-narrow\);`,
      ),
    );
    expect(rule('.layer')).toContain('z-index: var(--z-labels);');
    expect(rule('.layer')).toContain('pointer-events: none;');
  });

  it('readable over the bright core (a dark halo), not selectable, hidden in high contrast, no layer of its own', () => {
    expect(rule('.label')).toContain('text-shadow: var(--halo-star-label);');
    expect(rule('.layer')).toContain('-webkit-user-select: none;');
    expect(rule('.layer')).toMatch(/\n\s+user-select: none;/);
    expect(css).toMatch(/@media \(forced-colors: active\) \{\s+\.layer \{\s+display: none;/);
    expect(css).not.toContain('will-change');
  });

  it('lights at the pace of its group, row and pin (--dur-base), with no system tap highlight', () => {
    expect(rule('.label')).toContain('transition: color var(--dur-base) var(--ease-out);');
    expect(rule('.label')).toContain('-webkit-tap-highlight-color: transparent;');
  });

  it('only the labels the scene marks live take the pointer', () => {
    expect(rule('.layer')).toContain('pointer-events: none;');
    expect(rule('.label')).not.toContain('pointer-events');
    expect(rule('.label[data-live]')).toContain('pointer-events: auto;');
  });

  it('the mouse over a label lights its group and leaving lets it go (only if still lit); a tap lights it', () => {
    const elements = createStarLabelElements();
    render(<ConstellationLabels texts={texts} elements={elements} />);
    const html = elements.get('html');
    const aiPair = elements.get('ai-pair');
    if (html === undefined || aiPair === undefined) throw new Error('no labels');
    fireEvent.pointerEnter(html, { pointerType: 'touch' });
    expect(lit()).toBeNull();
    fireEvent.pointerEnter(html, { pointerType: 'mouse' });
    expect(lit()).toBe('web');
    fireEvent.pointerLeave(html, { pointerType: 'mouse' });
    expect(lit()).toBeNull();
    fireEvent.pointerEnter(html, { pointerType: 'mouse' });
    setActiveSkillGroup('tools');
    fireEvent.pointerLeave(html, { pointerType: 'mouse' });
    expect(lit()).toBe('tools');
    fireEvent.click(aiPair);
    expect(lit()).toBe('ai');
  });

  it('a label with a group that does not exist lights nothing', () => {
    const elements = createStarLabelElements();
    render(<ConstellationLabels texts={texts} elements={elements} />);
    const html = elements.get('html');
    if (html === undefined) throw new Error('no label');
    html.dataset.group = 'nope';
    fireEvent.pointerEnter(html, { pointerType: 'mouse' });
    fireEvent.click(html);
    setActiveSkillGroup('ai');
    fireEvent.pointerLeave(html, { pointerType: 'mouse' });
    expect(lit()).toBe('ai');
  });

  it('its letter sizes are px tokens equal to the box (11 and 10): they do not grow with the browser text size', () => {
    const tokens = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../../styles/tokens.css'),
      'utf8',
    );
    const px = (name: string): number =>
      Number(new RegExp(`${name}:\\s*(\\d+)px;`).exec(tokens)?.[1]);
    expect(px('--text-star-label')).toBe(STAR_LABEL_BOX.fontPx);
    expect(px('--text-star-label-narrow')).toBe(STAR_LABEL_BOX.narrowFontPx);
  });
});
