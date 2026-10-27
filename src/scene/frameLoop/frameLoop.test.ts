import { describe, expect, it, vi } from 'vitest';

import { startFrameLoop, type FrameLoop } from './frameLoop';

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
  it('a frame that slips through after stopping does nothing; stopping twice cancels once', () => {
    let pending: FrameRequestCallback | null = null;
    const step = vi.fn();
    // Un `cancel` que no cancela nada: el frame ya pedido llega igual.
    const cancel = vi.fn();
    const { stop } = startFrameLoop({
      step,
      onError: vi.fn(),
      request: (callback) => {
        pending = callback;
        return 1;
      },
      cancel,
    });
    stop();
    stop();
    expect(cancel).toHaveBeenCalledTimes(1);
    (pending as FrameRequestCallback | null)?.(0);
    expect(step).not.toHaveBeenCalled();
  });

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
    const { stop } = startFrameLoop({ step: vi.fn(), onError: vi.fn(), ...frames });
    stop();
    expect(frames.cancel).toHaveBeenCalledTimes(1);
    expect(frames.pending).toBe(0);

    const later = fakeFrames();
    let loop: FrameLoop | null = null;
    loop = startFrameLoop({
      step: () => {
        loop?.stop();
      },
      onError: vi.fn(),
      ...later,
    });
    later.tick(0);
    expect(later.pending).toBe(0);
  });

  it('paused, it asks for no frame (the pending one is cancelled); going on asks for one, once', () => {
    const frames = fakeFrames();
    const step = vi.fn<(seconds: number) => void>();
    const { setPaused } = startFrameLoop({ step, onError: vi.fn(), ...frames });
    frames.tick(1000);
    setPaused(true);
    expect(frames.cancel).toHaveBeenCalledTimes(1);
    expect(frames.pending).toBe(0);
    setPaused(true);
    expect(frames.cancel).toHaveBeenCalledTimes(1);
    setPaused(false);
    setPaused(false);
    expect(frames.request).toHaveBeenCalledTimes(3);
    expect(frames.pending).toBe(1);
    // Los segundos siguen contando desde el arranque (el reloj de la escena limita el salto).
    frames.tick(3000);
    expect(step.mock.calls.map(([seconds]) => seconds)).toEqual([0, 2]);
  });

  it('a frame that slips through while paused does nothing; after stop, pausing does nothing', () => {
    let pending: FrameRequestCallback | null = null;
    const step = vi.fn();
    const request = vi.fn((callback: FrameRequestCallback) => {
      pending = callback;
      return 1;
    });
    const loop = startFrameLoop({ step, onError: vi.fn(), request, cancel: vi.fn() });
    loop.setPaused(true);
    (pending as FrameRequestCallback | null)?.(0);
    expect(step).not.toHaveBeenCalled();
    loop.stop();
    loop.setPaused(false);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('uses requestAnimationFrame by default', () => {
    const request = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(7);
    const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    const { stop } = startFrameLoop({ step: vi.fn(), onError: vi.fn() });
    expect(request).toHaveBeenCalledTimes(1);
    stop();
    expect(cancel).toHaveBeenCalledExactlyOnceWith(7);
  });
});
