import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EPILOGUE } from '~/content/chapters';

import { Transmission, TRANSMISSION_ENTRY } from './Transmission';

/**
 * Lo que el tipo no deja escribir: un interludio y un capítulo a la vez, o un capítulo que no sea el epílogo. No se
 * ejecuta: lo comprueba `tsc` (un `@ts-expect-error` que no encuentra error falla el `typecheck`).
 */
const COMMON = {
  channel: 'green',
  channelLabel: 'c',
  incoming: 'i',
  titleId: 't',
  title: 'T',
} as const;
export const TYPE_ONLY = (): readonly unknown[] => [
  <Transmission
    {...COMMON}
    id="mission-log"
    clock="t"
    // @ts-expect-error -- un interludio no lleva lo del capítulo
    chapter={EPILOGUE}
    stripEnd="s"
    footer="f"
  >
    x
  </Transmission>,
  // @ts-expect-error -- solo el epílogo se lee como transmisión (otro repetiría su ancla)
  <Transmission {...COMMON} chapter={2} stripEnd="s" footer="f">
    x
  </Transmission>,
];

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

function renderTransmission(open = false): HTMLElement {
  return renderWithUnmount(open).region;
}

function renderWithUnmount(open = false): { region: HTMLElement; unmount: () => void } {
  const { unmount } = render(
    <MemoryRouter initialEntries={['/es']}>
      <Transmission
        open={open}
        id="mission-log"
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
  it('veiled over the scene by default; `open` leaves the scene in sight (the epilogue)', () => {
    expect(renderTransmission().className).not.toMatch(/open/);
    document.body.replaceChildren();
    expect(renderTransmission(true).className).toMatch(/open/);
  });

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

  describe('the arrival of the epilogue (ADR-039)', () => {
    /** El epílogo, con un enlace al fondo de su escenario (como «Download CV»). */
    function renderEpilogue(): { region: HTMLElement; link: HTMLElement; unmount: () => void } {
      const { unmount } = render(
        <MemoryRouter initialEntries={['/']}>
          <Transmission
            open
            chapter={EPILOGUE}
            channel="green"
            channelLabel="Channel 03 · green"
            stripEnd="All channels closed"
            incoming="Crew file · identity verified"
            titleId="crew"
            title="Crew file"
            footer="End of journey"
          >
            <a href="/cv.pdf">Download CV</a>
          </Transmission>
        </MemoryRouter>,
      );
      const region = screen.getByRole('region', { name: 'Crew file' });
      return { region, link: screen.getByRole('link', { name: 'Download CV' }), unmount };
    }

    /** Coloca en la ventana el escenario (pegado bajo la barra), el marcador del final y el enlace. */
    function layOut(region: HTMLElement, link: HTMLElement, linkTop: number): void {
      const stage = region.firstElementChild as HTMLElement;
      const landing = region.querySelector<HTMLElement>('[data-landing]');
      if (landing === null) throw new Error('No landing marker');
      const at = (top: number, height: number) => () =>
        ({ top, bottom: top + height, height }) as DOMRect;
      vi.spyOn(stage, 'getBoundingClientRect').mockImplementation(at(64, 900));
      vi.spyOn(landing, 'getBoundingClientRect').mockImplementation(at(400, 0));
      vi.spyOn(link, 'getBoundingClientRect').mockImplementation(at(linkTop, 44));
    }

    /** Los frames se corren en el acto; la barra tapa 64 px y la ventana mide 720. */
    function setUpWindow(): ReturnType<typeof vi.fn> {
      vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      });
      vi.stubGlobal('innerHeight', 720);
      vi.stubGlobal('scrollY', 5000);
      document.documentElement.style.scrollPaddingBlockStart = '64px';
      const scrollTo = vi.fn();
      vi.stubGlobal('scrollTo', scrollTo);
      return scrollTo;
    }

    it('the content goes in a stage; after it the space of the arrival and the marker with the anchor', () => {
      const { region } = renderEpilogue();
      expect(region).not.toHaveAttribute('id');
      expect(region).toHaveAttribute('data-chapter', String(EPILOGUE));
      const [stage, space, landing] = [...region.children];
      expect(stage).toHaveTextContent('Crew file');
      expect(space).toHaveAttribute('aria-hidden', 'true');
      expect(landing).toHaveAttribute('data-landing', '');
      expect(landing).toHaveAttribute('id', 'crew-file');
    });

    it('what takes the focus below the window, while the stage is held, is brought into view past the arrival', () => {
      const scrollTo = setUpWindow();
      const { region, link } = renderEpilogue();
      layOut(region, link, 760);
      act(() => {
        link.focus();
      });
      // Final de la llegada (400 + 5000 − 64) y lo justo más allá: 64 + (760 − 64) + 44 − 720 = 84 (sin anillo en jsdom).
      expect(scrollTo).toHaveBeenCalledWith({ top: 5336 + 84, behavior: 'auto' });
    });

    it('it keeps looking for a few frames (WebKit scrolls for the focus later), then stops', () => {
      const scrollTo = setUpWindow();
      const { region, link } = renderEpilogue();
      layOut(region, link, 760);
      act(() => {
        link.focus();
      });
      // Con el enlace siempre fuera de la vista (las cajas no cambian en jsdom): un intento por frame, y se acaba.
      expect(scrollTo).toHaveBeenCalledTimes(30);
    });

    it('what is already in view is left where it is', () => {
      const scrollTo = setUpWindow();
      const { region, link } = renderEpilogue();
      layOut(region, link, 300);
      act(() => {
        link.focus();
      });
      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('an interlude has no arrival: the focus is left to the browser', () => {
      const scrollTo = setUpWindow();
      const region = renderTransmission();
      expect(region.querySelector('[data-landing]')).toBeNull();
      const line = screen.getByText('Línea');
      line.tabIndex = -1;
      act(() => {
        line.focus();
      });
      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('unmounting stops listening', () => {
      const scrollTo = setUpWindow();
      const { region, link, unmount } = renderEpilogue();
      layOut(region, link, 760);
      const remove = vi.spyOn(region, 'removeEventListener');
      unmount();
      expect(remove).toHaveBeenCalledWith('focusin', expect.any(Function));
      expect(scrollTo).not.toHaveBeenCalled();
    });
  });
});
