import { act, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { sceneStore, setReadingInterlude, setScrollTarget } from '~/stores/sceneStore/sceneStore';

import { CosmicHud } from './CosmicHud';

afterEach(() => {
  sceneStore.setState(sceneStore.getInitialState(), true);
});

function renderHud(path = '/'): HTMLElement {
  const { container } = render(
    <MemoryRouter initialEntries={[path]}>
      <CosmicHud />
    </MemoryRouter>,
  );
  const hud = container.firstElementChild;
  if (!(hud instanceof HTMLElement)) throw new Error('HUD not rendered');
  return hud;
}

describe('CosmicHud', () => {
  it('is decorative and starts at the singularity (what the pre-rendered page shows)', () => {
    const hud = renderHud();
    expect(hud).toHaveAttribute('aria-hidden', 'true');
    expect(hud).toHaveTextContent('t = 0 s · singularity');
    expect(hud).toHaveTextContent('scale ≈ 10⁻³⁵ m');
  });

  it('follows m from sceneStore: clock with its value apart, and the scale of the active chapter', () => {
    const hud = renderHud();
    act(() => {
      setScrollTarget(1);
    });
    expect(hud).toHaveTextContent('t ≈ 200 million years');
    expect(hud.querySelector('[class*="value"]')).toHaveTextContent(/^200$/);
    expect(hud).toHaveTextContent('scale ≈ 20 light-years');

    act(() => {
      setScrollTarget(3);
    });
    expect(hud).toHaveTextContent('t = ∞ · mythic time');
    expect(hud).toHaveTextContent('scale · 1 turtle, mythic size');
  });

  it('hides while an interlude is read (its footer shows the stopped clock) and comes back after', () => {
    const hud = renderHud();
    expect(hud).not.toHaveAttribute('data-hidden');
    act(() => {
      setScrollTarget(1);
      setReadingInterlude('mission-log');
    });
    expect(hud).toHaveAttribute('data-hidden');
    // La segunda mitad de la cola ya es Skills: el raíl lo marca y el HUD vuelve.
    act(() => {
      setScrollTarget(1.6);
    });
    expect(hud).not.toHaveAttribute('data-hidden');
    act(() => {
      setScrollTarget(1.2);
      setReadingInterlude(null);
    });
    expect(hud).not.toHaveAttribute('data-hidden');
  });

  it('shows the current m at once if the journey was already under way (reload mid-page)', () => {
    setScrollTarget(2);
    expect(renderHud()).toHaveTextContent('t ≈ 1 billion years');
  });

  it('speaks the language of the page', () => {
    const hud = renderHud('/es');
    act(() => {
      setScrollTarget(4);
    });
    expect(hud).toHaveTextContent('t ≈ 13.800 millones de años');
    expect(hud).toHaveTextContent('escala · 12.742 km de diámetro');
  });

  it('touches the DOM only when its text changes', async () => {
    const hud = renderHud();
    act(() => {
      setScrollTarget(1);
    });
    const mutations: MutationRecord[] = [];
    const observer = new MutationObserver((records) => mutations.push(...records));
    observer.observe(hud, { subtree: true, childList: true, characterData: true });
    // Un paso de 0,001 en `m` no cambia el texto: 200 Ma × 5^0,001 redondea a 200 con 2 cifras.
    act(() => {
      setScrollTarget(1.001);
      setScrollTarget(1.002);
    });
    await Promise.resolve();
    expect(mutations).toHaveLength(0);
    observer.disconnect();
  });

  it('stops listening on unmount', () => {
    const subscribe = sceneStore.subscribe.bind(sceneStore);
    const unsubscribe = vi.fn();
    vi.spyOn(sceneStore, 'subscribe').mockImplementation((listener) => {
      const stop = subscribe(listener);
      return () => {
        unsubscribe();
        stop();
      };
    });
    const { unmount } = render(
      <MemoryRouter>
        <CosmicHud />
      </MemoryRouter>,
    );
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
