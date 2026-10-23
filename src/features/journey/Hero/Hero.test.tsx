import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Hero } from './Hero';

let pending: FrameRequestCallback | null = null;
let now = 0;

/** Avanza el bucle de frames `frames` veces, `ms` cada una. */
function advance(ms: number, frames = 1): void {
  for (let index = 0; index < frames; index += 1) {
    now += ms;
    const callback = pending;
    pending = null;
    act(() => {
      callback?.(now);
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
  pending = null;
  now = 0;
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: FrameRequestCallback) => {
      pending = callback;
      return 1;
    }),
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
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
    fireEvent.pointerDown(screen.getByText(/So did my code\./), { button: 0 });
    fireEvent.pointerDown(screen.getByRole('heading', { level: 1 }), { button: 0 });
    expect(pending).toBeNull();
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
    fireEvent.pointerDown(area, { button: 2 });
    expect(pending).toBeNull();
  });

  it('a pointer down on the button itself is not counted twice', () => {
    renderHero();
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Hold to detonate' }), {
      button: 0,
    });
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  });
});
