import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BIG_BANG_VARS } from '~/lib/bigBang/bigBang';
import { sceneStore, setCharge, setScrollTarget } from '~/stores/sceneStore/sceneStore';

import { BIG_BANG_LIVE_CLASS, useBigBang } from './useBigBang';

/** Bucle de frames manual: una cola, como el navegador. */
let pending: FrameRequestCallback[] = [];
let now = 0;

function advance(ms: number, frames = 1): void {
  for (let index = 0; index < frames; index += 1) {
    now += ms;
    const callbacks = pending;
    pending = [];
    act(() => {
      for (const callback of callbacks) callback(now);
    });
  }
}

/** `matchMedia` falso de movimiento reducido, con su oyente de `change`. */
let reducedListener: ((event: { matches: boolean }) => void) | null = null;
function stubReducedMotion(matches: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: matches && query === '(prefers-reduced-motion: reduce)',
    media: query,
    addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
      reducedListener = listener;
    },
    removeEventListener: () => {
      reducedListener = null;
    },
  }));
}

const read = (name: string): string => document.documentElement.style.getPropertyValue(name);

beforeEach(() => {
  pending = [];
  now = 0;
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: FrameRequestCallback) => {
      pending.push(callback);
      return pending.length;
    }),
  );
  vi.stubGlobal(
    'cancelAnimationFrame',
    vi.fn(() => {
      pending = [];
    }),
  );
  stubReducedMotion(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
  sceneStore.setState(sceneStore.getInitialState(), true);
  reducedListener = null;
});

describe('useBigBang', () => {
  it('at rest it paints the resting values once, marks <html> live and sleeps', () => {
    renderHook(() => useBigBang());
    advance(16);
    expect(read(BIG_BANG_VARS.flash)).toBe('0.000');
    expect(read(BIG_BANG_VARS.shakeX)).toBe('0.0px');
    expect(read(BIG_BANG_VARS.heroWidth)).toBe('62.0%');
    expect(read(BIG_BANG_VARS.heroTracking)).toBe('0.000em');
    expect(read(BIG_BANG_VARS.haloFade)).toBe('1.000');
    expect(read(BIG_BANG_VARS.haloScale)).toBe('1.000');
    expect(document.documentElement).toHaveClass(BIG_BANG_LIVE_CLASS);
    expect(pending).toEqual([]);
  });

  it('opened mid-journey it starts at the target: no flash, the name already wide, the halo gone', () => {
    setScrollTarget(2);
    renderHook(() => useBigBang());
    advance(16);
    expect(read(BIG_BANG_VARS.flash)).toBe('0.000');
    expect(read(BIG_BANG_VARS.heroWidth)).toBe('150.0%');
    expect(read(BIG_BANG_VARS.haloFade)).toBe('0.000');
    expect(pending).toEqual([]);
  });

  it('the charge squeezes the name, grows the halo and shakes; it runs while there is charge', () => {
    renderHook(() => useBigBang());
    advance(16);
    act(() => {
      setCharge(0.5);
    });
    advance(16);
    expect(read(BIG_BANG_VARS.heroWidth)).toBe('56.0%');
    expect(read(BIG_BANG_VARS.haloScale)).toBe('1.800');
    expect(Math.abs(parseFloat(read(BIG_BANG_VARS.shakeX)))).toBeLessThanOrEqual(0.75);
    expect(pending).toHaveLength(1);
    act(() => {
      setCharge(0);
    });
    advance(16);
    expect(read(BIG_BANG_VARS.heroWidth)).toBe('62.0%');
    expect(read(BIG_BANG_VARS.shakeX)).toBe('0.0px');
    expect(pending).toEqual([]);
  });

  it('detonating flashes at 0.95 and fades in about 0.6 s, then sleeps', () => {
    const { result } = renderHook(() => useBigBang());
    advance(16);
    act(() => {
      result.current.detonate();
    });
    // Al despertar, el primer frame no cuenta tiempo (el reloj se para mientras duerme).
    advance(16);
    expect(read(BIG_BANG_VARS.flash)).toBe('0.950');
    advance(100);
    expect(read(BIG_BANG_VARS.flash)).toBe('0.798'); // 0,95 · (1 − 0,1 · 1,6)
    // Un hueco largo cuenta como 0,1 s (como la carga): sin saltos tras una pestaña oculta.
    advance(1000);
    expect(read(BIG_BANG_VARS.flash)).toBe('0.646');
    advance(100, 5);
    expect(read(BIG_BANG_VARS.flash)).toBe('0.000');
    expect(pending).toEqual([]);
  });

  it('follows its own smoothed m (like the scene), not the target as is', () => {
    renderHook(() => useBigBang());
    advance(16);
    act(() => {
      setScrollTarget(0.35);
    });
    advance(100); // despierta: sin tiempo
    expect(read(BIG_BANG_VARS.flash)).toBe('0.000');
    advance(100);
    // 0,1 s a ritmo 3,4: m = 0,35 · 0,34 = 0,119 → el destello en su pico, el nombre a medio ensanchar.
    expect(Number(read(BIG_BANG_VARS.flash))).toBeCloseTo(
      Math.sin((0.119 / 0.2) * Math.PI) * 0.75,
      3,
    );
    expect(parseFloat(read(BIG_BANG_VARS.heroWidth))).toBeLessThan(150);
    advance(100, 40);
    expect(read(BIG_BANG_VARS.heroWidth)).toBe('150.0%');
    expect(pending).toEqual([]);
  });

  it('with reduced motion: no flash and no shake, but the name and the halo still follow', () => {
    stubReducedMotion(true);
    const { result } = renderHook(() => useBigBang());
    advance(16);
    act(() => {
      setCharge(1);
      result.current.detonate();
    });
    advance(16);
    expect(read(BIG_BANG_VARS.flash)).toBe('0.000');
    expect(read(BIG_BANG_VARS.shakeX)).toBe('0.0px');
    expect(read(BIG_BANG_VARS.shakeY)).toBe('0.0px');
    expect(read(BIG_BANG_VARS.heroWidth)).toBe('50.0%');
    expect(read(BIG_BANG_VARS.haloScale)).toBe('2.600');
  });

  it('turning reduced motion on while it shakes stops the shake', () => {
    renderHook(() => useBigBang());
    advance(16);
    act(() => {
      setCharge(1);
    });
    advance(16, 3);
    act(() => {
      reducedListener?.({ matches: true });
    });
    advance(16);
    expect(read(BIG_BANG_VARS.shakeX)).toBe('0.0px');
  });

  it('past the hero, scrolling does not wake it (the values no longer change)', () => {
    setScrollTarget(2);
    renderHook(() => useBigBang());
    advance(16);
    act(() => {
      setScrollTarget(3);
    });
    expect(pending).toEqual([]);
    act(() => {
      setScrollTarget(0.5);
    });
    expect(pending).toHaveLength(1);
  });

  it('writes a variable only when its value changes', () => {
    renderHook(() => useBigBang());
    advance(16);
    const setProperty = vi.spyOn(document.documentElement.style, 'setProperty');
    act(() => {
      setCharge(0.5);
    });
    advance(16);
    const names = setProperty.mock.calls.map(([name]) => name);
    expect(names).not.toContain(BIG_BANG_VARS.heroTracking);
    expect(names).not.toContain(BIG_BANG_VARS.haloFade);
    expect(names).toContain(BIG_BANG_VARS.heroWidth);
  });

  it('on unmount it stops and leaves <html> as it was', () => {
    const { unmount } = renderHook(() => useBigBang());
    advance(16);
    act(() => {
      setCharge(0.5);
    });
    advance(16);
    unmount();
    expect(cancelAnimationFrame).toHaveBeenCalled();
    for (const name of Object.values(BIG_BANG_VARS)) expect(read(name)).toBe('');
    expect(document.documentElement).not.toHaveClass(BIG_BANG_LIVE_CLASS);
    act(() => {
      setCharge(0.8);
    });
    expect(pending).toEqual([]);
  });

  it('a broken m starts again from the target', () => {
    renderHook(() => useBigBang());
    advance(16);
    act(() => {
      sceneStore.setState({ mTarget: Number.NaN });
    });
    advance(16);
    act(() => {
      setScrollTarget(2);
    });
    advance(16);
    expect(read(BIG_BANG_VARS.heroWidth)).toBe('150.0%');
  });
});
