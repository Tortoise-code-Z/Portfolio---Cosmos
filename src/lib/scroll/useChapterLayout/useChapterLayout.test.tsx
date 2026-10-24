import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { measureChapters, useChapterLayout } from './useChapterLayout';

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

function stubFonts(ready: Promise<unknown>): void {
  Object.defineProperty(document, 'fonts', { configurable: true, value: { ready } });
}

function setScrollY(y: number): void {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
}

/** Un elemento cuyo inicio en el documento es `top` (la caja se mide respecto a la ventana). */
function box(top: number, height: number): HTMLElement {
  const element = document.createElement('section');
  element.dataset.chapter = '';
  element.getBoundingClientRect = () => ({ top: top - window.scrollY, height }) as DOMRect;
  return element;
}

function rootWith(...children: HTMLElement[]): HTMLElement {
  const root = document.createElement('main');
  root.append(...children, document.createElement('aside'));
  return root;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document, 'fonts');
  observed = null;
  setScrollY(0);
});

describe('measureChapters', () => {
  it('measures each element from the start of the document, whatever the scroll', () => {
    setScrollY(700);
    expect(measureChapters([box(0, 1500), box(1500, 2100)])).toEqual([
      { top: 0, height: 1500 },
      { top: 1500, height: 2100 },
    ]);
  });
});

describe('useChapterLayout', () => {
  it('measures only the chapters, on mount and on every resize; disconnects on unmount', () => {
    stubResizeObserver();
    const first = box(0, 1500);
    const root = rootWith(first, box(1500, 2100));
    const onLayout = vi.fn();
    const { unmount } = renderHook(() => {
      useChapterLayout({ current: root }, '[data-chapter]', onLayout);
    });
    expect(onLayout).toHaveBeenLastCalledWith([
      { top: 0, height: 1500 },
      { top: 1500, height: 2100 },
    ]);

    first.getBoundingClientRect = () => ({ top: 0, height: 1800 }) as DOMRect;
    observed?.([], {} as ResizeObserver);
    expect(onLayout).toHaveBeenLastCalledWith([
      { top: 0, height: 1800 },
      { top: 1500, height: 2100 },
    ]);

    expect(disconnect).not.toHaveBeenCalled();
    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it('measures again once the fonts have loaded', async () => {
    stubFonts(Promise.resolve());
    const onLayout = vi.fn();
    renderHook(() => {
      useChapterLayout({ current: rootWith(box(0, 100)) }, '[data-chapter]', onLayout);
    });
    await waitFor(() => {
      expect(onLayout).toHaveBeenCalledTimes(2);
    });
  });

  it('logs a font failure and keeps the first measure', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    stubFonts(Promise.reject(new Error('network')));
    const onLayout = vi.fn();
    renderHook(() => {
      useChapterLayout({ current: rootWith(box(0, 100)) }, '[data-chapter]', onLayout);
    });
    await waitFor(() => {
      expect(error).toHaveBeenCalledWith(expect.stringContaining('[scroll]'), expect.any(Error));
    });
    expect(onLayout).toHaveBeenCalledTimes(1);
  });

  it('does not measure after unmount (fonts that load late)', async () => {
    let loaded: () => void = () => undefined;
    stubFonts(
      new Promise<void>((resolve) => {
        loaded = resolve;
      }),
    );
    const onLayout = vi.fn();
    const { unmount } = renderHook(() => {
      useChapterLayout({ current: rootWith(box(0, 100)) }, '[data-chapter]', onLayout);
    });
    unmount();
    loaded();
    await Promise.resolve();
    expect(onLayout).toHaveBeenCalledTimes(1);
  });

  it('does nothing without a root (the page is not the journey)', () => {
    const onLayout = vi.fn();
    renderHook(() => {
      useChapterLayout({ current: null }, '[data-chapter]', onLayout);
    });
    expect(onLayout).not.toHaveBeenCalled();
  });
});
