import { afterEach, describe, expect, it, vi } from 'vitest';

import { createScenePointer, watchPointer } from './pointer';

/** Un `pointermove` o `pointerout` en la ventana (jsdom no trae `PointerEvent`: se arma sobre `MouseEvent`). */
function pointerEvent(
  type: 'pointermove' | 'pointerout',
  init: {
    pointerType?: string;
    clientX?: number;
    clientY?: number;
    relatedTarget?: EventTarget | null;
  },
): Event {
  const event = new MouseEvent(type, {
    clientX: init.clientX ?? 0,
    clientY: init.clientY ?? 0,
    relatedTarget: init.relatedTarget ?? null,
  });
  Object.defineProperty(event, 'pointerType', { value: init.pointerType ?? 'mouse' });
  return event;
}

let stop: (() => void) | null = null;

afterEach(() => {
  stop?.();
  stop = null;
  vi.unstubAllGlobals();
});

describe('createScenePointer', () => {
  it('starts centred and outside', () => {
    expect(createScenePointer()).toEqual({ x: 0, y: 0, inside: false });
  });
});

describe('watchPointer', () => {
  it('writes the mouse in normalised coordinates, y up, into the same object', () => {
    vi.stubGlobal('innerWidth', 1000);
    vi.stubGlobal('innerHeight', 500);
    const pointer = createScenePointer();
    stop = watchPointer(pointer);
    window.dispatchEvent(pointerEvent('pointermove', { clientX: 1000, clientY: 0 }));
    expect(pointer).toEqual({ x: 1, y: 1, inside: true });
    window.dispatchEvent(pointerEvent('pointermove', { clientX: 250, clientY: 375 }));
    expect(pointer).toEqual({ x: -0.5, y: -0.5, inside: true });
    window.dispatchEvent(pointerEvent('pointermove', { clientX: 500, clientY: 250 }));
    expect(pointer).toEqual({ x: 0, y: 0, inside: true });
  });

  it('ignores touch and pen, event by event (a laptop with a touch screen keeps its mouse)', () => {
    const pointer = createScenePointer();
    stop = watchPointer(pointer);
    window.dispatchEvent(pointerEvent('pointermove', { pointerType: 'touch', clientX: 10 }));
    window.dispatchEvent(pointerEvent('pointermove', { pointerType: 'pen', clientX: 10 }));
    expect(pointer).toEqual(createScenePointer());
    window.dispatchEvent(pointerEvent('pointermove', { clientX: 0, clientY: 0 }));
    expect(pointer.inside).toBe(true);
    window.dispatchEvent(pointerEvent('pointermove', { pointerType: 'touch', clientX: 900 }));
    expect(pointer.x).toBe(-1);
  });

  it('is outside when the mouse leaves the window, not when it moves between elements', () => {
    const pointer = createScenePointer();
    stop = watchPointer(pointer);
    window.dispatchEvent(pointerEvent('pointermove', { clientX: 0, clientY: 0 }));
    window.dispatchEvent(pointerEvent('pointerout', { relatedTarget: document.body }));
    expect(pointer.inside).toBe(true);
    window.dispatchEvent(pointerEvent('pointerout', { relatedTarget: null }));
    expect(pointer.inside).toBe(false);
  });

  it('a window with no size yet does not give infinities', () => {
    vi.stubGlobal('innerWidth', 0);
    vi.stubGlobal('innerHeight', 0);
    const pointer = createScenePointer();
    stop = watchPointer(pointer);
    window.dispatchEvent(pointerEvent('pointermove', { clientX: 0, clientY: 0 }));
    expect(pointer).toEqual({ x: -1, y: 1, inside: true });
  });

  it('stops listening', () => {
    const pointer = createScenePointer();
    watchPointer(pointer)();
    window.dispatchEvent(pointerEvent('pointermove', { clientX: 0, clientY: 0 }));
    expect(pointer.inside).toBe(false);
  });
});
