import { describe, expect, it, vi } from 'vitest';

import { startFrameLoop } from './frameLoop';

/** `requestAnimationFrame` a mano: el test decide cuándo llega cada frame. */
function fakeFrames() {
  const pending = new Map<number, FrameRequestCallback>();
  let next = 1;
  return {
    request: vi.fn((callback: FrameRequestCallback) => {
      pending.set(next, callback);
      return next++;
    }),
    cancel: vi.fn((handle: number) => {
      pending.delete(handle);
    }),
    /** Llega el frame pendiente con esta hora (ms). */
    tick(timestamp: number): void {
      const entries = [...pending.entries()];
      pending.clear();
      for (const [, callback] of entries) callback(timestamp);
    },
    get pending(): number {
      return pending.size;
    },
  };
}

describe('startFrameLoop', () => {
  it('steps every frame with the seconds since it started', () => {
    const frames = fakeFrames();
    const step = vi.fn<(seconds: number) => void>();
    startFrameLoop({ step, onError: vi.fn(), ...frames });
    frames.tick(1000);
    frames.tick(1016);
    frames.tick(1516);
    expect(step.mock.calls.map(([seconds]) => seconds)).toEqual([0, 0.016, 0.516]);
    expect(frames.pending).toBe(1);
  });

  it('the first error stops the loop and is reported once', () => {
    const frames = fakeFrames();
    const failure = new Error('uniform is not a function');
    const step = vi.fn(() => {
      throw failure;
    });
    const onError = vi.fn();
    startFrameLoop({ step, onError, ...frames });
    frames.tick(0);
    expect(onError).toHaveBeenCalledExactlyOnceWith(failure);
    expect(frames.pending).toBe(0);
    frames.tick(16);
    expect(step).toHaveBeenCalledTimes(1);
  });

  it('stop cancels the pending frame, and a stop during a frame asks for no other', () => {
    const frames = fakeFrames();
    const stop = startFrameLoop({ step: vi.fn(), onError: vi.fn(), ...frames });
    stop();
    expect(frames.cancel).toHaveBeenCalledTimes(1);
    expect(frames.pending).toBe(0);

    const later = fakeFrames();
    let stopLater = (): void => undefined;
    stopLater = startFrameLoop({
      step: () => {
        stopLater();
      },
      onError: vi.fn(),
      ...later,
    });
    later.tick(0);
    expect(later.pending).toBe(0);
  });

  it('uses requestAnimationFrame by default', () => {
    const request = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(7);
    const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    const stop = startFrameLoop({ step: vi.fn(), onError: vi.fn() });
    expect(request).toHaveBeenCalledTimes(1);
    stop();
    expect(cancel).toHaveBeenCalledExactlyOnceWith(7);
  });
});
