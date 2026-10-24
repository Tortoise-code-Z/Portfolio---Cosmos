import { fireEvent, render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { sceneStore } from '~/stores/sceneStore/sceneStore';

import Journey from './journey';

afterEach(() => {
  sceneStore.setState(sceneStore.getInitialState(), true);
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
});

const Stub = createRoutesStub([
  { path: '/', Component: Journey },
  { path: '/es', Component: Journey },
]);

describe('Journey', () => {
  it('el nombre es el único h1', async () => {
    render(<Stub initialEntries={['/']} />);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Víctor Pérez');
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

  it('el scroll fija el m de sceneStore, capítulo a capítulo y con la ventana de cada uno', async () => {
    // jsdom no maqueta: cada capítulo mide 1000 px y empieza donde acaba el anterior.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const index = Number(this.dataset.chapter ?? 0);
      return { top: index * 1000 - window.scrollY, height: 1000 } as DOMRect;
    });
    render(<Stub initialEntries={['/']} />);
    await screen.findByRole('heading', { level: 1 });

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 3000 });
    fireEvent.scroll(window);
    expect(sceneStore.getState().mTarget).toBe(3);

    // Mitad de About: antes de su ventana (CHAPTER_MORPH_START[1] = 0,52), la forma no se mueve…
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1500 });
    fireEvent.scroll(window);
    expect(sceneStore.getState().mTarget).toBe(1);
    // …y a medio camino entre 0,52 y 1 va por la mitad (smoothstep(0,52; 1; 0,76) = 0,5).
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1760 });
    fireEvent.scroll(window);
    expect(sceneStore.getState().mTarget).toBeCloseTo(1.5);
  });
});
