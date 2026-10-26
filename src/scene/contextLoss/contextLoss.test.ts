import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CONTEXT_RESTORE_TIMEOUT_MS, watchContextLoss } from './contextLoss';

let canvas: HTMLCanvasElement;
let visibility: DocumentVisibilityState = 'visible';
const onGiveUp = vi.fn();
const onRestored = vi.fn();

const lose = (): boolean => canvas.dispatchEvent(new Event('webglcontextlost'));
const restore = (): boolean => canvas.dispatchEvent(new Event('webglcontextrestored'));

/** Simula que la página se oculta (otra app, otra pestaña) o vuelve a la vista. */
function setVisibility(state: DocumentVisibilityState): void {
  visibility = state;
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  vi.useFakeTimers();
  visibility = 'visible';
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
  canvas = document.createElement('canvas');
});

afterEach(() => {
  vi.useRealTimers();
  onGiveUp.mockReset();
  onRestored.mockReset();
});

describe('watchContextLoss', () => {
  it('waits for the context to come back: restored in time, it says so and nothing else happens', () => {
    watchContextLoss(canvas, { onGiveUp, onRestored });
    lose();
    vi.advanceTimersByTime(CONTEXT_RESTORE_TIMEOUT_MS - 1);
    restore();
    vi.advanceTimersByTime(CONTEXT_RESTORE_TIMEOUT_MS);
    expect(onGiveUp).not.toHaveBeenCalled();
    expect(onRestored).toHaveBeenCalledTimes(1);
  });

  it('gives up when the context does not come back in time', () => {
    watchContextLoss(canvas, { onGiveUp });
    lose();
    vi.advanceTimersByTime(CONTEXT_RESTORE_TIMEOUT_MS);
    expect(onGiveUp).toHaveBeenCalledExactlyOnceWith('context-not-restored');
  });

  it('honours a custom timeout', () => {
    watchContextLoss(canvas, { onGiveUp, timeoutMs: 100 });
    lose();
    vi.advanceTimersByTime(100);
    expect(onGiveUp).toHaveBeenCalledExactlyOnceWith('context-not-restored');
  });

  it('only one attempt: a second loss gives up at once, and only once', () => {
    watchContextLoss(canvas, { onGiveUp, onRestored });
    lose();
    restore();
    lose();
    expect(onGiveUp).toHaveBeenCalledExactlyOnceWith('context-lost-twice');
    lose();
    vi.advanceTimersByTime(CONTEXT_RESTORE_TIMEOUT_MS);
    restore();
    expect(onGiveUp).toHaveBeenCalledTimes(1);
    // Ya rendida, un contexto que vuelve tarde no resucita la escena.
    expect(onRestored).toHaveBeenCalledTimes(1);
  });

  it('stops watching (its timer and the page visibility) when cleaned up', () => {
    const stop = watchContextLoss(canvas, { onGiveUp });
    lose();
    stop();
    vi.advanceTimersByTime(CONTEXT_RESTORE_TIMEOUT_MS);
    setVisibility('hidden');
    setVisibility('visible');
    vi.advanceTimersByTime(CONTEXT_RESTORE_TIMEOUT_MS);
    lose();
    lose();
    expect(onGiveUp).not.toHaveBeenCalled();
  });

  describe('with the page hidden (a phone switching apps frees the GPU)', () => {
    it('the clock does not run while hidden: it starts, in full, when the page is seen again', () => {
      watchContextLoss(canvas, { onGiveUp });
      setVisibility('hidden');
      lose();
      vi.advanceTimersByTime(CONTEXT_RESTORE_TIMEOUT_MS * 10);
      expect(onGiveUp).not.toHaveBeenCalled();
      setVisibility('visible');
      vi.advanceTimersByTime(CONTEXT_RESTORE_TIMEOUT_MS - 1);
      expect(onGiveUp).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(onGiveUp).toHaveBeenCalledExactlyOnceWith('context-not-restored');
    });

    it('restored after coming back, nothing happens', () => {
      watchContextLoss(canvas, { onGiveUp, onRestored });
      setVisibility('hidden');
      lose();
      setVisibility('visible');
      vi.advanceTimersByTime(CONTEXT_RESTORE_TIMEOUT_MS - 1);
      restore();
      vi.advanceTimersByTime(CONTEXT_RESTORE_TIMEOUT_MS);
      expect(onGiveUp).not.toHaveBeenCalled();
      expect(onRestored).toHaveBeenCalledTimes(1);
    });

    it('a loss while hidden does not spend the attempt, however many times it happens', () => {
      watchContextLoss(canvas, { onGiveUp });
      for (let i = 0; i < 3; i++) {
        setVisibility('hidden');
        lose();
        setVisibility('visible');
        restore();
      }
      // La primera pérdida a la vista aún tiene su intento…
      lose();
      expect(onGiveUp).not.toHaveBeenCalled();
      restore();
      // …y la segunda lo agota.
      lose();
      expect(onGiveUp).toHaveBeenCalledExactlyOnceWith('context-lost-twice');
    });

    it('hiding the page stops a clock that was already running', () => {
      watchContextLoss(canvas, { onGiveUp });
      lose();
      vi.advanceTimersByTime(CONTEXT_RESTORE_TIMEOUT_MS - 1);
      setVisibility('hidden');
      vi.advanceTimersByTime(CONTEXT_RESTORE_TIMEOUT_MS * 10);
      expect(onGiveUp).not.toHaveBeenCalled();
      setVisibility('visible');
      vi.advanceTimersByTime(CONTEXT_RESTORE_TIMEOUT_MS);
      expect(onGiveUp).toHaveBeenCalledExactlyOnceWith('context-not-restored');
    });

    it('visibility changes without a lost context do nothing', () => {
      watchContextLoss(canvas, { onGiveUp });
      setVisibility('hidden');
      setVisibility('visible');
      vi.advanceTimersByTime(CONTEXT_RESTORE_TIMEOUT_MS * 2);
      lose();
      restore();
      setVisibility('hidden');
      setVisibility('visible');
      vi.advanceTimersByTime(CONTEXT_RESTORE_TIMEOUT_MS * 2);
      expect(onGiveUp).not.toHaveBeenCalled();
    });
  });
});
