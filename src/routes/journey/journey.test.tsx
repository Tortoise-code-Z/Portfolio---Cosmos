import { fireEvent, render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { JOURNEY_SEGMENTS } from '~/content/chapters';
import { EPILOGUE_ARRIVAL } from '~/lib/scroll/arrival/arrival';
import { JOURNEY_SEGMENT_SELECTOR } from '~/features/journey/chapterDom/chapterDom';
import { sceneStore } from '~/stores/sceneStore/sceneStore';

import Journey from './journey';

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
  sceneStore.setState(sceneStore.getInitialState(), true);
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
});

const Stub = createRoutesStub([
  { path: '/', Component: Journey },
  { path: '/es', Component: Journey },
]);

/** Lo enfocable de la página en orden de documento (el del Tab: nada usa `tabindex` positivo). */
function focusableNames(): string[] {
  return [...document.querySelectorAll<HTMLElement>('a[href], button')].map(
    (element) => element.getAttribute('aria-label') ?? element.textContent.trim(),
  );
}

describe('Journey', () => {
  it('el nombre es el único h1', async () => {
    render(<Stub initialEntries={['/']} />);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Víctor Pérez');
  });

  it('monta el modo misión rápida cerrado y vacío, después del raíl (fuera del orden del Tab)', async () => {
    render(<Stub initialEntries={['/']} />);
    await screen.findByRole('heading', { level: 1 });
    const dialog = document.querySelector('dialog');
    expect(dialog).not.toBeNull();
    expect(dialog).not.toHaveAttribute('open');
    expect(dialog).toBeEmptyDOMElement();
    const rail = screen.getByRole('navigation', { name: 'Chapters' });
    expect(
      rail.compareDocumentPosition(dialog as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('frase del hero en inglés en /', async () => {
    render(<Stub initialEntries={['/']} />);
    expect(await screen.findByText(/So did my code\./)).toBeInTheDocument();
  });

  it('frase del hero en español en /es', async () => {
    render(<Stub initialEntries={['/es']} />);
    expect(await screen.findByText(/Mi código también\./)).toBeInTheDocument();
  });

  it('/ES (mayúsculas) es la 404 en inglés, aunque el cliente case la ruta de /es', async () => {
    render(<Stub initialEntries={['/ES']} />);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Lost in space');
  });

  it('la llegada del epílogo sale de la forma que cuentan la escena y la página (EPILOGUE_ARRIVAL, ADR-039)', () => {
    const arrival = JOURNEY_SEGMENTS.find((segment) => segment.kind === 'arrival');
    expect(arrival?.base).toBe(EPILOGUE_ARRIVAL.base);
  });

  it('los tramos del DOM van en el orden de JOURNEY_SEGMENTS (el mapeo de scroll lee uno por cada uno)', async () => {
    render(<Stub initialEntries={['/']} />);
    await screen.findByRole('heading', { level: 1 });
    const inDom = [...document.querySelectorAll<HTMLElement>(JOURNEY_SEGMENT_SELECTOR)].map(
      (element) =>
        element.dataset.chapter ??
        element.dataset.interlude ??
        (element.dataset.interludeArrival === undefined
          ? undefined
          : `${element.dataset.interludeArrival} arrival`) ??
        (element.dataset.interludeExit === undefined
          ? undefined
          : `${element.dataset.interludeExit} exit`) ??
        (element.dataset.landing === undefined
          ? `${element.dataset.interludeTail ?? ''} tail`
          : 'landing'),
    );
    // Un capítulo con llegada se mide en su sección (la llegada) y se lee desde su marcador (`data-landing`).
    expect(inDom).toEqual(
      JOURNEY_SEGMENTS.map((segment, index) => {
        if ('interlude' in segment) {
          const part = {
            interlude: '',
            'interlude-arrival': ' arrival',
            'interlude-exit': ' exit',
            'interlude-tail': ' tail',
          }[segment.kind];
          return `${segment.interlude}${part}`;
        }
        if (segment.kind === 'arrival') return String(segment.chapter);
        const before = JOURNEY_SEGMENTS[index - 1];
        return before?.kind === 'arrival' && before.chapter === segment.chapter
          ? 'landing'
          : String(segment.chapter);
      }),
    );
  });

  it('el scroll fija el m de sceneStore tramo a tramo: About, Projects y Contacto quietos, y las pantallas de los dos interludios; las colas cambian, y la llegada del epílogo al retrato', async () => {
    // jsdom no maqueta: cada tramo (capítulo, hueco de nave, pantalla o cola de un interludio) mide 1000 px, en su
    // orden.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const order = [...document.querySelectorAll(JOURNEY_SEGMENT_SELECTOR)].indexOf(this);
      return { top: Math.max(order, 0) * 1000 - window.scrollY, height: 1000 } as DOMRect;
    });
    render(<Stub initialEntries={['/']} />);
    await screen.findByRole('heading', { level: 1 });
    const at = (y: number): { mTarget: number; interlude: string | null } => {
      Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
      fireEvent.scroll(window);
      const { mTarget, interlude } = sceneStore.getState();
      return { mTarget, interlude };
    };
    const arriving = (): number | null => sceneStore.getState().arriving;

    const j = (): number | null => sceneStore.getState().jTarget;

    // Tramos: 0 inicio · 1 About · 2 la llegada del satélite · 3 Mission log · 4 su salida · 5 su cola · 6 Skills ·
    // 7 Projects · 8 Mission control · 9 su cola · 10 Contact · 11 la llegada del Crew file (su sección) · 12 el Crew
    // file (su marcador).
    expect(at(1500)).toEqual({ mTarget: 1, interlude: null });
    expect(j()).toBe(1.5);
    expect(at(1990)).toEqual({ mTarget: 1, interlude: null });
    // En los huecos del satélite `m` se queda en la nebulosa (la cámara no se mueve) y el raíl ya marca el interludio;
    // la posición en los tramos sigue avanzando (de ella salen la forma y la nave).
    expect(at(2500)).toEqual({ mTarget: 1, interlude: 'mission-log' });
    expect(j()).toBe(2.5);
    expect(at(3500)).toEqual({ mTarget: 1, interlude: 'mission-log' });
    expect(at(4500)).toEqual({ mTarget: 1, interlude: 'mission-log' });
    expect(j()).toBe(4.5);
    // En la cola la forma cambia a galaxia (ventana 0: smoothstep(0; 1; 0,5) = 0,5).
    expect(at(5500).mTarget).toBeCloseTo(1.5);
    expect(at(5500).interlude).toBe('mission-log');
    expect(at(6000)).toEqual({ mTarget: 2, interlude: null });
    expect(at(7000)).toEqual({ mTarget: 3, interlude: null });
    // Projects se queda en la tortuga hasta el final, y la pantalla de Mission control también (sin nave: sin huecos).
    expect(at(7990)).toEqual({ mTarget: 3, interlude: null });
    expect(at(8500)).toEqual({ mTarget: 3, interlude: 'mission-control' });
    // En su cola, la tortuga cambia a la Tierra; Contact llega con ella formada.
    expect(at(9500).mTarget).toBeCloseTo(3.5);
    expect(at(9500).interlude).toBe('mission-control');
    expect(at(10000)).toEqual({ mTarget: 4, interlude: null });
    // Contacto se queda en la Tierra hasta el final; en la llegada del epílogo la Tierra cambia al retrato al ritmo del
    // scroll (en línea recta, `linear`) y el raíl ya marca el epílogo; desde su marcador se lee como capítulo (no es un
    // interludio), con él formado.
    expect(at(10990)).toEqual({ mTarget: 4, interlude: null });
    expect(arriving()).toBeNull();
    expect(at(11000)).toEqual({ mTarget: 4, interlude: null });
    expect(arriving()).toBe(5);
    expect(at(11200).mTarget).toBeCloseTo(4.2);
    expect(at(11500).mTarget).toBeCloseTo(4.5);
    expect(arriving()).toBe(5);
    expect(at(12000)).toEqual({ mTarget: 5, interlude: null });
    expect(arriving()).toBeNull();
    expect(at(12500)).toEqual({ mTarget: 5, interlude: null });
    expect(j()).toBe(12.5);
    // De vuelta a Contacto desde la llegada, el raíl deja de marcar el epílogo.
    at(11500);
    expect(arriving()).toBe(5);
    expect(at(10500)).toEqual({ mTarget: 4, interlude: null });
    expect(arriving()).toBeNull();
  });

  it('con movimiento reducido la llegada mide 0: se pasa de Contacto al epílogo sin parada en medio', async () => {
    // Como el test de arriba, pero el marcador del Crew file cae donde empieza su sección (el hueco mide 0).
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const order = [...document.querySelectorAll(JOURNEY_SEGMENT_SELECTOR)].indexOf(this);
      const top = Math.max(order === 12 ? 11 : order, 0) * 1000;
      return { top: top - window.scrollY, height: 1000 } as DOMRect;
    });
    render(<Stub initialEntries={['/']} />);
    await screen.findByRole('heading', { level: 1 });
    const seen = new Set<number | null>();
    const at = (y: number): number => {
      Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
      fireEvent.scroll(window);
      seen.add(sceneStore.getState().arriving);
      return sceneStore.getState().mTarget;
    };
    expect(at(10990)).toBe(4);
    expect(at(11000)).toBe(5);
    for (let y = 10_000; y <= 12_000; y += 50) at(y);
    expect([...seen]).toEqual([null]);
  });

  it('la sugerencia de idioma va la última en el orden del Tab, después del modo misión rápida', async () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['es-ES']);
    render(<Stub initialEntries={['/']} />);
    const accept = await screen.findByRole('link', { name: 'Ver en español' });
    expect(
      (document.querySelector('dialog') as Node).compareDocumentPosition(accept) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(focusableNames().slice(-2)).toEqual(['Ver en español', 'No, gracias']);
  });
});
