import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LEVEL_SETTINGS, type RenderLevel } from '~/lib/device/sceneLevel/sceneLevel';
import { selectSceneLevel, setSceneLevel, useUiStore } from '~/stores/uiStore/uiStore';

import { SCENE_SEED } from '../config/sceneConfig';
import { generateShapes } from '../shapes/generateShapes/generateShapes';
import { loadShapes, type LoadShapesResult } from '../worker/loadShapes/loadShapes';
import { obtainShapes, useSceneShapes } from './useSceneShapes';

vi.mock('../worker/loadShapes/loadShapes', () => ({ loadShapes: vi.fn() }));
vi.mock('../shapes/generateShapes/generateShapes', async (importOriginal) => {
  const original = await importOriginal<typeof import('../shapes/generateShapes/generateShapes')>();
  return { ...original, generateShapes: vi.fn(original.generateShapes) };
});

/** Formas pequeñas para responder deprisa (lo que mira el hook es el `count` que traen). */
const small = (count: number) =>
  generateShapes({ count: Math.min(count, 50), seed: 1, plates: [] });
const workerAnswers = (result: (count: number) => LoadShapesResult): void => {
  vi.mocked(loadShapes).mockImplementation((request) => Promise.resolve(result(request.count)));
};
const workerFails: LoadShapesResult = {
  ok: false,
  reason: 'timeout',
  detail: 'no answer in 3000 ms',
};

let warn: ReturnType<typeof vi.spyOn>;
let error: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  setSceneLevel('high');
});

afterEach(() => {
  vi.mocked(loadShapes).mockReset();
  useUiStore.setState(useUiStore.getInitialState(), true);
});

describe('obtainShapes', () => {
  it('asks the worker for the level count, the project seed and the plates with a project', async () => {
    workerAnswers((count) => ({ ok: true, shapes: { ...small(count), count } }));
    const signal = new AbortController().signal;
    const result = await obtainShapes(36_000, { signal });
    expect(loadShapes).toHaveBeenCalledExactlyOnceWith(
      { count: 36_000, seed: SCENE_SEED, plates: [20, 21, 22] },
      { signal },
    );
    expect(result).toMatchObject({ source: 'worker', shapes: { count: 36_000 } });
    expect(warn).not.toHaveBeenCalled();
  });

  it('a cancelled request is just cancelled: no retry, nothing logged', async () => {
    workerAnswers(() => ({ ok: false, reason: 'aborted', detail: 'cancelled' }));
    const loadGenerator = vi.fn();
    await expect(
      obtainShapes(60_000, { signal: new AbortController().signal, loadGenerator }),
    ).resolves.toBe('aborted');
    expect(loadGenerator).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('cancelled while the generator downloads: nothing is generated', async () => {
    workerAnswers(() => workerFails);
    const controller = new AbortController();
    const generate = vi.fn();
    const result = obtainShapes(60_000, {
      signal: controller.signal,
      loadGenerator: () => {
        controller.abort();
        return Promise.resolve({ generateShapes: generate });
      },
    });
    await expect(result).resolves.toBe('aborted');
    expect(generate).not.toHaveBeenCalled();
  });

  it('the worker fails: warns and generates once on the main thread, at the low count', async () => {
    workerAnswers(() => workerFails);
    const generate = vi.fn((request: { count: number }) => ({
      ...small(10),
      count: request.count,
    }));
    const result = await obtainShapes(60_000, {
      signal: new AbortController().signal,
      loadGenerator: () => Promise.resolve({ generateShapes: generate }),
    });
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      '[scene] The shapes worker failed; generating once on the main thread at the low level',
      'timeout',
      'no answer in 3000 ms',
    );
    expect(generate).toHaveBeenCalledExactlyOnceWith({
      count: LEVEL_SETTINGS.low.particles,
      seed: SCENE_SEED,
      plates: [20, 21, 22],
    });
    expect(result).toMatchObject({
      source: 'main',
      shapes: { count: LEVEL_SETTINGS.low.particles },
    });
  });

  it('cancelled while the generator downloads and its chunk fails: «aborted», nothing logged', async () => {
    workerAnswers(() => workerFails);
    const controller = new AbortController();
    const result = obtainShapes(60_000, {
      signal: controller.signal,
      loadGenerator: () => {
        controller.abort();
        return Promise.reject(new TypeError('Failed to fetch dynamically imported module'));
      },
    });
    await expect(result).resolves.toBe('aborted');
    expect(error).not.toHaveBeenCalled();
  });

  it('the retry fails too (its chunk does not arrive): logged, and «failed»', async () => {
    workerAnswers(() => workerFails);
    const failure = new TypeError('Failed to fetch dynamically imported module');
    await expect(
      obtainShapes(60_000, {
        signal: new AbortController().signal,
        loadGenerator: () => Promise.reject(failure),
      }),
    ).resolves.toBe('failed');
    expect(error).toHaveBeenCalledExactlyOnceWith(
      '[scene] The shapes could not be generated; continuing without WebGL',
      failure,
    );
  });
});

describe('useSceneShapes', () => {
  const level = (): string | null => selectSceneLevel(useUiStore.getState());

  it('nothing until the shapes arrive; then the worker ones, and the level stays', async () => {
    workerAnswers((count) => ({ ok: true, shapes: { ...small(count), count } }));
    const onFail = vi.fn();
    const { result } = renderHook(() => useSceneShapes('high', onFail));
    expect(result.current).toBeNull();
    await waitFor(() => {
      expect(result.current?.source).toBe('worker');
    });
    expect(result.current?.shapes.count).toBe(LEVEL_SETTINGS.high.particles);
    expect(level()).toBe('high');
    expect(onFail).not.toHaveBeenCalled();
  });

  it('the worker fails: shapes from the main thread, the whole scene goes low, and it asks no more', async () => {
    workerAnswers(() => workerFails);
    const { result, rerender } = renderHook(({ current }) => useSceneShapes(current, vi.fn()), {
      initialProps: { current: 'high' as const },
    });
    await waitFor(() => {
      expect(result.current?.source).toBe('main');
    });
    expect(result.current?.shapes.count).toBe(LEVEL_SETTINGS.low.particles);
    expect(level()).toBe('low');
    // `SceneMount` le pasa el nivel nuevo: las formas ya son de Bajo, no se piden otra vez.
    rerender({ current: 'low' as never });
    await act(async () => {
      await Promise.resolve();
    });
    expect(loadShapes).toHaveBeenCalledTimes(1);
  });

  it('no shapes at all: gives up the scene (the no-WebGL mode)', async () => {
    workerAnswers(() => workerFails);
    vi.mocked(generateShapes).mockImplementationOnce(() => {
      throw new Error('[scene] Could not plant 30 trees off the plates');
    });
    const onFail = vi.fn();
    const { result } = renderHook(() => useSceneShapes('medium', onFail));
    await waitFor(() => {
      expect(onFail).toHaveBeenCalledExactlyOnceWith('shapes-failed');
    });
    expect(result.current).toBeNull();
    expect(level()).toBe('high');
  });

  it('unmounted before the answer: the request is cancelled and nothing changes', async () => {
    let answer: (result: LoadShapesResult) => void = () => undefined;
    vi.mocked(loadShapes).mockImplementation(
      (_request, options) =>
        new Promise((resolve) => {
          answer = resolve;
          options?.signal?.addEventListener('abort', () => {
            resolve({ ok: false, reason: 'aborted', detail: 'cancelled' });
          });
        }),
    );
    const onFail = vi.fn();
    const { unmount } = renderHook(() => useSceneShapes('high', onFail));
    const signal = vi.mocked(loadShapes).mock.calls[0]?.[1]?.signal;
    unmount();
    expect(signal?.aborted).toBe(true);
    answer(workerFails);
    await act(async () => {
      await Promise.resolve();
    });
    expect(warn).not.toHaveBeenCalled();
    expect(onFail).not.toHaveBeenCalled();
    expect(level()).toBe('high');
  });

  it('a late failure after unmounting (a worker that ignores the cancel) generates nothing and keeps the level', async () => {
    let answer: (result: LoadShapesResult) => void = () => undefined;
    vi.mocked(loadShapes).mockImplementation(
      () =>
        new Promise((resolve) => {
          answer = resolve;
        }),
    );
    vi.mocked(generateShapes).mockClear();
    const onFail = vi.fn();
    const { result, unmount } = renderHook(() => useSceneShapes('high', onFail));
    unmount();
    answer(workerFails);
    // Lo que tarda en llegar el chunk del reintento (aquí, el módulo simulado).
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(generateShapes).not.toHaveBeenCalled();
    expect(level()).toBe('high');
    expect(onFail).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it('the level asks for another count: a second request with that count, and the new shapes', async () => {
    workerAnswers((count) => ({ ok: true, shapes: { ...small(count), count } }));
    const { result, rerender } = renderHook(({ current }) => useSceneShapes(current, vi.fn()), {
      initialProps: { current: 'high' as RenderLevel },
    });
    await waitFor(() => {
      expect(result.current?.shapes.count).toBe(LEVEL_SETTINGS.high.particles);
    });
    rerender({ current: 'medium' });
    await waitFor(() => {
      expect(result.current?.shapes.count).toBe(LEVEL_SETTINGS.medium.particles);
    });
    expect(vi.mocked(loadShapes).mock.calls.map(([request]) => request.count)).toEqual([
      LEVEL_SETTINGS.high.particles,
      LEVEL_SETTINGS.medium.particles,
    ]);
    expect(result.current?.source).toBe('worker');
  });

  it('the level changes with the request half way: the first one is cancelled, the second one wins', async () => {
    const answers: ((result: LoadShapesResult) => void)[] = [];
    vi.mocked(loadShapes).mockImplementation(
      (_request, options) =>
        new Promise((resolve) => {
          answers.push(resolve);
          options?.signal?.addEventListener('abort', () => {
            resolve({ ok: false, reason: 'aborted', detail: 'cancelled' });
          });
        }),
    );
    const { result, rerender } = renderHook(({ current }) => useSceneShapes(current, vi.fn()), {
      initialProps: { current: 'high' as RenderLevel },
    });
    const first = vi.mocked(loadShapes).mock.calls[0]?.[1]?.signal;
    rerender({ current: 'medium' });
    expect(first?.aborted).toBe(true);
    expect(vi.mocked(loadShapes).mock.calls[1]?.[0].count).toBe(LEVEL_SETTINGS.medium.particles);
    const medium = LEVEL_SETTINGS.medium.particles;
    answers[1]?.({ ok: true, shapes: { ...small(medium), count: medium } });
    await waitFor(() => {
      expect(result.current?.shapes.count).toBe(medium);
    });
    expect(warn).not.toHaveBeenCalled();
  });
});
