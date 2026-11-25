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

/** `Element.prototype.matches` de jsdom, antes de que ningún test lo espíe. */
const ELEMENT_MATCHES = Object.getOwnPropertyDescriptor(Element.prototype, 'matches')?.value as (
  this: Element,
  selector: string,
) => boolean;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  FakeObserver.last = null;
  document.body.replaceChildren();
  document.documentElement.removeAttribute('style');
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

    /** Las piezas de la llegada por su gancho, no por su sitio. */
    function partsOf(region: HTMLElement): { stage: HTMLElement; landing: HTMLElement } {
      const stage = region.querySelector<HTMLElement>('[data-stage]');
      const landing = region.querySelector<HTMLElement>('[data-landing]');
      if (stage === null || landing === null) throw new Error('No stage or landing marker');
      return { stage, landing };
    }

    /**
     * Coloca en la ventana el escenario (pegado bajo la barra), el marcador del final (a 400 px, con el hueco de la
     * llegada: `offsetTop`, que en jsdom es 0, lo pone el CSS) y el enlace.
     */
    function layOut(region: HTMLElement, link: HTMLElement, linkTop: number, arrival = 1600): void {
      const { stage, landing } = partsOf(region);
      const at = (top: number, height: number) => () =>
        ({ top, bottom: top + height, height }) as DOMRect;
      vi.spyOn(stage, 'getBoundingClientRect').mockImplementation(at(64, 900));
      vi.spyOn(landing, 'getBoundingClientRect').mockImplementation(at(400, 0));
      vi.spyOn(landing, 'offsetTop', 'get').mockReturnValue(arrival);
      vi.spyOn(link, 'getBoundingClientRect').mockImplementation(at(linkTop, 44));
    }

    /** Los frames se corren en el acto; la barra tapa 64 px y la ventana mide 720. */
    function setUpWindow(): ReturnType<typeof vi.fn> {
      vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      });
      return setUpViewport();
    }

    /**
     * La ventana (720 de alto, en 5000), la barra (64 px) y el espía del scroll. El foco enfocado se ve como con Tab
     * (`:focus-visible`): jsdom lo decide con los eventos de antes (los clics de otros tests), así que se fija aquí.
     */
    function setUpViewport(): ReturnType<typeof vi.fn> {
      vi.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, selector) {
        return selector === ':focus-visible'
          ? this === document.activeElement
          : ELEMENT_MATCHES.call(this, selector);
      });
      vi.stubGlobal('innerHeight', 720);
      vi.stubGlobal('scrollY', 5000);
      document.documentElement.style.scrollPaddingBlockStart = '64px';
      const scrollTo = vi.fn();
      vi.stubGlobal('scrollTo', scrollTo);
      return scrollTo;
    }

    /** Frames a mano: se corren cuando el test quiere (para ver qué se cancela). */
    function manualFrames(): { run: () => void; pending: () => number } {
      let queue = new Map<number, FrameRequestCallback>();
      let next = 1;
      vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
        queue.set(next, callback);
        next += 1;
        return next - 1;
      });
      vi.stubGlobal('cancelAnimationFrame', (id: number) => {
        queue.delete(id);
      });
      return {
        run: () => {
          const now = queue;
          queue = new Map();
          for (const callback of now.values()) callback(0);
        },
        pending: () => queue.size,
      };
    }

    it('the marker with the anchor goes first (Tab from the anchor runs through the stage), then the stage and the space', () => {
      const { region } = renderEpilogue();
      expect(region).not.toHaveAttribute('id');
      expect(region).toHaveAttribute('data-chapter', String(EPILOGUE));
      const [landing, stage, space] = [...region.children];
      expect(landing).toHaveAttribute('data-landing', '');
      expect(landing).toHaveAttribute('id', 'crew-file');
      expect(landing).toHaveAttribute('aria-hidden', 'true');
      expect(stage).toHaveAttribute('data-stage', '');
      expect(stage).toHaveTextContent('Crew file');
      expect(space).toHaveAttribute('aria-hidden', 'true');
    });

    it('what takes the focus with Tab below the window, while the stage is held, is brought into view past the arrival', () => {
      const scrollTo = setUpWindow();
      const { region, link } = renderEpilogue();
      layOut(region, link, 760);
      act(() => {
        link.focus();
      });
      // Final de la llegada (400 + 5000 − 64) y lo justo más allá: 64 + (760 − 64) + 44 + 2 − 720 = 86 (los 2 px de
      // seguridad de `stageFocusScroll`; sin anillo ni aire de abajo en este test).
      expect(scrollTo).toHaveBeenCalledWith({ top: 5336 + 86, behavior: 'auto' });
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

    it('counts the focus ring: the box in view with its ring out of it is brought in', () => {
      const scrollTo = setUpWindow();
      document.documentElement.style.setProperty('--focus-offset', '3px');
      document.documentElement.style.setProperty('--focus-width', '3px');
      const { region, link } = renderEpilogue();
      // La caja acaba en 718 (dentro de 720); el anillo, en 724.
      layOut(region, link, 674);
      act(() => {
        link.focus();
      });
      // 64 + (674 − 64) + 44 + 6 + 2 − 720 = 6 px pasado el final de la llegada.
      expect(scrollTo).toHaveBeenCalledWith({ top: 5336 + 6, behavior: 'auto' });
    });

    it('leaves the room the site asks for at the bottom (`scroll-padding-block-end`: the «Copied» notice)', () => {
      const scrollTo = setUpWindow();
      document.documentElement.style.scrollPaddingBlockEnd = '48px';
      const { region, link } = renderEpilogue();
      // Dentro de la ventana (acaba en 704), pero en el aire de abajo.
      layOut(region, link, 660);
      act(() => {
        link.focus();
      });
      // 64 + (660 − 64) + 44 + 2 + 48 − 720 = 34.
      expect(scrollTo).toHaveBeenCalledWith({ top: 5336 + 34, behavior: 'auto' });
    });

    it('a jump focuses the title (tabindex -1): its own smooth scroll is left alone', () => {
      const scrollTo = setUpWindow();
      const { region, link } = renderEpilogue();
      layOut(region, link, 760);
      const title = screen.getByRole('heading', { name: 'Crew file' });
      vi.spyOn(title, 'getBoundingClientRect').mockReturnValue({
        top: 900,
        bottom: 950,
        height: 50,
      } as DOMRect);
      act(() => {
        title.focus({ preventScroll: true });
      });
      expect(title).toHaveFocus();
      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('a click that focuses (no :focus-visible) is left to the browser', () => {
      const scrollTo = setUpWindow();
      const { region, link } = renderEpilogue();
      layOut(region, link, 760);
      vi.spyOn(link, 'matches').mockImplementation((selector) =>
        selector === ':focus-visible' ? false : ELEMENT_MATCHES.call(link, selector),
      );
      act(() => {
        link.focus();
      });
      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('without an arrival (reduced motion: the space is 0) the stage is never held: nothing to do', () => {
      const scrollTo = setUpWindow();
      const { region, link } = renderEpilogue();
      layOut(region, link, 760, 0);
      act(() => {
        link.focus();
      });
      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('the user moving the page (wheel, touch, pointer, a key that is not Tab) stops the watch', () => {
      const frames = manualFrames();
      const scrollTo = setUpViewport();
      const { region, link } = renderEpilogue();
      layOut(region, link, 760);
      for (const move of [
        new WheelEvent('wheel'),
        new Event('touchstart'),
        new Event('pointerdown'),
        new KeyboardEvent('keydown', { key: 'PageUp' }),
      ]) {
        scrollTo.mockClear();
        act(() => {
          link.blur();
          link.focus();
        });
        frames.run();
        expect(scrollTo).toHaveBeenCalledTimes(1);
        window.dispatchEvent(move);
        expect(frames.pending()).toBe(0);
        frames.run();
        expect(scrollTo).toHaveBeenCalledTimes(1);
      }
      // Tab no corta: es lo que se vigila.
      act(() => {
        link.blur();
        link.focus();
      });
      frames.run();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
      expect(frames.pending()).toBe(1);
    });

    it('a second focus halfway restarts the watch: one loop, never two', () => {
      const frames = manualFrames();
      const scrollTo = setUpViewport();
      const { region, link } = renderEpilogue();
      layOut(region, link, 760);
      act(() => {
        link.focus();
      });
      frames.run();
      frames.run();
      act(() => {
        link.blur();
        link.focus();
      });
      expect(frames.pending()).toBe(1);
      scrollTo.mockClear();
      for (let frame = 0; frame < 40; frame += 1) frames.run();
      expect(scrollTo).toHaveBeenCalledTimes(30);
    });

    it('an interlude has no arrival: the focus is left to the browser', () => {
      const scrollTo = setUpWindow();
      const region = renderTransmission();
      expect(region.querySelector('[data-landing]')).toBeNull();
      const line = screen.getByText('Línea');
      line.tabIndex = 0;
      act(() => {
        line.focus();
      });
      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('unmounting stops listening and cancels the frame waiting to run', () => {
      const frames = manualFrames();
      const scrollTo = setUpViewport();
      const { region, link, unmount } = renderEpilogue();
      layOut(region, link, 760);
      act(() => {
        link.focus();
      });
      expect(frames.pending()).toBe(1);
      unmount();
      expect(frames.pending()).toBe(0);
      frames.run();
      window.dispatchEvent(new Event('pointerdown'));
      expect(scrollTo).not.toHaveBeenCalled();
    });
  });
});
