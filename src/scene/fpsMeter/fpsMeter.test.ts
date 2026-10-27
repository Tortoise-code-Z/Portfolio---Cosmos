import { describe, expect, it } from 'vitest';

import { HOT_DEGRADATION } from '../config/sceneConfig';
import { createFpsMeter, type FpsMeter } from './fpsMeter';

const OPTIONS = { minFps: 45, windowS: 2, slowWindows: 3, warmupS: 2 } as const;

/**
 * Frames a `fps` constantes desde `from` durante `seconds` segundos (el último cae justo en `from + seconds`).
 * Devuelve en qué segundos contestó `true` y dónde acabó.
 */
function run(
  meter: FpsMeter,
  { from, seconds, fps }: { from: number; seconds: number; fps: number },
): { lowered: number[]; end: number } {
  const lowered: number[] = [];
  const frames = Math.round(seconds * fps);
  for (let i = 0; i <= frames; i += 1) {
    const at = from + i / fps;
    if (meter.sample(at)) lowered.push(at);
  }
  return { lowered, end: from + frames / fps };
}

describe('createFpsMeter', () => {
  it('uses the numbers in rendimiento.md (2 s windows, 3 in a row, 45 desktop / 26 mobile)', () => {
    expect(HOT_DEGRADATION).toEqual({
      windowS: 2,
      slowWindows: 3,
      warmupS: 2,
      minFps: { desktop: 45, handheld: 26 },
    });
  });

  it('a fast scene never asks to go down', () => {
    const meter = createFpsMeter(OPTIONS);
    expect(run(meter, { from: 10, seconds: 60, fps: 60 }).lowered).toEqual([]);
  });

  it('asks once after three slow windows in a row, after the warm-up, and then starts again', () => {
    const meter = createFpsMeter(OPTIONS);
    // 2 s de calentamiento + 3 ventanas de 2 s: a los 8 s del primer frame. Después, otra vez a los 14.
    const { lowered } = run(meter, { from: 5, seconds: 16, fps: 30 });
    expect(lowered).toHaveLength(2);
    expect(lowered[0]).toBeCloseTo(13);
    expect(lowered[1]).toBeCloseTo(19);
  });

  it('the warm-up does not count, however slow (the shader compiles on the first frame)', () => {
    const meter = createFpsMeter(OPTIONS);
    // El segundo frame llega 1,9 s después del primero: dentro del calentamiento, no cuenta.
    expect(meter.sample(0)).toBe(false);
    expect(meter.sample(1.9)).toBe(false);
    expect(run(meter, { from: 1.9 + 1 / 60, seconds: 20, fps: 60 }).lowered).toEqual([]);
  });

  it('a fast window breaks the run: it needs three slow ones in a row again', () => {
    const meter = createFpsMeter(OPTIONS);
    let { end } = run(meter, { from: 0, seconds: 6, fps: 30 }); // calentamiento + 2 ventanas lentas
    ({ end } = run(meter, { from: end + 1 / 60, seconds: 2, fps: 60 })); // una rápida
    const slowAgain = run(meter, { from: end + 1 / 30, seconds: 4, fps: 30 }); // 2 lentas
    expect(slowAgain.lowered).toEqual([]);
    expect(
      run(meter, { from: slowAgain.end + 1 / 30, seconds: 2.1, fps: 30 }).lowered,
    ).toHaveLength(1);
  });

  it('the threshold itself is not slow (at minFps, it stays)', () => {
    // 32 fps: 1/32 s es exacto en coma flotante, así que cada ventana mide 32 justos.
    const meter = createFpsMeter({ ...OPTIONS, minFps: 32 });
    expect(run(meter, { from: 0, seconds: 30, fps: 32 }).lowered).toEqual([]);
    expect(
      run(createFpsMeter({ ...OPTIONS, minFps: 33 }), { from: 0, seconds: 30, fps: 32 }).lowered,
    ).not.toEqual([]);
  });

  it('a pause throws away the window in progress (its gap is not a slow frame), not the slow windows before', () => {
    const meter = createFpsMeter(OPTIONS);
    const { end } = run(meter, { from: 0, seconds: 7, fps: 30 }); // 2 ventanas lentas y media
    meter.discardWindow();
    // Vuelve 30 s después a 60 fps: la vuelta no es una ventana lenta.
    expect(run(meter, { from: end + 30, seconds: 10, fps: 60 }).lowered).toEqual([]);
  });

  it('after a pause, the slow windows already measured still count', () => {
    const meter = createFpsMeter(OPTIONS);
    const { end } = run(meter, { from: 0, seconds: 6.5, fps: 30 }); // 2 ventanas lentas cerradas
    meter.discardWindow();
    // La primera ventana tras la pausa, lenta: la tercera seguida.
    const after = run(meter, { from: end + 30, seconds: 2.1, fps: 30 });
    expect(after.lowered).toHaveLength(1);
  });
});
