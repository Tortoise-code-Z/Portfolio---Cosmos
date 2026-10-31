import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BIG_BANG_VARS } from '~/lib/bigBang/bigBang';
import { sceneStore } from '~/stores/sceneStore/sceneStore';

import { Hero } from './Hero';

/** Su CSS, del disco (con jsdom, `new URL` no lleva a rutas `file:`). */
const heroCss = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'Hero.module.css'),
  'utf8',
);

/** Frames pedidos (la carga y los efectos del Big Bang tienen cada uno su bucle): una cola, como el navegador. */
let pending: FrameRequestCallback[] = [];
let now = 0;

/** Avanza los bucles de frames `frames` veces, `ms` cada una. */
function advance(ms: number, frames = 1): void {
  for (let index = 0; index < frames; index += 1) {
    now += ms;
    const callbacks = pending;
    pending = [];
    act(() => {
      for (const callback of callbacks) callback(now);
    });
  }
}

function renderHero(path = '/'): {
  scrollIntoView: ReturnType<typeof vi.fn>;
  area: HTMLElement;
  aboutTitle: HTMLElement;
} {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Hero />
      <section id="about" aria-labelledby="about-title">
        <h2 id="about-title" tabIndex={-1}>
          About
        </h2>
      </section>
    </MemoryRouter>,
  );
  const scrollIntoView = vi.fn();
  const aboutTitle = screen.getByRole('heading', { name: 'About' });
  const about = aboutTitle.parentElement;
  const area = screen.getByRole('heading', { level: 1 }).parentElement;
  if (about === null || area === null) throw new Error('Hero or About not rendered');
  about.scrollIntoView = scrollIntoView;
  return { scrollIntoView, area, aboutTitle };
}

beforeEach(() => {
  pending = [];
  now = 0;
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: FrameRequestCallback) => {
      pending.push(callback);
      return pending.length;
    }),
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  sceneStore.setState(sceneStore.getInitialState(), true);
});

describe('Hero', () => {
  it('the name is the h1 (two lines) and names the region', () => {
    renderHero();
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveTextContent('Víctor Pérez');
    expect(screen.getByRole('region', { name: 'Víctor Pérez' })).toBeInTheDocument();
  });

  it.each([
    ['/', 'Tortoise_code', 'So did my code.', 'Hold to detonate', 'or scroll'],
    ['/es', 'Tortoise_code', 'Mi código también.', 'Mantén pulsado para detonar', 'o haz scroll'],
  ])('%s: kicker, lead, button and scroll hint', (path, kicker, lead, button, hint) => {
    renderHero(path);
    expect(screen.getByText(kicker)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(lead.replace('.', '\\.')))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: button })).toBeInTheDocument();
    expect(screen.getByText(hint)).toBeInTheDocument();
  });

  it('the CSS singularity is decorative', () => {
    const { container } = render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>,
    );
    expect(container.querySelector('[aria-hidden="true"] > span')).not.toBeNull();
  });

  it('holding the button 1.5 s scrolls to About, focuses its title and leaves the button aria-disabled', () => {
    const { scrollIntoView, aboutTitle } = renderHero();
    const button = screen.getByRole('button', { name: 'Hold to detonate' });
    button.focus();
    fireEvent.keyDown(button, { key: ' ' });
    advance(0);
    advance(100, 15);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(aboutTitle).toHaveFocus();
  });

  it('the charge goes to the scene store (the scene and the Big Bang effects read it there)', () => {
    renderHero();
    const button = screen.getByRole('button', { name: 'Hold to detonate' });
    fireEvent.pointerDown(button, { button: 0, pointerId: 1 });
    advance(0);
    advance(100, 6);
    expect(sceneStore.getState().charge).toBeCloseTo(0.4, 5);
    fireEvent.pointerUp(button, { pointerId: 1 });
    advance(100, 5);
    expect(sceneStore.getState().charge).toBe(0);
  });

  it('charging squeezes the name and detonating sets off the flash (useBigBang)', () => {
    renderHero();
    const root = document.documentElement;
    const button = screen.getByRole('button', { name: 'Hold to detonate' });
    fireEvent.pointerDown(button, { button: 0, pointerId: 1 });
    advance(0);
    advance(100, 8);
    expect(parseFloat(root.style.getPropertyValue(BIG_BANG_VARS.heroWidth))).toBeLessThan(62);
    expect(root.style.getPropertyValue(BIG_BANG_VARS.flash)).toBe('0.000');
    advance(100, 7); // detona
    advance(16);
    expect(Number(root.style.getPropertyValue(BIG_BANG_VARS.flash))).toBeGreaterThan(0.8);
  });

  it('the CSS reads the Big Bang variables, each with its resting value', () => {
    expect(heroCss).toContain(
      `font-stretch: var(${BIG_BANG_VARS.heroWidth}, var(--wdth-hero-rest));`,
    );
    expect(heroCss).toContain(`letter-spacing: var(${BIG_BANG_VARS.heroTracking}, normal);`);
    expect(heroCss).toContain(`opacity: var(${BIG_BANG_VARS.haloFade}, 1);`);
    expect(heroCss).toContain(`transform: scale(var(${BIG_BANG_VARS.haloScale}, 1));`);
    expect(heroCss).toContain(
      `translate: calc(-50% + var(${BIG_BANG_VARS.shakeX}, 0px)) calc(-50% + var(${BIG_BANG_VARS.shakeY}, 0px));`,
    );
  });

  it('holding the empty area of the hero also charges; releasing anywhere drains it', () => {
    const { scrollIntoView, area } = renderHero();
    fireEvent.pointerDown(area, { button: 0 });
    advance(0);
    advance(100, 5);
    fireEvent.pointerUp(window);
    advance(100, 5);
    expect(scrollIntoView).not.toHaveBeenCalled();

    fireEvent.pointerDown(area, { button: 0 });
    advance(0);
    advance(100, 15);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('holding the text of the hero does not charge (it stays selectable)', () => {
    renderHero();
    advance(16); // el primer frame de los efectos del Big Bang, que luego duermen
    fireEvent.pointerDown(screen.getByText(/So did my code\./), { button: 0 });
    fireEvent.pointerDown(screen.getByRole('heading', { level: 1 }), { button: 0 });
    expect(pending).toEqual([]);
    expect(sceneStore.getState().charge).toBe(0);
  });

  it('while the area charges, a long press does not open the context menu; after, it does', () => {
    const { area } = renderHero();
    fireEvent.pointerDown(area, { button: 0 });
    expect(fireEvent.contextMenu(area)).toBe(false);
    fireEvent.pointerUp(window);
    expect(fireEvent.contextMenu(area)).toBe(true);
  });

  it('a secondary pointer button on the area does nothing', () => {
    const { area } = renderHero();
    advance(16);
    fireEvent.pointerDown(area, { button: 2 });
    expect(pending).toEqual([]);
  });

  it('a pointer down on the button is the button gesture: releasing elsewhere does not cut it', () => {
    const { scrollIntoView } = renderHero();
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Hold to detonate' }), {
      button: 0,
      pointerId: 1,
    });
    // Si la zona lo contara como suyo, este «soltar» en la ventana cortaría la carga.
    fireEvent.pointerUp(window, { pointerId: 1 });
    advance(0);
    advance(100, 15);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('on the area, a second finger that touches and lifts does not cut the first one', () => {
    const { scrollIntoView, area } = renderHero();
    fireEvent.pointerDown(area, { button: 0, pointerId: 1 });
    fireEvent.pointerDown(area, { button: 0, pointerId: 2 });
    fireEvent.pointerUp(window, { pointerId: 2 });
    advance(0);
    advance(100, 15);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('a finished area gesture leaves nothing listening on the window', () => {
    const { scrollIntoView, area } = renderHero();
    fireEvent.pointerDown(area, { button: 0, pointerId: 1 });
    fireEvent.pointerUp(window, { pointerId: 1 });
    // Carga nueva desde el teclado: un `pointercancel` cualquiera (un scroll táctil) no la corta.
    fireEvent.keyDown(screen.getByRole('button', { name: 'Hold to detonate' }), { key: ' ' });
    fireEvent.pointerCancel(window, { pointerId: 1 });
    advance(0);
    advance(100, 15);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });
});
