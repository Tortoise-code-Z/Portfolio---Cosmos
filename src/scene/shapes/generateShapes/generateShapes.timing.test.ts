// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { SCENE_SEED } from '../../config/sceneConfig';
import { MAX_SHAPE_COUNT } from '../shapeContract/shapeContract';
import { generateShapes } from './generateShapes';

/**
 * Tiempo de generación del nivel Alto (docs/04-escena/formas.md → test 6): por encima de 150 ms
 * avisa, y solo falla por encima de 1 s (red de seguridad: el worker tiene 3 s). En Node, sin jsdom: es lo
 * más parecido al worker. Medido en F3.2: ~0,4 s en el contenedor de Claude, casi todo la nube de la
 * nebulosa (muestreo con rechazo con ruido de tres octavas).
 */
const WARN_MS = 150;
const FAIL_MS = 1000;

describe('generateShapes timing', () => {
  it(`generates ${String(MAX_SHAPE_COUNT)} particles in under ${String(FAIL_MS)} ms (warns over ${String(WARN_MS)} ms)`, () => {
    // Una vuelta antes, para medir el código ya optimizado por el motor y no su arranque.
    generateShapes({ count: 1000, seed: SCENE_SEED, plates: [20] });
    const start = performance.now();
    generateShapes({ count: MAX_SHAPE_COUNT, seed: SCENE_SEED, plates: [20, 21, 22] });
    const elapsed = performance.now() - start;
    if (elapsed > WARN_MS) {
      console.warn(
        `[scene] generateShapes(${String(MAX_SHAPE_COUNT)}) took ${elapsed.toFixed(0)} ms (target ${String(WARN_MS)} ms)`,
      );
    }
    expect(elapsed).toBeLessThan(FAIL_MS);
  });
});
