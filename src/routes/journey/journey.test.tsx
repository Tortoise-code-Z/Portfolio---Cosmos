import { fireEvent, render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

  it('el scroll fija el m de sceneStore tramo a tramo: About y el Mission log quietos, la cola cambia', async () => {
    // jsdom no maqueta: cada tramo (capítulo, pantalla o cola de un interludio) mide 1000 px, en su orden.
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

    // Tramos: 0 inicio · 1 About · 2 Mission log · 3 su cola · 4 Skills · 5 Projects · 6 Contact.
    expect(at(1500)).toEqual({ mTarget: 1, interlude: null });
    expect(at(1990)).toEqual({ mTarget: 1, interlude: null });
    expect(at(2500)).toEqual({ mTarget: 1, interlude: 'mission-log' });
    // En la cola la nebulosa cambia a galaxia (ventana 0: smoothstep(0; 1; 0,5) = 0,5).
    expect(at(3500).mTarget).toBeCloseTo(1.5);
    expect(at(3500).interlude).toBe('mission-log');
    expect(at(4000)).toEqual({ mTarget: 2, interlude: null });
    expect(at(5000)).toEqual({ mTarget: 3, interlude: null });
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
