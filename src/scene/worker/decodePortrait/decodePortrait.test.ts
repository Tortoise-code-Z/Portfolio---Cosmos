import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { decodePortrait } from './decodePortrait';

/**
 * jsdom no tiene `createImageBitmap` ni `OffscreenCanvas`: se sustituyen por unos que dan una imagen de `size`
 * píxeles (por URL) y apuntan cómo se leyó. Lo que se mira es el camino: descargar, leer sin gestión de color el
 * paquete de profundidad y fallar con un motivo claro.
 */
const sizes = new Map<string, { width: number; height: number }>();
const bitmapOptions: (ImageBitmapOptions | undefined)[] = [];
let context2d = true;

class FakeCanvas {
  constructor(
    readonly width: number,
    readonly height: number,
  ) {}
  getContext() {
    if (!context2d) return null;
    return {
      drawImage: vi.fn(),
      getImageData: (_x: number, _y: number, width: number, height: number) => ({
        width,
        height,
        data: new Uint8ClampedArray(width * height * 4).fill(width),
      }),
    };
  }
}

beforeEach(() => {
  context2d = true;
  bitmapOptions.length = 0;
  sizes.clear();
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) =>
      Promise.resolve(
        url.includes('missing')
          ? new Response(null, { status: 404 })
          : new Response(url, { status: 200 }),
      ),
    ),
  );
  vi.stubGlobal('createImageBitmap', async (blob: Blob, options?: ImageBitmapOptions) => {
    bitmapOptions.push(options);
    const url = await blob.text();
    const size = sizes.get(url.includes('portrait-depth') ? 'pack' : 'color') ?? {
      width: 4,
      height: 3,
    };
    return { ...size, close: vi.fn() };
  });
  vi.stubGlobal('OffscreenCanvas', FakeCanvas);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('decodePortrait', () => {
  it('downloads both images and gives their pixels; the depth pack is read as data (no colour management)', async () => {
    const pixels = await decodePortrait();
    expect(pixels).toMatchObject({ width: 4, height: 3 });
    expect(pixels.color).toHaveLength(4 * 3 * 4);
    expect(pixels.pack).toHaveLength(4 * 3 * 4);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(bitmapOptions).toContainEqual({
      colorSpaceConversion: 'none',
      premultiplyAlpha: 'none',
    });
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
