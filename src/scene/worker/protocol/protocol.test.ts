import { describe, expect, it } from 'vitest';

import { generateShapes } from '../../shapes/generateShapes/generateShapes';
import { parseShapesRequest, parseShapesResponse, transferablesOf } from './protocol';

const valid = { count: 4, seed: 7, plates: [20] };

describe('parseShapesRequest', () => {
  it('accepts a valid request', () => {
    expect(parseShapesRequest(valid)).toEqual({ ok: true, value: valid });
  });

  it.each([
    ['not an object', null, /not an object/],
    ['a string', 'go', /not an object/],
    ['count missing', { seed: 1, plates: [] }, /numbers/],
    ['seed as text', { count: 1, seed: '1', plates: [] }, /numbers/],
    ['plates missing', { count: 1, seed: 1 }, /array/],
    ['plates with text', { count: 1, seed: 1, plates: ['20'] }, /array/],
    ['count out of range', { count: 0, seed: 1, plates: [] }, /count/],
    ['a repeated plate', { count: 1, seed: 1, plates: [21, 21] }, /repeat/],
  ])('rejects %s, and says why', (_name, data, reason) => {
    const parsed = parseShapesRequest(data);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.reason).toMatch(reason);
  });
});

describe('parseShapesResponse', () => {
  const shapes = generateShapes(valid);

  it('accepts the five arrays with their lengths', () => {
    expect(parseShapesResponse({ ok: true, shapes }, 4)).toEqual({ ok: true, value: shapes });
  });

  it('passes on the reason of a rejection', () => {
    expect(parseShapesResponse({ ok: false, reason: 'count must be…' }, 4)).toEqual({
      ok: false,
      reason: 'count must be…',
    });
    expect(parseShapesResponse({ ok: false }, 4)).toEqual({ ok: false, reason: 'rejected' });
  });

  it.each([
    ['not an object', 42, /not an object/],
    ['no shapes', { ok: true }, /no shapes/],
    ['ok missing', { shapes }, /no shapes/],
    ['another count', { ok: true, shapes }, /another count/, 5],
    ['a short array', { ok: true, shapes: { ...shapes, galaxy: new Float32Array(3) } }, /length/],
    ['a plain array', { ok: true, shapes: { ...shapes, rand: [...shapes.rand] } }, /type/],
    ['an array missing', { ok: true, shapes: { ...shapes, earth: undefined } }, /type/],
  ])('rejects a response with %s', (_name, data, reason, count = 4) => {
    const parsed = parseShapesResponse(data, count);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.reason).toMatch(reason);
  });
});

describe('transferablesOf', () => {
  it('lists the five buffers, to move them without copying', () => {
    const shapes = generateShapes(valid);
    expect(transferablesOf(shapes)).toEqual([
      shapes.nebula.buffer,
      shapes.galaxy.buffer,
      shapes.turtle.buffer,
      shapes.earth.buffer,
      shapes.rand.buffer,
    ]);
  });
});
