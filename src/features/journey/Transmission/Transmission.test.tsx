import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Transmission, TRANSMISSION_ENTRY } from './Transmission';

/** El observador de la entrada: el test decide cuándo entra la sección en la pantalla (y con qué opciones se creó). */
class FakeObserver {
  static last: FakeObserver | null = null;
  readonly disconnect = vi.fn();
  constructor(
    private readonly callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit,
  ) {
    FakeObserver.last = this;
  }
  readonly observe = vi.fn();
  /** Avisa como un navegador: `isIntersecting` dice si ha entrado. */
  report(isIntersecting: boolean): void {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
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
  return renderWithUnmount().region;
}

function renderWithUnmount(): { region: HTMLElement; unmount: () => void } {
  const { unmount } = render(
    <MemoryRouter initialEntries={['/es']}>
      <Transmission
        id="mission-log"
        anchor="mission-log"
        channel="amber"
        channelLabel="Canal 01 · ámbar"
        incoming="Transmisión entrante"
        titleId="t"
        title="Misión 01"
        clock="t ≈ 200 millones de años"
      >
        <p data-line="">Línea</p>
      </Transmission>
    </MemoryRouter>,
  );
  return { region: screen.getByRole('region', { name: 'Misión 01' }), unmount };
}

/** El capítulo siguiente (Skills) en la página, con su título. */
function addSkills(): ReturnType<typeof vi.fn> {
  const skills = document.createElement('section');
  skills.dataset.chapter = '2';
  skills.setAttribute('aria-labelledby', 'skills-title');
  skills.innerHTML = '<h2 id="skills-title" tabindex="-1">Mi galaxia</h2>';
  const scrollIntoView = vi.fn();
  skills.scrollIntoView = scrollIntoView;
  document.body.append(skills);
  return scrollIntoView;
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
    const scrollIntoView = addSkills();
    const skip = screen.getByRole('link', { name: /Saltar transmisión/ });
    expect(skip).toHaveAttribute('href', '/es#skills');
    await userEvent.click(skip);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Mi galaxia' }));
    expect(window.location.hash).toBe('#skills');
  });

  it('«Skip transmission» with Ctrl/Cmd (another tab) leaves the link alone: no jump here', () => {
    renderTransmission();
    const scrollIntoView = addSkills();
    const skip = screen.getByRole('link', { name: /Saltar transmisión/ });
    const notCancelled = skip.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }),
    );
    expect(notCancelled).toBe(true);
    expect(scrollIntoView).not.toHaveBeenCalled();
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

  it('otherwise it arms on mount and switches on once, when its top passes 80 % of the window', () => {
    reducedMotion(false);
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    const region = renderTransmission();
    // Por margen de la ventana, no por proporción de la sección: una sección muy alta también se enciende.
    expect(FakeObserver.last?.options).toEqual(TRANSMISSION_ENTRY);
    expect(TRANSMISSION_ENTRY).toEqual({ threshold: 0, rootMargin: '0px 0px -20% 0px' });
    expect(region).toHaveAttribute('data-armed', '');
    expect(region).not.toHaveAttribute('data-on');
    act(() => {
      FakeObserver.last?.report(true);
    });
    expect(region).toHaveAttribute('data-on', '');
    expect(FakeObserver.last?.disconnect).toHaveBeenCalledTimes(1);
  });

  it('a report that it is not in view (the first one, on observing) does not switch it on', () => {
    reducedMotion(false);
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    const region = renderTransmission();
    act(() => {
      FakeObserver.last?.report(false);
    });
    expect(region).not.toHaveAttribute('data-on');
    expect(FakeObserver.last?.disconnect).not.toHaveBeenCalled();
  });

  it('unmounting stops observing and takes its marks away', () => {
    reducedMotion(false);
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    const { region, unmount } = renderWithUnmount();
    act(() => {
      FakeObserver.last?.report(true);
    });
    const observer = FakeObserver.last;
    unmount();
    expect(observer?.disconnect).toHaveBeenCalledTimes(2);
    expect(region).not.toHaveAttribute('data-armed');
    expect(region).not.toHaveAttribute('data-on');
  });
});
