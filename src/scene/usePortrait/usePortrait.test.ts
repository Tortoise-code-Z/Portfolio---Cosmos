import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SCENE_SEED } from '../config/sceneConfig';
import { loadPortrait, type WorkerResult } from '../worker/loadShapes/loadShapes';
import { usePortrait } from './usePortrait';

vi.mock('../worker/loadShapes/loadShapes', () => ({ loadPortrait: vi.fn() }));

/** Un retrato con su índice en cada valor, para reconocer el trozo. */
const portraitOf = (count: number): Float32Array =>
  Float32Array.from({ length: count * 4 }, (_, i) => i);
const answers = (result: (count: number) => WorkerResult<Float32Array>): void => {
  vi.mocked(loadPortrait).mockImplementation((request) => Promise.resolve(result(request.count)));
};

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  answers((count) => ({ ok: true, value: portraitOf(count) }));
});

afterEach(() => {
  vi.mocked(loadPortrait).mockReset();
});

describe('usePortrait', () => {
  it('asks for nothing until wanted; then once, for the count of the shapes, with the project seed', async () => {
    const { result } = renderHook(() => usePortrait(50));
    expect(loadPortrait).not.toHaveBeenCalled();
    expect(result.current.portrait).toBeNull();
    act(() => {
      result.current.want();
      result.current.want();
    });
    await waitFor(() => {
      expect(result.current.portrait).toEqual(portraitOf(50));
    });
    expect(loadPortrait).toHaveBeenCalledExactlyOnceWith(
      { count: 50, seed: SCENE_SEED },
      { signal: expect.any(AbortSignal) as unknown },
    );
  });

  it('waits for the shapes: no count, no request', () => {
    const { result } = renderHook(() => usePortrait(null));
    act(() => {
      result.current.want();
    });
    expect(loadPortrait).not.toHaveBeenCalled();
  });

  it('fewer particles (the hot degradation): the start of the one it has, without asking again', async () => {
    const { result, rerender } = renderHook((count: number) => usePortrait(count), {
      initialProps: 50,
    });
    act(() => {
      result.current.want();
    });
    await waitFor(() => {
      expect(result.current.portrait).not.toBeNull();
    });
    rerender(20);
    expect(result.current.portrait).toEqual(portraitOf(50).subarray(0, 20 * 4));
    expect(loadPortrait).toHaveBeenCalledTimes(1);
  });

  it('if it does not arrive: a warning and the Earth (null), with no retry', async () => {
    answers(() => ({ ok: false, reason: 'rejected', detail: 'HTTP 404' }));
    const { result } = renderHook(() => usePortrait(50));
    act(() => {
      result.current.want();
    });
    await waitFor(() => {
      expect(warn).toHaveBeenCalledWith(
        '[scene] The portrait did not arrive; keeping the Earth',
        'rejected',
        'HTTP 404',
      );
    });
    expect(result.current.portrait).toBeNull();
    expect(loadPortrait).toHaveBeenCalledTimes(1);
  });

  it('cancels the request when unmounted, and a cancelled one is not a warning', async () => {
    vi.mocked(loadPortrait).mockImplementation(
      (_request, options) =>
        new Promise((resolve) => {
          options?.signal?.addEventListener('abort', () => {
            resolve({ ok: false, reason: 'aborted', detail: 'cancelled' });
          });
        }),
    );
    const { result, unmount } = renderHook(() => usePortrait(50));
    act(() => {
      result.current.want();
    });
    const signal = vi.mocked(loadPortrait).mock.calls[0]?.[1]?.signal;
    unmount();
    expect(signal?.aborted).toBe(true);
    await Promise.resolve();
    expect(warn).not.toHaveBeenCalled();
  });
});
