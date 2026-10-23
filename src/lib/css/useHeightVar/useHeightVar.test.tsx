import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useHeightVar } from './useHeightVar';

let observed: ResizeObserverCallback | null = null;
const disconnect = vi.fn();

function stubResizeObserver(): void {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: ResizeObserverCallback) {
        observed = callback;
      }
      observe(): void {
        /* el test dispara el callback a mano */
      }
      disconnect(): void {
        disconnect();
      }
    },
  );
}

function elementOfHeight(height: number): HTMLElement {
  const element = document.createElement('div');
  Object.defineProperty(element, 'offsetHeight', { configurable: true, get: () => height });
  return element;
}

afterEach(() => {
  vi.unstubAllGlobals();
  observed = null;
});

describe('useHeightVar', () => {
  it('writes the height at once and again on every resize; disconnects on unmount', () => {
    stubResizeObserver();
    const element = elementOfHeight(640);
    const { unmount } = renderHook(() => {
      useHeightVar({ current: element }, '--_panel-h');
    });
    expect(element.style.getPropertyValue('--_panel-h')).toBe('640px');

    Object.defineProperty(element, 'offsetHeight', { configurable: true, get: () => 900 });
    observed?.([], {} as ResizeObserver);
    expect(element.style.getPropertyValue('--_panel-h')).toBe('900px');

    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it('does nothing without ResizeObserver or without element', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const element = elementOfHeight(640);
    renderHook(() => {
      useHeightVar({ current: element }, '--_panel-h');
    });
    expect(element.style.getPropertyValue('--_panel-h')).toBe('');
    renderHook(() => {
      useHeightVar({ current: null }, '--_panel-h');
    });
  });
});
