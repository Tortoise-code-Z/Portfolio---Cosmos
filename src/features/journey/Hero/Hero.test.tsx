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

function renderHero(path = '/'): { scrollIntoView: ReturnType<typeof vi.fn> } {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Hero />
      <section id="about">About</section>
    </MemoryRouter>,
  );
  const scrollIntoView = vi.fn();
  screen.getByText('About').scrollIntoView = scrollIntoView;
  return { scrollIntoView };
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

  it('holding the button 1.5 s scrolls to About and leaves the button aria-disabled', () => {
    const { scrollIntoView } = renderHero();
    const button = screen.getByRole('button', { name: 'Hold to detonate' });
    fireEvent.keyDown(button, { key: ' ' });
    advance(0);
    advance(100, 15);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('holding an empty area of the hero also charges; links and buttons do not', () => {
    const { scrollIntoView } = renderHero();
    const lead = screen.getByText(/So did my code\./);
    fireEvent.pointerDown(lead, { button: 0 });
    advance(0);
    advance(100, 5);
    fireEvent.pointerUp(window);
    advance(100, 5);
    expect(scrollIntoView).not.toHaveBeenCalled();

    fireEvent.pointerDown(lead, { button: 0 });
    advance(0);
    advance(100, 15);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('a secondary pointer button on the area does nothing', () => {
    renderHero();
    fireEvent.pointerDown(screen.getByText(/So did my code\./), { button: 2 });
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
