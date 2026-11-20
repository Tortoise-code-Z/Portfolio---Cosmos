import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Transmission } from './Transmission';

/** El observador de la entrada: el test decide cuándo entra la sección en la pantalla. */
class FakeObserver {
  static last: FakeObserver | null = null;
  readonly disconnect = vi.fn();
  constructor(private readonly callback: IntersectionObserverCallback) {
    FakeObserver.last = this;
  }
  readonly observe = vi.fn();
  enter(): void {
    this.callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

function reducedMotion(reduced: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: reduced, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
}

function renderTransmission(): HTMLElement {
  render(
    <MemoryRouter initialEntries={['/es']}>
      <Transmission
        id="mission-log"
        anchor="mission-log"
        channel="amber"
        channelLabel="Canal 01 · ámbar"
        incoming="Transmisión entrante"
        titleId="t"
        title="Misión 01"
        skipTo={2}
        clock="t ≈ 200 millones de años"
      >
        <p data-line="">Línea</p>
      </Transmission>
    </MemoryRouter>,
  );
  return screen.getByRole('region', { name: 'Misión 01' });
}

afterEach(() => {
  vi.unstubAllGlobals();
  FakeObserver.last = null;
  document.body.replaceChildren();
});

describe('Transmission', () => {
  it('channel strip, title (focusable by script) and the stopped clock in the footer', () => {
    const region = renderTransmission();
    expect(region).toHaveTextContent('Canal 01 · ámbar');
    expect(screen.getByRole('heading', { level: 2, name: 'Misión 01' })).toHaveAttribute(
      'tabindex',
      '-1',
    );
    expect(region).toHaveTextContent('t ≈ 200 millones de años · reloj cósmico en pausa');
  });

  it('«Skip transmission» is a real link to the next chapter; a click jumps there with the focus on its title', async () => {
    renderTransmission();
    const skills = document.createElement('section');
    skills.dataset.chapter = '2';
    skills.setAttribute('aria-labelledby', 'skills-title');
    skills.innerHTML = '<h2 id="skills-title" tabindex="-1">Mi galaxia</h2>';
    const scrollIntoView = vi.fn();
    skills.scrollIntoView = scrollIntoView;
    document.body.append(skills);
    const skip = screen.getByRole('link', { name: /Saltar transmisión/ });
    expect(skip).toHaveAttribute('href', '/es#skills');
    await userEvent.click(skip);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Mi galaxia' }));
    expect(window.location.hash).toBe('#skills');
  });

  it('without an IntersectionObserver (or JavaScript) nothing is armed: the whole text shows still', () => {
    reducedMotion(false);
    vi.stubGlobal('IntersectionObserver', undefined);
    const region = renderTransmission();
    expect(region).not.toHaveAttribute('data-armed');
  });

  it('with reduced motion nothing is armed either', () => {
    reducedMotion(true);
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    const region = renderTransmission();
    expect(region).not.toHaveAttribute('data-armed');
    expect(FakeObserver.last).toBeNull();
  });

  it('otherwise it arms on mount and switches on once, when it comes into view', () => {
    reducedMotion(false);
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    const region = renderTransmission();
    expect(region).toHaveAttribute('data-armed', '');
    expect(region).not.toHaveAttribute('data-on');
    act(() => {
      FakeObserver.last?.enter();
    });
    expect(region).toHaveAttribute('data-on', '');
    expect(FakeObserver.last?.disconnect).toHaveBeenCalled();
  });
});
