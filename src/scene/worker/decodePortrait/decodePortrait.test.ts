import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { decodePortrait } from './decodePortrait';

/**
 * jsdom no tiene `createImageBitmap` ni `OffscreenCanvas`: se sustituyen por unos que dan una imagen de `size`
 * píxeles (por URL), con un valor propio en cada píxel (para saber cuál acaba en `color` y cuál en `pack`), y apuntan
 * con qué opciones se leyó cada una. Lo que se mira es el camino: descargar, leer sin gestión de color el paquete de
 * profundidad (y solo él) y fallar con un motivo claro.
 */
const sizes = new Map<string, { width: number; height: number }>();
/** Las opciones de `createImageBitmap`, por imagen. */
const bitmapOptions = new Map<'color' | 'pack', ImageBitmapOptions | undefined>();
let context2d = true;
const COLOR_VALUE = 11;
const PACK_VALUE = 22;

type Which = 'color' | 'pack';
const which = (url: string): Which => (url.includes('portrait-depth') ? 'pack' : 'color');

interface FakeBitmap {
  readonly width: number;
  readonly height: number;
  readonly image: Which;
  readonly close: () => void;
}

class FakeCanvas {
  constructor(
    readonly width: number,
    readonly height: number,
  ) {}
  getContext() {
    if (!context2d) return null;
    let drawn: Which = 'color';
    return {
      drawImage: (bitmap: FakeBitmap) => {
        drawn = bitmap.image;
      },
      getImageData: (_x: number, _y: number, width: number, height: number) => ({
        width,
        height,
        data: new Uint8ClampedArray(width * height * 4).fill(
          drawn === 'pack' ? PACK_VALUE : COLOR_VALUE,
        ),
      }),
    };
  }
}

beforeEach(() => {
  context2d = true;
  bitmapOptions.clear();
  sizes.clear();
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => Promise.resolve(new Response(url, { status: 200 }))),
  );
  vi.stubGlobal('createImageBitmap', async (blob: Blob, options?: ImageBitmapOptions) => {
    const image = which(await blob.text());
    bitmapOptions.set(image, options);
    const size = sizes.get(image) ?? { width: 4, height: 3 };
    return { ...size, image, close: vi.fn() } satisfies FakeBitmap;
  });
  vi.stubGlobal('OffscreenCanvas', FakeCanvas);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('decodePortrait', () => {
  it('downloads both images and gives their pixels, each in its place; only the depth pack is read as data', async () => {
    const pixels = await decodePortrait();
    expect(pixels).toMatchObject({ width: 4, height: 3 });
    expect(pixels.color).toHaveLength(4 * 3 * 4);
    expect(pixels.pack).toHaveLength(4 * 3 * 4);
    expect(pixels.color.every((value) => value === COLOR_VALUE)).toBe(true);
    expect(pixels.pack.every((value) => value === PACK_VALUE)).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(bitmapOptions.get('pack')).toEqual({
      colorSpaceConversion: 'none',
      premultiplyAlpha: 'none',
    });
    // La foto sí, con su gestión de color: es una imagen.
    expect(bitmapOptions.get('color')).toBeUndefined();
  });

  it('fails with a reason: images of different sizes, no 2D canvas, an HTTP error', async () => {
    sizes.set('pack', { width: 5, height: 3 });
    await expect(decodePortrait()).rejects.toThrow(/do not match/);
    sizes.clear();
    context2d = false;
    await expect(decodePortrait()).rejects.toThrow(/OffscreenCanvas/);
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 404 }));
    await expect(decodePortrait()).rejects.toThrow(/HTTP 404/);
  });
});
