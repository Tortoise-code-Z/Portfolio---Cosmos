import { describe, expect, it, vi } from 'vitest';

import * as generator from '../../shapes/portrait/portrait';
import type { PortraitPixels } from '../../shapes/portrait/portrait';
import { mulberry32, subSeed } from '../../shapes/prng/prng';
import { PORTRAIT_FRAME } from '../../shapes/shapeContract/shapeContract';
import { handlePortraitRequest } from './handlePortraitRequest';

const W = PORTRAIT_FRAME.imageWidth;
const H = PORTRAIT_FRAME.imageHeight;

/** Una figura en el centro de la imagen. */
function image(): PortraitPixels {
  const color = new Uint8ClampedArray(W * H * 4).fill(180);
  const pack = new Uint8ClampedArray(W * H * 4);
  for (let y = 200; y < 400; y++) {
    for (let x = 250; x < 450; x++) pack.set([128, 255, 0, 255], (y * W + x) * 4);
  }
  return { width: W, height: H, color, pack };
}

const request = { kind: 'portrait', count: 30, seed: 5 };
const decode = (): Promise<PortraitPixels> => Promise.resolve(image());

describe('handlePortraitRequest', () => {
  it('reads the images, generates with the portrait subseed and answers with pPor to transfer', async () => {
    const { message, transfer } = await handlePortraitRequest(request, decode);
    expect(message.ok).toBe(true);
    if (!message.ok) return;
    const expected = new Float32Array(30 * 4);
    generator.generatePortrait(30, mulberry32(subSeed(5, 'portrait')), image(), expected);
    expect(message.portrait).toEqual(expected);
    expect(transfer).toEqual([message.portrait.buffer]);
  });

  it('a bad request is answered with the reason, without reading the images', async () => {
    const reader = vi.fn(decode);
    const { message, transfer } = await handlePortraitRequest(
      { kind: 'portrait', count: 0, seed: 5 },
      reader,
    );
    expect(message).toEqual({ ok: false, reason: expect.stringMatching(/count/) as unknown });
    expect(transfer).toEqual([]);
    expect(reader).not.toHaveBeenCalled();
  });

  it('images that do not arrive, or a generator that throws, are answered with the reason, never thrown', async () => {
    const missing = () => Promise.reject(new Error('/assets/portrait-color.jpg: HTTP 404'));
    await expect(handlePortraitRequest(request, missing)).resolves.toEqual({
      message: { ok: false, reason: '/assets/portrait-color.jpg: HTTP 404' },
      transfer: [],
    });
    vi.spyOn(generator, 'generatePortrait').mockImplementation(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- algo que no es un Error también vuelve como texto
      throw 'out of memory';
    });
    await expect(handlePortraitRequest(request, decode)).resolves.toMatchObject({
      message: { ok: false, reason: 'out of memory' },
    });
  });
});
