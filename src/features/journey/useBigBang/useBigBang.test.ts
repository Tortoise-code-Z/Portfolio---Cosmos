import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BIG_BANG_VARS } from '~/lib/bigBang/bigBang';
import { M_SMOOTHING } from '~/lib/scroll/smoothM/smoothM';
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
    // Tiembla de verdad (no basta un `0.0px`), dentro de ±0,75 px (1,5 px de amplitud).
    const offsets = [parseFloat(read(BIG_BANG_VARS.shakeX))];
    for (let frame = 0; frame < 5; frame += 1) {
      advance(16);
      offsets.push(parseFloat(read(BIG_BANG_VARS.shakeX)));
    }
    expect(Math.max(...offsets.map(Math.abs))).toBeGreaterThan(0);
    for (const offset of offsets) expect(Math.abs(offset)).toBeLessThanOrEqual(0.75);
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
    expect(read(BIG_BANG_VARS.heroWidth)).toBe('62.0%');
    advance(100);
    // 0,1 s a ritmo 3,4: m = 0,35 · 0,34 = 0,119 → el nombre a medio ensanchar.
    expect(parseFloat(read(BIG_BANG_VARS.heroWidth))).toBeGreaterThan(62);
    expect(parseFloat(read(BIG_BANG_VARS.heroWidth))).toBeLessThan(150);
    advance(100, 40);
    expect(read(BIG_BANG_VARS.heroWidth)).toBe('150.0%');
    expect(pending).toEqual([]);
  });

  it('starting to go down flashes at 0.75 once and it goes out in about 0.6 s, even stopped there', () => {
    renderHook(() => useBigBang());
    advance(16);
    act(() => {
      setScrollTarget(0.1);
    });
    advance(16); // despierta: sin tiempo, m sigue en 0
    expect(read(BIG_BANG_VARS.flash)).toBe('0.000');
    advance(16); // m = 0,1 · 0,054 ≈ 0,005: aún no
    expect(read(BIG_BANG_VARS.flash)).toBe('0.000');
    advance(16, 3); // m ≈ 0,011 → 0,015 → 0,020: salta
    expect(read(BIG_BANG_VARS.flash)).toBe('0.750');
    expect(Math.abs(parseFloat(read(BIG_BANG_VARS.shakeX)))).toBeLessThanOrEqual(3.375);
    advance(100, 7);
    // Parado en m 0,1 (donde antes el destello se quedaba en 0,75 encima del texto): apagado, sin temblor y dormido.
    expect(read(BIG_BANG_VARS.flash)).toBe('0.000');
    expect(read(BIG_BANG_VARS.shakeX)).toBe('0.0px');
    expect(read(BIG_BANG_VARS.shakeY)).toBe('0.0px');
    advance(100, 30);
    expect(read(BIG_BANG_VARS.flash)).toBe('0.000');
    expect(pending).toEqual([]);
  });

  it('it rearms back at the top, and never flashes again while the last hit is still on', () => {
    renderHook(() => useBigBang());
    advance(16);
    act(() => {
      setScrollTarget(0.1);
    });
    advance(16);
    advance(100); // m = 0,034: salta
    expect(read(BIG_BANG_VARS.flash)).toBe('0.750');
    // Sube y baja enseguida: el golpe sigue encendido, así que no se rearma (como mucho uno cada ≈ 0,6 s).
    act(() => {
      setScrollTarget(0);
    });
    advance(100, 3);
    act(() => {
      setScrollTarget(0.1);
    });
    advance(100, 3);
    expect(Number(read(BIG_BANG_VARS.flash))).toBeLessThan(0.75);
    advance(100, 30);
    expect(read(BIG_BANG_VARS.flash)).toBe('0.000');
    // Arriba del todo, con el golpe apagado, se rearma; al volver a bajar, salta otra vez.
    act(() => {
      setScrollTarget(0);
    });
    advance(100, 30);
    act(() => {
      setScrollTarget(0.1);
    });
    advance(16);
    advance(100);
    expect(read(BIG_BANG_VARS.flash)).toBe('0.750');
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

  it('past the hero it keeps following m, so coming back it goes with the scene', () => {
    setScrollTarget(2);
    renderHook(() => useBigBang());
    advance(16);
    act(() => {
      setScrollTarget(3);
    });
    expect(pending).toHaveLength(1);
    advance(100, 60);
    expect(pending).toEqual([]);
    act(() => {
      setScrollTarget(0);
    });
    advance(16); // despierta: sin tiempo
    advance(100, 6);
    // Desde 3 (donde está la escena), no desde 2: m = 3 · 0,66⁶ ≈ 0,248 → espaciado ≈ 0,062 em.
    const m = 3 * (1 - 0.1 * M_SMOOTHING.rate) ** 6;
    expect(parseFloat(read(BIG_BANG_VARS.heroTracking))).toBeCloseTo(m * 0.25, 3);
  });

  it('with reduced motion its m follows at the reduced rate (12), like the scene', () => {
    stubReducedMotion(true);
    renderHook(() => useBigBang());
    advance(16);
    act(() => {
      setScrollTarget(0.35);
    });
    advance(16); // despierta: sin tiempo
    advance(50);
    // 0,05 s a ritmo 12: m = 0,35 · 0,6 = 0,21 → wdth 62 + smoothstep(0,6) · 88 ≈ 119,0 (a ritmo 3,4 sería ≈ 68,8).
    expect(read(BIG_BANG_VARS.heroWidth)).toBe('119.0%');
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

  it('a target that is not a number is ignored: nothing wakes and the next good one works', () => {
    renderHook(() => useBigBang());
    advance(16);
    act(() => {
      setScrollTarget(Number.NaN);
    });
    expect(pending).toEqual([]);
    act(() => {
      setScrollTarget(2);
    });
    advance(16);
    advance(100, 60);
    expect(read(BIG_BANG_VARS.heroWidth)).toBe('150.0%');
    expect(pending).toEqual([]);
  });

  it('if m ever breaks, it starts again from the target', () => {
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
