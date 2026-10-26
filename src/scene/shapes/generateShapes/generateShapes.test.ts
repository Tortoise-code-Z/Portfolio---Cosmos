import { describe, expect, it } from 'vitest';

import { PLATE_SLOTS } from '../../config/plateSlots/plateSlots';
import { SCENE_SEED } from '../../config/sceneConfig';
import {
  MAX_SHAPE_COUNT,
  POSITION_KEYS,
  type ShapeRequest,
  type ShapeSet,
} from '../shapeContract/shapeContract';
import { TURTLE_TAG } from '../turtle/turtle';
import { generateShapes } from './generateShapes';

const ALL_PLATES = PLATE_SLOTS.map(({ label }) => label);
/**
 * 1.000 partículas: las partes de la tortuga van por índice y con menos no cae ninguna en los ojos (0,4 %) ni en
 * la cola (1 %), así que la huella no las vería (formas.md → «Contrato y tests»).
 */
const FINGERPRINT_COUNT = 1000;
const request = (overrides: Partial<ShapeRequest> = {}): ShapeRequest => ({
  count: FINGERPRINT_COUNT,
  seed: SCENE_SEED,
  plates: [20, 21, 22],
  ...overrides,
});

/** Huella FNV-1a de los bytes de una matriz: cambia si cambia un solo bit. */
function fingerprint(array: Float32Array): string {
  const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
  let hash = 0x811c9dc5;
  for (const byte of bytes) hash = Math.imul(hash ^ byte, 0x01000193) >>> 0;
  return hash.toString(16).padStart(8, '0');
}

const fingerprints = (shapes: ShapeSet): Record<string, string> => ({
  nebula: fingerprint(shapes.nebula),
  galaxy: fingerprint(shapes.galaxy),
  turtle: fingerprint(shapes.turtle),
  earth: fingerprint(shapes.earth),
  rand: fingerprint(shapes.rand),
});

/** Una componente de `aR` (0 = x, 1 = y…) de todas las partículas. */
const component = (rand: Float32Array, k: number): number[] =>
  Array.from({ length: rand.length / 4 }, (_, i) => rand[i * 4 + k] ?? Number.NaN);

describe('generateShapes', () => {
  for (const count of [1, 2, 3, 4, 30]) {
    it(`${String(count)} particles: the right lengths and every value finite`, () => {
      const shapes = generateShapes(request({ count, plates: ALL_PLATES }));
      expect(shapes.count).toBe(count);
      for (const key of POSITION_KEYS) {
        expect(shapes[key]).toHaveLength(count * 3);
        expect(shapes[key].every(Number.isFinite)).toBe(true);
      }
      expect(shapes.rand).toHaveLength(count * 4);
      expect(shapes.rand.every(Number.isFinite)).toBe(true);
    });
  }

  it('aR.x and aR.w are random in [0, 1); aR.y and aR.z are the turtle and Earth tags', () => {
    const { rand } = generateShapes(request({ count: 2000 }));
    for (const k of [0, 3]) {
      const values = component(rand, k);
      expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...values)).toBeLessThan(1);
    }
    expect(new Set(component(rand, 1)).size).toBeGreaterThan(5);
    expect([...new Set(component(rand, 2))].sort()).toEqual([0, 1, 2, 3]);
  });

  it('the same request gives the same bytes; plates in another order too (they are a set)', () => {
    const first = fingerprints(generateShapes(request({ plates: [20, 21, 22] })));
    expect(fingerprints(generateShapes(request({ plates: [20, 21, 22] })))).toEqual(first);
    expect(fingerprints(generateShapes(request({ plates: [22, 20, 21] })))).toEqual(first);
  });

  it('a fixed fingerprint per array: a change to the look has to be on purpose (ADR-011)', () => {
    const shapes = generateShapes(request());
    // Todas las partes de la tortuga entran en la huella, también las más pequeñas.
    const turtleTags = new Set(component(shapes.rand, 1));
    expect(turtleTags.has(TURTLE_TAG.eyes)).toBe(true);
    expect(turtleTags.has(TURTLE_TAG.tail)).toBe(true);
    expect(fingerprints(shapes)).toEqual({
      nebula: '93a983a6',
      galaxy: 'a187e024',
      turtle: 'b964510a',
      earth: 'afbcfb21',
      rand: '0e05c4c9',
    });
  });

  it('every part has its own stream: other plates only move the turtle and its tags', () => {
    const a = generateShapes(request({ count: 2000, plates: [20] }));
    const b = generateShapes(request({ count: 2000, plates: ALL_PLATES }));
    expect(fingerprint(b.nebula)).toBe(fingerprint(a.nebula));
    expect(fingerprint(b.galaxy)).toBe(fingerprint(a.galaxy));
    expect(fingerprint(b.earth)).toBe(fingerprint(a.earth));
    expect(fingerprint(b.turtle)).not.toBe(fingerprint(a.turtle));
    for (const k of [0, 2, 3]) expect(component(b.rand, k)).toEqual(component(a.rand, k));
    expect(component(b.rand, 1)).not.toEqual(component(a.rand, 1));
  });

  it('another seed gives another universe', () => {
    const a = fingerprints(generateShapes(request({ seed: 1 })));
    const b = fingerprints(generateShapes(request({ seed: 2 })));
    for (const key of Object.keys(a)) expect(b[key]).not.toBe(a[key]);
  });

  it('works at the top of the range (the high level)', () => {
    const shapes = generateShapes(request({ count: MAX_SHAPE_COUNT, plates: ALL_PLATES }));
    expect(shapes.turtle).toHaveLength(MAX_SHAPE_COUNT * 3);
    expect(shapes.nebula.every(Number.isFinite)).toBe(true);
  });

  it('an invalid request throws a RangeError that says why (cases in shapeContract.test.ts)', () => {
    expect(() => generateShapes(request({ count: 0 }))).toThrow(RangeError);
    expect(() => generateShapes(request({ plates: [20, 20] }))).toThrow(/plates must not repeat/);
  });
});
