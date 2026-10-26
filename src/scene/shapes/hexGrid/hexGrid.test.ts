import { describe, expect, it } from 'vitest';

import { mulberry32 } from '../prng/prng';
import {
  discOutsideCell,
  HEX_INNER_RATIO,
  hexCell,
  type HexCell,
  hexCenterX,
  hexCenterZ,
} from './hexGrid';

const SIZE = 0.95;
const cell = (): HexCell => ({ q: 0, r: 0, h: 0 });

describe('hexCell', () => {
  it('the centre of every cell maps back to it, with h = 0', () => {
    const out = cell();
    for (let q = -3; q <= 3; q++) {
      for (let r = -3; r <= 3; r++) {
        hexCell(hexCenterX(q, r, SIZE), hexCenterZ(r, SIZE), SIZE, out);
        expect([out.q, out.r]).toEqual([q, r]);
        expect(out.h).toBeCloseTo(0, 12);
      }
    }
  });

  it('a point just inside a side is in the cell (h just under 1); just outside, in the neighbour', () => {
    const out = cell();
    const inner = SIZE * HEX_INNER_RATIO;
    hexCell(inner * 0.999, 0, SIZE, out);
    expect([out.q, out.r]).toEqual([0, 0]);
    expect(out.h).toBeCloseTo(0.999, 6);
    hexCell(inner * 1.001, 0, SIZE, out);
    expect([out.q, out.r]).toEqual([1, 0]);
  });

  it('pointy-top: the cell reaches its vertex along ±Z (size away), not along X', () => {
    const out = cell();
    hexCell(0, SIZE * 0.99, SIZE, out);
    expect([out.q, out.r]).toEqual([0, 0]);
    expect(out.h).toBeCloseTo(0.99, 6);
    hexCell(SIZE * 0.99, 0, SIZE, out);
    expect([out.q, out.r]).not.toEqual([0, 0]);
  });

  it('every point lands in the nearest cell centre (what a hexagonal grid means)', () => {
    const rng = mulberry32(4);
    const out = cell();
    for (let i = 0; i < 2000; i++) {
      const x = rng() * 8 - 4;
      const z = rng() * 8 - 4;
      hexCell(x, z, SIZE, out);
      const own = Math.hypot(x - hexCenterX(out.q, out.r, SIZE), z - hexCenterZ(out.r, SIZE));
      for (const [dq, dr] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, -1],
        [-1, 1],
      ] as const) {
        const q = out.q + dq;
        const r = out.r + dr;
        const other = Math.hypot(x - hexCenterX(q, r, SIZE), z - hexCenterZ(r, SIZE));
        expect(own).toBeLessThanOrEqual(other + 1e-9);
      }
      expect(Object.is(out.q, -0) || Object.is(out.r, -0)).toBe(false);
    }
  });
});

describe('discOutsideCell', () => {
  const inner = SIZE * HEX_INNER_RATIO;

  it('a disc that touches the cell is never «outside»', () => {
    expect(discOutsideCell(inner + 0.2, 0, 0.21, 0, 0, SIZE)).toBe(false);
    expect(discOutsideCell(0, 0, 0.1, 0, 0, SIZE)).toBe(false);
  });

  it('a disc clear of a side is outside, measured from that cell’s centre', () => {
    expect(discOutsideCell(inner + 0.25, 0, 0.24, 0, 0, SIZE)).toBe(true);
    const x = hexCenterX(1, 0, SIZE);
    expect(discOutsideCell(x, 0, 0.1, 1, 0, SIZE)).toBe(false);
    expect(discOutsideCell(x, 0, 0.1, 0, 0, SIZE)).toBe(true);
  });

  it('every sampled point of a disc said to be outside is outside the cell', () => {
    const rng = mulberry32(8);
    const out = cell();
    for (let i = 0; i < 3000; i++) {
      const x = rng() * 4 - 2;
      const z = rng() * 4 - 2;
      const radius = 0.14 + rng() * 0.1;
      if (!discOutsideCell(x, z, radius, 0, 0, SIZE)) continue;
      for (let k = 0; k < 16; k++) {
        const angle = (k / 16) * Math.PI * 2;
        hexCell(x + Math.cos(angle) * radius, z + Math.sin(angle) * radius, SIZE, out);
        expect([out.q, out.r]).not.toEqual([0, 0]);
      }
    }
  });
});
