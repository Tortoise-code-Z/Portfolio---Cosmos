import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CHARGE_VAR, useHoldCharge } from './useHoldCharge';

/**
 * Bucle de frames manual: una cola, como el navegador (un doble bucle dejaría dos callbacks en
 * ella). Cada `advance(ms)` dispara los frames pendientes con el reloj avanzado.
 */
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

function setup(): {
  element: HTMLElement;
  onDetonate: ReturnType<typeof vi.fn>;
  result: { current: ReturnType<typeof useHoldCharge> };
  renders: () => number;
  unmount: () => void;
} {
  const element = document.createElement('button');
  const onDetonate = vi.fn();
  let count = 0;
  const { result, unmount } = renderHook(() => {
    count += 1;
    return useHoldCharge({ current: element }, onDetonate);
  });
  return { element, onDetonate, result, renders: () => count, unmount };
}

const press = (result: { current: ReturnType<typeof useHoldCharge> }): void => {
  act(() => {
    result.current.press();
  });
};

const release = (result: { current: ReturnType<typeof useHoldCharge> }): void => {
  act(() => {
    result.current.release();
  });
};

const charge = (element: HTMLElement): number =>
  Number(element.style.getPropertyValue(CHARGE_VAR) || '0');

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
  window.scrollY = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useHoldCharge', () => {
  it('holding 1.5 s detonates once and writes the charge as a CSS variable', () => {
    const { element, onDetonate, result } = setup();
    act(() => {
      result.current.press();
    });
    advance(0); // primer frame: arranca el reloj
    advance(100, 7);
    expect(charge(element)).toBeCloseTo(0.7 / 1.5, 5);
    expect(onDetonate).not.toHaveBeenCalled();

    advance(100, 8);
    expect(charge(element)).toBe(1);
    expect(onDetonate).toHaveBeenCalledTimes(1);
    expect(result.current.detonated).toBe(true);
  });

  it('after detonating, the charge drains back to 0 on its own and the loop stops', () => {
    const { element, onDetonate, result } = setup();
    press(result);
    advance(0);
    advance(100, 15);
    expect(charge(element)).toBe(1);
    advance(100, 2); // 1 − 0,36
    expect(charge(element)).toBeCloseTo(0.64, 5);
    advance(100, 4);
    expect(charge(element)).toBe(0);
    expect(pending).toEqual([]);
    expect(onDetonate).toHaveBeenCalledTimes(1);
    expect(result.current.detonated).toBe(true);
  });

  it('hands every charge it writes to onCharge, and 0 on unmount with charge left', () => {
    const element = document.createElement('button');
    const onCharge = vi.fn();
    const { result, unmount } = renderHook(() =>
      useHoldCharge({ current: element }, vi.fn(), onCharge),
    );
    press(result);
    advance(0);
    advance(100, 3);
    expect(onCharge).toHaveBeenLastCalledWith(charge(element));
    expect(onCharge.mock.lastCall?.[0]).toBeCloseTo(0.2, 5);
    unmount();
    expect(onCharge).toHaveBeenLastCalledWith(0);
  });

  it('unmounting at rest does not write the charge again', () => {
    const element = document.createElement('button');
    const onCharge = vi.fn();
    const { unmount } = renderHook(() => useHoldCharge({ current: element }, vi.fn(), onCharge));
    unmount();
    expect(onCharge).not.toHaveBeenCalled();
  });

  it('releasing early drains back to 0 and stops the loop without detonating', () => {
    const { element, onDetonate, result } = setup();
    act(() => {
      result.current.press();
    });
    advance(0);
    advance(100, 5);
    act(() => {
      result.current.release();
    });
    advance(100, 10);
    expect(charge(element)).toBe(0);
    expect(pending).toEqual([]);
    expect(onDetonate).not.toHaveBeenCalled();
  });

  it('a second press while charging does not start a second loop', () => {
    const { result } = setup();
    press(result);
    press(result);
    expect(pending).toHaveLength(1);
    advance(0);
    advance(100, 3);
    expect(pending).toHaveLength(1);
  });

  it('press, release and press again while draining: one loop, and it resumes from what is left', () => {
    const { element, onDetonate, result } = setup();
    press(result);
    advance(0);
    advance(100, 9); // 0,6
    release(result);
    advance(100, 2); // 0,6 − 0,36 = 0,24
    expect(charge(element)).toBeCloseTo(0.24, 5);
    press(result);
    expect(pending).toHaveLength(1);
    advance(100, 11); // 0,24 + 1,1 / 1,5 ≈ 0,973
    expect(onDetonate).not.toHaveBeenCalled();
    advance(100, 1);
    expect(onDetonate).toHaveBeenCalledTimes(1);
  });

  it('the loop reuses one callback for every frame (nothing new per frame)', () => {
    const { result } = setup();
    press(result);
    advance(0);
    advance(100, 5);
    const callbacks = new Set(
      vi.mocked(requestAnimationFrame).mock.calls.map(([callback]) => callback),
    );
    expect(callbacks.size).toBe(1);
  });

  it('charging does not re-render; detonating re-renders once (ADR-004)', () => {
    const { result, renders } = setup();
    const before = renders();
    press(result);
    advance(0);
    advance(100, 14);
    expect(renders()).toBe(before);
    advance(100, 1);
    expect(result.current.detonated).toBe(true);
    expect(renders()).toBe(before + 1);
  });

  it.each([
    [
      'the window loses focus',
      (): void => {
        window.dispatchEvent(new Event('blur'));
      },
    ],
    [
      'the tab is hidden',
      (): void => {
        vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
        document.dispatchEvent(new Event('visibilitychange'));
      },
    ],
  ])('releases when %s (a lost pointer up cannot fill it alone)', (_case, leave) => {
    const { element, onDetonate, result } = setup();
    press(result);
    advance(0);
    advance(100, 5);
    act(leave);
    advance(100, 20);
    expect(charge(element)).toBe(0);
    expect(onDetonate).not.toHaveBeenCalled();
  });

  it('a visible tab that changes visibility state does not release', () => {
    const { onDetonate, result } = setup();
    press(result);
    advance(0);
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    advance(100, 15);
    expect(onDetonate).toHaveBeenCalledTimes(1);
  });

  it('after detonating it ignores presses until the page is back at the very top', () => {
    const { element, onDetonate, result } = setup();
    act(() => {
      result.current.press();
    });
    advance(0);
    advance(100, 15);
    expect(result.current.detonated).toBe(true);
    advance(100, 6); // se descarga sola

    act(() => {
      result.current.press();
    });
    expect(pending).toEqual([]);

    window.scrollY = 400;
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current.detonated).toBe(true);

    window.scrollY = 0;
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current.detonated).toBe(false);
    expect(charge(element)).toBe(0);

    act(() => {
      result.current.press();
    });
    advance(0);
    advance(100, 15);
    expect(onDetonate).toHaveBeenCalledTimes(2);
  });

  it('cancels the pending frame on unmount', () => {
    const { result, unmount } = setup();
    act(() => {
      result.current.press();
    });
    unmount();
    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(pending).toEqual([]);
  });
});
