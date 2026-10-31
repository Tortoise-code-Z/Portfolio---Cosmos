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

  it('measures over the canvas: without the classic scrollbar, not over the whole window', () => {
    vi.stubGlobal('innerWidth', 1015);
    vi.stubGlobal('innerHeight', 500);
    const root = document.documentElement;
    vi.spyOn(root, 'clientWidth', 'get').mockReturnValue(1000);
    vi.spyOn(root, 'clientHeight', 'get').mockReturnValue(500);
    const pointer = createScenePointer();
    stop = watchPointer(pointer);
    window.dispatchEvent(pointerEvent('pointermove', { clientX: 500, clientY: 250 }));
    expect(pointer).toEqual({ x: 0, y: 0, inside: true });
    window.dispatchEvent(pointerEvent('pointermove', { clientX: 1000, clientY: 500 }));
    expect(pointer).toEqual({ x: 1, y: -1, inside: true });
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

  it('a finger or a pen that lifts (pointerout with no target) does not take the mouse out', () => {
    const pointer = createScenePointer();
    stop = watchPointer(pointer);
    window.dispatchEvent(pointerEvent('pointermove', { clientX: 0, clientY: 0 }));
    window.dispatchEvent(pointerEvent('pointerout', { pointerType: 'touch', relatedTarget: null }));
    window.dispatchEvent(pointerEvent('pointerout', { pointerType: 'pen', relatedTarget: null }));
    expect(pointer.inside).toBe(true);
  });

  it('a window with no size yet does not give infinities', () => {
    vi.stubGlobal('innerWidth', 0);
    vi.stubGlobal('innerHeight', 0);
    const pointer = createScenePointer();
    stop = watchPointer(pointer);
    window.dispatchEvent(pointerEvent('pointermove', { clientX: 0, clientY: 0 }));
    expect(pointer).toEqual({ x: -1, y: 1, inside: true });
  });

  it('stops listening, to moves and to the mouse leaving', () => {
    const pointer = createScenePointer();
    const stopNow = watchPointer(pointer);
    window.dispatchEvent(pointerEvent('pointermove', { clientX: 0, clientY: 0 }));
    stopNow();
    window.dispatchEvent(pointerEvent('pointermove', { clientX: 500, clientY: 500 }));
    window.dispatchEvent(pointerEvent('pointerout', { relatedTarget: null }));
    expect(pointer).toEqual({ x: -1, y: 1, inside: true });
  });
});
