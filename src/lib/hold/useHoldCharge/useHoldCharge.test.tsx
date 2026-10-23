import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CHARGE_VAR, useHoldCharge } from './useHoldCharge';

/** Bucle de frames manual: cada `advance(ms)` dispara el frame pendiente con el reloj avanzado. */
let pending: FrameRequestCallback | null = null;
let now = 0;

function advance(ms: number, frames = 1): void {
  for (let index = 0; index < frames; index += 1) {
    now += ms;
    const callback = pending;
    pending = null;
    act(() => {
      callback?.(now);
    });
  }
}

function setup(): {
  element: HTMLElement;
  onDetonate: ReturnType<typeof vi.fn>;
  result: { current: ReturnType<typeof useHoldCharge> };
  unmount: () => void;
} {
  const element = document.createElement('button');
  const onDetonate = vi.fn();
  const { result, unmount } = renderHook(() => useHoldCharge({ current: element }, onDetonate));
  return { element, onDetonate, result, unmount };
}

const charge = (element: HTMLElement): number =>
  Number(element.style.getPropertyValue(CHARGE_VAR) || '0');

beforeEach(() => {
  pending = null;
  now = 0;
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: FrameRequestCallback) => {
      pending = callback;
      return 1;
    }),
  );
  vi.stubGlobal(
    'cancelAnimationFrame',
    vi.fn(() => {
      pending = null;
    }),
  );
  window.scrollY = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
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
    expect(pending).toBeNull();
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
    expect(pending).toBeNull();
    expect(onDetonate).not.toHaveBeenCalled();
  });

  it('a second press while charging does not start a second loop', () => {
    const { result } = setup();
    act(() => {
      result.current.press();
    });
    act(() => {
      result.current.press();
    });
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  });

  it('after detonating it ignores presses until the page is back at the very top', () => {
    const { element, onDetonate, result } = setup();
    act(() => {
      result.current.press();
    });
    advance(0);
    advance(100, 15);
    expect(result.current.detonated).toBe(true);

    act(() => {
      result.current.press();
    });
    expect(pending).toBeNull();

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
    expect(pending).toBeNull();
  });
});
