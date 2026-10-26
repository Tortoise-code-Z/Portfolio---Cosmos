import { describe, expect, it, vi } from 'vitest';

import * as generator from '../../shapes/generateShapes/generateShapes';
import { handleShapesRequest } from './handleShapesRequest';

describe('handleShapesRequest', () => {
  it('generates and answers with the shapes and their buffers to transfer', () => {
    const { message, transfer } = handleShapesRequest({ count: 5, seed: 3, plates: [20, 22] });
    expect(message.ok).toBe(true);
    if (!message.ok) return;
    expect(message.shapes).toEqual(
      generator.generateShapes({ count: 5, seed: 3, plates: [20, 22] }),
    );
    expect(transfer).toHaveLength(5);
    expect(transfer).toContain(message.shapes.rand.buffer);
  });

  it('a bad request is answered with the reason, never thrown', () => {
    expect(handleShapesRequest({ count: -1, seed: 3, plates: [] })).toEqual({
      message: { ok: false, reason: expect.stringMatching(/count/) as unknown },
      transfer: [],
    });
    expect(handleShapesRequest(undefined).message.ok).toBe(false);
  });

  it('a generator that throws is answered with its message, never thrown', () => {
    vi.spyOn(generator, 'generateShapes').mockImplementation(() => {
      throw new Error('[scene] Could not plant 30 trees off the plates');
    });
    expect(handleShapesRequest({ count: 5, seed: 3, plates: [] }).message).toEqual({
      ok: false,
      reason: '[scene] Could not plant 30 trees off the plates',
    });
    vi.mocked(generator.generateShapes).mockImplementation(() => {
      // Algo que no es un Error también vuelve como texto.
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw 'out of memory';
    });
    expect(handleShapesRequest({ count: 5, seed: 3, plates: [] }).message).toEqual({
      ok: false,
      reason: 'out of memory',
    });
  });
});
