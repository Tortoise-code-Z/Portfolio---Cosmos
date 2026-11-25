import { render } from '@testing-library/react';
import { useRef, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sceneStore } from '~/stores/sceneStore/sceneStore';

import { PORTRAIT_FOLLOW_MARGIN, usePortraitFollow } from './usePortraitFollow';

function Frame(): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  usePortraitFollow(ref);
  return <div ref={ref} data-testid="frame" />;
}

/** La ventana: 1000 × 800 (el centro, 500, 400). */
const VIEWPORT = { width: 1000, height: 800 };
let box = { left: 400, top: 300, width: 200, height: 400 };

/** Los `ResizeObserver` que se crean: su función y lo que observan. */
let observers: { callback: () => void; targets: Element[]; disconnected: boolean }[] = [];

class FakeResizeObserver {
  private readonly entry: (typeof observers)[number];
  constructor(callback: () => void) {
    this.entry = { callback, targets: [], disconnected: false };
    observers.push(this.entry);
  }
  observe(target: Element): void {
    this.entry.targets.push(target);
  }
  disconnect(): void {
    this.entry.disconnected = true;
  }
}

/** Los `IntersectionObserver`: su función, su margen y lo que observan. */
let intersections: {
  callback: IntersectionObserverCallback;
  margin: string | undefined;
  targets: Element[];
  disconnected: boolean;
}[] = [];

class FakeIntersectionObserver {
  private readonly entry: (typeof intersections)[number];
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.entry = { callback, margin: options?.rootMargin, targets: [], disconnected: false };
    intersections.push(this.entry);
  }
  observe(target: Element): void {
    this.entry.targets.push(target);
  }
  disconnect(): void {
    this.entry.disconnected = true;
  }
}

/** El marco entra cerca de la ventana (o sale), como lo diría el navegador. */
function near(isIntersecting: boolean): void {
  const observer = intersections[0];
  observer?.callback(
    [{ isIntersecting } as IntersectionObserverEntry],
    observer as unknown as IntersectionObserver,
  );
}

beforeEach(() => {
  observers = [];
  intersections = [];
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  box = { left: 400, top: 300, width: 200, height: 400 };
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(VIEWPORT.height);
  // `<html>`: la ventana (el ancho del lienzo); lo demás, el marco.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ): DOMRect {
    const rect = this === document.documentElement ? { left: 0, top: 0, ...VIEWPORT } : box;
    return {
      ...rect,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      x: rect.left,
      y: rect.top,
      toJSON: () => rect,
    };
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  sceneStore.setState(sceneStore.getInitialState(), true);
});

describe('usePortraitFollow', () => {
  it('on mount, leaves in the store how far the frame is from the centre of the window', () => {
    render(<Frame />);
    expect(sceneStore.getState().portraitShift).toEqual({ x: 0, y: 100 });
  });

  it('follows the frame with the scroll while it is near the window (one window above or below)', () => {
    const { getByTestId } = render(<Frame />);
    expect(intersections[0]?.targets).toEqual([getByTestId('frame')]);
    expect(intersections[0]?.margin).toBe(PORTRAIT_FOLLOW_MARGIN);
    // Lejos, el scroll no mide (no lee el layout en cada scroll de toda la página).
    box = { ...box, top: 5000 };
    window.dispatchEvent(new Event('scroll'));
    expect(sceneStore.getState().portraitShift).toEqual({ x: 0, y: 100 });
    // Al acercarse, mide ya, y después con cada scroll.
    near(true);
    expect(sceneStore.getState().portraitShift).toEqual({ x: 0, y: 4800 });
    box = { ...box, top: -600 };
    window.dispatchEvent(new Event('scroll'));
    expect(sceneStore.getState().portraitShift).toEqual({ x: 0, y: -800 });
    box = { ...box, left: 300 };
    window.dispatchEvent(new Event('resize'));
    expect(sceneStore.getState().portraitShift).toEqual({ x: -100, y: -800 });
  });

  it('measures again when the frame changes size, and a hidden frame (no size) moves nothing', () => {
    const { getByTestId } = render(<Frame />);
    const [observer] = observers;
    expect(observer?.targets).toEqual([getByTestId('frame'), document.body]);
    box = { ...box, width: 0, height: 0 };
    observer?.callback();
    expect(sceneStore.getState().portraitShift).toEqual({ x: 0, y: 0 });
  });

  it('stops following the scroll when the frame goes far', () => {
    render(<Frame />);
    near(true);
    near(false);
    box = { ...box, top: -600 };
    window.dispatchEvent(new Event('scroll'));
    expect(sceneStore.getState().portraitShift).toEqual({ x: 0, y: 100 });
  });

  it('on unmount, stops following and leaves the scene unmoved', () => {
    const { unmount } = render(<Frame />);
    near(true);
    unmount();
    expect(observers[0]?.disconnected).toBe(true);
    expect(intersections[0]?.disconnected).toBe(true);
    expect(sceneStore.getState().portraitShift).toEqual({ x: 0, y: 0 });
    box = { ...box, top: -600 };
    window.dispatchEvent(new Event('scroll'));
    expect(sceneStore.getState().portraitShift).toEqual({ x: 0, y: 0 });
  });

  it('without ResizeObserver, still follows the scroll', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    render(<Frame />);
    near(true);
    box = { ...box, top: 0 };
    window.dispatchEvent(new Event('scroll'));
    expect(sceneStore.getState().portraitShift).toEqual({ x: 0, y: -200 });
  });

  it('without IntersectionObserver, it measures on mount and on resize, but does not follow the scroll', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    render(<Frame />);
    box = { ...box, top: 0 };
    window.dispatchEvent(new Event('scroll'));
    expect(sceneStore.getState().portraitShift).toEqual({ x: 0, y: 100 });
    window.dispatchEvent(new Event('resize'));
    expect(sceneStore.getState().portraitShift).toEqual({ x: 0, y: -200 });
  });
});
