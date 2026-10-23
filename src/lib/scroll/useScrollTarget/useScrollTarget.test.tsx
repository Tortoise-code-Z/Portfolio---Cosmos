import { fireEvent, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useScrollTarget } from './useScrollTarget';

const WINDOWS = [0, 0.52];

function setScrollY(y: number): void {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
}

function box(top: number, height: number): HTMLElement {
  const element = document.createElement('section');
  element.dataset.chapter = '';
  element.getBoundingClientRect = () => ({ top: top - window.scrollY, height }) as DOMRect;
  return element;
}

/** Tres capítulos: 0–1000, 1000–3000 y 3000–4000 px. */
function journey(): HTMLElement {
  const root = document.createElement('main');
  root.append(box(0, 1000), box(1000, 2000), box(3000, 1000));
  return root;
}

function scrollTo(y: number): void {
  setScrollY(y);
  fireEvent.scroll(window);
}

function stubScrollPadding(value: string): void {
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    scrollPaddingBlockStart: value,
  } as CSSStyleDeclaration);
}

afterEach(() => {
  setScrollY(0);
});

describe('useScrollTarget', () => {
  it('gives the target on mount: a reload in the middle of the journey starts there', () => {
    setScrollY(1000);
    const onTarget = vi.fn();
    renderHook(() => {
      useScrollTarget(
        { current: journey() },
        { selector: '[data-chapter]', morphStart: WINDOWS, onTarget },
      );
    });
    expect(onTarget).toHaveBeenLastCalledWith(1);
  });

  it('maps every scroll to m, and stops listening on unmount', () => {
    const onTarget = vi.fn();
    const { unmount } = renderHook(() => {
      useScrollTarget(
        { current: journey() },
        { selector: '[data-chapter]', morphStart: WINDOWS, onTarget },
      );
    });
    scrollTo(500);
    expect(onTarget).toHaveBeenLastCalledWith(0.5);
    scrollTo(3500);
    expect(onTarget).toHaveBeenLastCalledWith(2);

    unmount();
    onTarget.mockClear();
    scrollTo(0);
    expect(onTarget).not.toHaveBeenCalled();
  });

  it('reads from below the fixed bar: landing on an anchor gives that chapter exactly', () => {
    stubScrollPadding('64px');
    const onTarget = vi.fn();
    renderHook(() => {
      useScrollTarget(
        { current: journey() },
        { selector: '[data-chapter]', morphStart: WINDOWS, onTarget },
      );
    });
    // Un ancla deja el capítulo 64 px por debajo del borde de la ventana: justo bajo la barra.
    scrollTo(1000 - 64);
    expect(onTarget).toHaveBeenLastCalledWith(1);
  });

  it('without a scroll padding (`auto`) the reading line is the top of the window', () => {
    stubScrollPadding('auto');
    const onTarget = vi.fn();
    renderHook(() => {
      useScrollTarget(
        { current: journey() },
        { selector: '[data-chapter]', morphStart: WINDOWS, onTarget },
      );
    });
    scrollTo(1000);
    expect(onTarget).toHaveBeenLastCalledWith(1);
  });
});
