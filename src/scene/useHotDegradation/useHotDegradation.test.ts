import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NARROW_VIEWPORT_PX, type RenderLevel } from '~/lib/device/sceneLevel/sceneLevel';

import type { LowerResult } from '../useSceneShapes/useSceneShapes';
import { type HotDegradation, useHotDegradation } from './useHotDegradation';

/** Frames a `fps` constantes desde `from` durante `seconds` segundos. Devuelve dónde acabó. */
function feed(
  degradation: HotDegradation,
  { from, seconds, fps }: { from: number; seconds: number; fps: number },
): number {
  const frames = Math.round(seconds * fps);
  for (let i = 0; i <= frames; i += 1) degradation.sample(from + i / fps);
  return from + frames / fps;
}

/** Una bajada que contesta cuando el test quiera. */
function manualLowerTo() {
  const answers: ((result: LowerResult) => void)[] = [];
  const lowerTo = vi.fn<HotDegradationLowerTo>(
    () =>
      new Promise<LowerResult>((resolve) => {
        answers.push(resolve);
      }),
  );
  return { lowerTo, answers };
}

const flush = async (): Promise<void> => {
  await act(async () => {
    await Promise.resolve();
  });
};

function render(initial: { level: RenderLevel; active: boolean }, lowerTo: HotDegradationLowerTo) {
  return renderHook(
    ({ level, active }: { level: RenderLevel; active: boolean }) =>
      useHotDegradation({ level, active, lowerTo }),
    { initialProps: initial },
  );
}
type HotDegradationLowerTo = (level: RenderLevel) => Promise<LowerResult>;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useHotDegradation', () => {
  it('slow on the desktop: one level down after the warm-up and 3 slow windows, again from scratch at the new level, never below low', async () => {
    const { lowerTo, answers } = manualLowerTo();
    const { result, rerender } = render({ level: 'high', active: true }, lowerTo);
    let at = feed(result.current, { from: 0, seconds: 7.9, fps: 30 });
    expect(lowerTo).not.toHaveBeenCalled();
    at = feed(result.current, { from: at + 1 / 30, seconds: 0.2, fps: 30 });
    expect(lowerTo).toHaveBeenCalledExactlyOnceWith('medium');
    // Mientras llegan las formas, no se mide.
    at = feed(result.current, { from: at + 1 / 30, seconds: 20, fps: 10 });
    expect(lowerTo).toHaveBeenCalledTimes(1);
    answers[0]?.('lowered');
    await flush();
    rerender({ level: 'medium', active: true });
    // El nivel nuevo empieza de cero, con su calentamiento: 8 s lentos más.
    at = feed(result.current, { from: at + 1 / 30, seconds: 7.9, fps: 30 });
    expect(lowerTo).toHaveBeenCalledTimes(1);
    at = feed(result.current, { from: at + 1 / 30, seconds: 0.2, fps: 30 });
    expect(lowerTo).toHaveBeenLastCalledWith('low');
    answers[1]?.('lowered');
    await flush();
    rerender({ level: 'low', active: true });
    feed(result.current, { from: at + 1 / 30, seconds: 60, fps: 5 });
    expect(lowerTo).toHaveBeenCalledTimes(2);
  });

  it('fast enough: never asks', () => {
    const { lowerTo } = manualLowerTo();
    const { result } = render({ level: 'high', active: true }, lowerTo);
    feed(result.current, { from: 0, seconds: 60, fps: 50 });
    expect(lowerTo).not.toHaveBeenCalled();
  });

  it('without particles painted it does not measure; it starts when they are', () => {
    const { lowerTo } = manualLowerTo();
    const { result, rerender } = render({ level: 'high', active: false }, lowerTo);
    const at = feed(result.current, { from: 0, seconds: 30, fps: 10 });
    expect(lowerTo).not.toHaveBeenCalled();
    rerender({ level: 'high', active: true });
    feed(result.current, { from: at + 0.1, seconds: 8.2, fps: 10 });
    expect(lowerTo).toHaveBeenCalledExactlyOnceWith('medium');
  });

  it('the shapes of the lower level do not arrive («kept»): it stops measuring for the rest of the visit', async () => {
    const { lowerTo, answers } = manualLowerTo();
    const { result, rerender } = render({ level: 'high', active: true }, lowerTo);
    let at = feed(result.current, { from: 0, seconds: 8.2, fps: 20 });
    expect(lowerTo).toHaveBeenCalledTimes(1);
    answers[0]?.('kept');
    await flush();
    at = feed(result.current, { from: at + 0.05, seconds: 60, fps: 20 });
    // Ni aunque cambie otra cosa que vuelva a crear el medidor.
    rerender({ level: 'high', active: false });
    rerender({ level: 'high', active: true });
    feed(result.current, { from: at + 0.05, seconds: 60, fps: 20 });
    expect(lowerTo).toHaveBeenCalledTimes(1);
  });

  it('on a phone (coarse pointer or narrow), the line is 26 fps', () => {
    vi.stubGlobal('innerWidth', NARROW_VIEWPORT_PX - 1);
    const { lowerTo } = manualLowerTo();
    const { result, rerender } = render({ level: 'medium', active: true }, lowerTo);
    feed(result.current, { from: 0, seconds: 30, fps: 30 });
    expect(lowerTo).not.toHaveBeenCalled();
    // Otro medidor (otra vez activo), a 20 fps: sí.
    rerender({ level: 'medium', active: false });
    rerender({ level: 'medium', active: true });
    feed(result.current, { from: 100, seconds: 8.2, fps: 20 });
    expect(lowerTo).toHaveBeenCalledExactlyOnceWith('low');
  });

  it('a coarse pointer is a phone too, however wide', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(pointer: coarse)' }));
    const { lowerTo } = manualLowerTo();
    const { result } = render({ level: 'medium', active: true }, lowerTo);
    feed(result.current, { from: 0, seconds: 30, fps: 30 });
    expect(lowerTo).not.toHaveBeenCalled();
  });

  it('a pause throws away the window in progress: the gap is not a slow frame', () => {
    const { lowerTo } = manualLowerTo();
    const { result } = render({ level: 'high', active: true }, lowerTo);
    // Calentamiento y dos ventanas lentas ya cerradas: con el hueco como tercera, bajaría.
    const at = feed(result.current, { from: 0, seconds: 6.5, fps: 30 });
    result.current.discardWindow();
    feed(result.current, { from: at + 120, seconds: 30, fps: 60 });
    expect(lowerTo).not.toHaveBeenCalled();
  });

  it('is the same object on every render (the frame loop keeps it)', () => {
    const { lowerTo } = manualLowerTo();
    const { result, rerender } = render({ level: 'high', active: true }, lowerTo);
    const first = result.current;
    rerender({ level: 'medium', active: true });
    expect(result.current).toBe(first);
  });
});
