import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { PLATE_SLOTS } from '../../config/plateSlots/plateSlots';
import {
  MAX_SHAPE_COUNT,
  PORTRAIT_FRAME,
  type ShapeRequest,
  shapeRequestProblem,
} from './shapeContract';

const request = (overrides: Partial<ShapeRequest> = {}): ShapeRequest => ({
  count: 30,
  seed: 1,
  plates: [20, 21, 22],
  ...overrides,
});

describe('shapeRequestProblem', () => {
  it.each<[string, Partial<ShapeRequest>, RegExp]>([
    ['count 0', { count: 0 }, /count/],
    ['count over the high level', { count: MAX_SHAPE_COUNT + 1 }, /count/],
    ['count not an integer', { count: 10.5 }, /count/],
    ['count NaN', { count: Number.NaN }, /count/],
    ['seed negative', { seed: -1 }, /seed/],
    ['seed over 32 bits', { seed: 2 ** 32 }, /seed/],
    ['seed not an integer', { seed: 1.5 }, /seed/],
    ['a plate label out of 20..26', { plates: [19] }, /plates/],
    ['a plate label not an integer', { plates: [20.5] }, /plates/],
    ['a repeated plate', { plates: [20, 20] }, /repeat/],
  ])('rejects %s, and says why', (_name, overrides, message) => {
    expect(shapeRequestProblem(request(overrides))).toMatch(message);
  });

  it('accepts the edges of the range: no plates or all seven, count 1 and the high level, seed 0 and 2³² − 1', () => {
    expect(shapeRequestProblem(request({ plates: [] }))).toBeNull();
    expect(
      shapeRequestProblem(
        request({ plates: PLATE_SLOTS.map(({ label }) => label), count: 1, seed: 0 }),
      ),
    ).toBeNull();
    expect(shapeRequestProblem(request({ count: MAX_SHAPE_COUNT, seed: 2 ** 32 - 1 }))).toBeNull();
  });
});

/** Las imágenes del retrato, tal cual están en el repo (las escribe `scripts/portrait/pack.py`). */
const PORTRAIT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../../assets/portrait');
const portraitAsset = (name: string): Buffer => readFileSync(join(PORTRAIT_DIR, name));

/** Los bloques de un PNG: su tipo y, de la cabecera, el tamaño. */
function pngChunks(bytes: Buffer): string[] {
  const chunks: string[] = [];
  for (let i = 8; i < bytes.length; i += 12 + bytes.readUInt32BE(i)) {
    chunks.push(bytes.toString('latin1', i + 4, i + 8));
  }
  return chunks;
}

/** Los segmentos de un JPEG hasta los datos de la imagen (SOS): su marcador, y el tamaño del SOF0. */
function jpegSegments(bytes: Buffer): { markers: number[]; width: number; height: number } {
  const result = { markers: [] as number[], width: 0, height: 0 };
  for (let i = 2; i < bytes.length && bytes[i] === 0xff; i += 2 + bytes.readUInt16BE(i + 2)) {
    const marker = bytes[i + 1] ?? 0;
    if (marker === 0xda) break;
    result.markers.push(marker);
    if (marker === 0xc0) {
      result.height = bytes.readUInt16BE(i + 5);
      result.width = bytes.readUInt16BE(i + 7);
    }
  }
  return result;
}

describe('the portrait images', () => {
  it('are the size of PORTRAIT_FRAME (the depth pack and the photo)', () => {
    const png = portraitAsset('portrait-depth.png');
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([
      PORTRAIT_FRAME.imageWidth,
      PORTRAIT_FRAME.imageHeight,
    ]);
    const jpeg = jpegSegments(portraitAsset('portrait-color.jpg'));
    expect([jpeg.width, jpeg.height]).toEqual([
      PORTRAIT_FRAME.imageWidth,
      PORTRAIT_FRAME.imageHeight,
    ]);
  });

  it("their proportion is the visor's in the CSS (--visor-ratio): the frame fits the portrait on a phone", () => {
    const tokens = readFileSync(resolve(PORTRAIT_DIR, '../../styles/tokens.css'), 'utf8');
    const [, width, height] = /--visor-ratio: (\d+) \/ (\d+);/.exec(tokens) ?? [];
    expect([Number(width), Number(height)]).toEqual([
      PORTRAIT_FRAME.imageWidth,
      PORTRAIT_FRAME.imageHeight,
    ]);
  });

  it('carry pixels only, no metadata blocks (they are downloaded on every visit that reaches the turtle)', () => {
    expect(new Set(pngChunks(portraitAsset('portrait-depth.png')))).toEqual(
      new Set(['IHDR', 'IDAT', 'IEND']),
    );
    // De los APPn, solo el JFIF (APP0); ni EXIF ni manifiestos de procedencia (APP1, APP11…).
    const appSegments = jpegSegments(portraitAsset('portrait-color.jpg')).markers.filter(
      (marker) => marker >= 0xe0 && marker <= 0xef,
    );
    expect(appSegments).toEqual([0xe0]);
  });
});
