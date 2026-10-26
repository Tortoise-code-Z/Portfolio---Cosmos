import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CONTEXT_RESTORE_TIMEOUT_MS, watchContextLoss } from './contextLoss';

let canvas: HTMLCanvasElement;
const onGiveUp = vi.fn();

const lose = (): boolean => canvas.dispatchEvent(new Event('webglcontextlost'));
const restore = (): boolean => canvas.dispatchEvent(new Event('webglcontextrestored'));

beforeEach(() => {
  vi.useFakeTimers();
  canvas = document.createElement('canvas');
});

afterEach(() => {
  vi.useRealTimers();
  onGiveUp.mockReset();
});

describe('watchContextLoss', () => {
  it('waits for the context to come back: restored in time, nothing happens', () => {
    watchContextLoss(canvas, onGiveUp);
    lose();
    vi.advanceTimersByTime(CONTEXT_RESTORE_TIMEOUT_MS - 1);
    restore();
    vi.advanceTimersByTime(CONTEXT_RESTORE_TIMEOUT_MS);
    expect(onGiveUp).not.toHaveBeenCalled();
  });

  it('gives up when the context does not come back in time', () => {
    watchContextLoss(canvas, onGiveUp);
    lose();
    vi.advanceTimersByTime(CONTEXT_RESTORE_TIMEOUT_MS);
    expect(onGiveUp).toHaveBeenCalledExactlyOnceWith('context-not-restored');
  });

  it('only one attempt: a second loss gives up at once, and only once', () => {
    watchContextLoss(canvas, onGiveUp);
    lose();
    restore();
    lose();
    expect(onGiveUp).toHaveBeenCalledExactlyOnceWith('context-lost-twice');
    lose();
    vi.advanceTimersByTime(CONTEXT_RESTORE_TIMEOUT_MS);
    expect(onGiveUp).toHaveBeenCalledTimes(1);
  });

  it('stops watching (and its timer) when cleaned up', () => {
    const stop = watchContextLoss(canvas, onGiveUp);
    lose();
    stop();
    vi.advanceTimersByTime(CONTEXT_RESTORE_TIMEOUT_MS);
    lose();
    lose();
    expect(onGiveUp).not.toHaveBeenCalled();
  });
});
