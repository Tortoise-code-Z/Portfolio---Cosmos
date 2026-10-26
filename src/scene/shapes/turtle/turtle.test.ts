import { describe, expect, it } from 'vitest';

import { PLATE_SLOTS } from '../../config/plateSlots/plateSlots';
import { HEX_SIZE, SHELL } from '../../config/sceneConfig';
import { hexCell, type HexCell } from '../hexGrid/hexGrid';
import { mulberry32 } from '../prng/prng';
import { TURTLE_TAG } from '../shapeContract/shapeContract';
import { generateTurtle, TURTLE, TURTLE_PARTS } from './turtle';

const EPS = 1e-4;
const ALL_PLATES = PLATE_SLOTS.map(({ label }) => label);

function turtle(count: number, plates: readonly number[], seed = 51) {
  const positions = new Float32Array(count * 3);
  const rand = new Float32Array(count * 4);
  generateTurtle(count, mulberry32(seed), new Set(plates), positions, rand);
  const at = (i: number) => ({
    x: positions[i * 3] ?? 0,
    y: positions[i * 3 + 1] ?? 0,
    z: positions[i * 3 + 2] ?? 0,
    tag: rand[i * 4 + 1] ?? -1,
  });
  return { positions, rand, at };
}

const isPlate = (tag: number): boolean => tag >= 20 && tag <= 26;
const isShell = (tag: number): boolean =>
  tag === TURTLE_TAG.shell || tag === TURTLE_TAG.shellEdge || isPlate(tag);

describe('generateTurtle', () => {
  for (const count of [20_000, 60_000]) {
    it(`each part gets its share of the table (±1 %), at ${String(count)}`, () => {
      const { at } = turtle(count, [20, 21, 22]);
      const tally = new Map<string, number>();
      const group = (tag: number): string => {
        if (isShell(tag)) return 'shell';
        if (tag >= TURTLE_TAG.flipper && tag < TURTLE_TAG.flipper + TURTLE.flippers.count) {
          return 'flippers';
        }
        return String(tag);
      };
      for (let i = 0; i < count; i++) {
        const key = group(at(i).tag);
        tally.set(key, (tally.get(key) ?? 0) + 1);
      }
      const share = (key: string): number => (tally.get(key) ?? 0) / count;
      // `toBeCloseTo(x, 2)` admite ±0,005: para los ojos (0,4 %) eso dejaría pasar cero. Cada parte, al menos una.
      const parts = [
        'shell',
        'flippers',
        ...[
          TURTLE_TAG.plastron,
          TURTLE_TAG.forest,
          TURTLE_TAG.head,
          TURTLE_TAG.eyes,
          TURTLE_TAG.tail,
          TURTLE_TAG.wake,
        ].map(String),
      ];
      for (const part of parts) expect(tally.get(part) ?? 0).toBeGreaterThan(0);
      expect(share('shell')).toBeCloseTo(TURTLE_PARTS.shell, 2);
      expect(share(String(TURTLE_TAG.plastron))).toBeCloseTo(
        TURTLE_PARTS.plastron - TURTLE_PARTS.shell,
        2,
      );
      expect(share(String(TURTLE_TAG.forest))).toBeCloseTo(
        TURTLE_PARTS.forest - TURTLE_PARTS.plastron,
        2,
      );
      expect(share(String(TURTLE_TAG.head))).toBeCloseTo(
        TURTLE_PARTS.head - TURTLE_PARTS.forest,
        2,
      );
      expect(share(String(TURTLE_TAG.eyes))).toBeCloseTo(TURTLE_PARTS.eyes - TURTLE_PARTS.head, 2);
      expect(share('flippers')).toBeCloseTo(TURTLE_PARTS.flippers - TURTLE_PARTS.eyes, 2);
      expect(share(String(TURTLE_TAG.tail))).toBeCloseTo(
        TURTLE_PARTS.tail - TURTLE_PARTS.flippers,
        2,
      );
      expect(share(String(TURTLE_TAG.wake))).toBeCloseTo(1 - TURTLE_PARTS.tail, 2);
    });
  }

  it('every part stays in the box its formulas allow', () => {
    const { at } = turtle(20_000, ALL_PLATES);
    const { head, eyes, flippers, tail, wake, forest, plastron } = TURTLE;
    for (let i = 0; i < 20_000; i++) {
      const { x, y, z, tag } = at(i);
      if (isShell(tag)) {
        // Hemisferio superior del elipsoide, con su grosor del 3 %.
        const r = Math.hypot(x / SHELL.AX, y / SHELL.AY, z / SHELL.AZ);
        expect(r).toBeLessThanOrEqual(1 + EPS);
        expect(r).toBeGreaterThanOrEqual(1 - TURTLE.shell.depth - EPS);
        expect(y).toBeGreaterThanOrEqual(-EPS);
      } else if (tag === TURTLE_TAG.plastron) {
        expect(y).toBeCloseTo(plastron.y, 5);
        expect(Math.hypot(x / SHELL.AX, z / SHELL.AZ)).toBeLessThanOrEqual(plastron.radius + EPS);
      } else if (tag === TURTLE_TAG.forest) {
        // La base del árbol está en la franja media del caparazón (su anillo, como mucho √(1 − 0,3²)) y la hoja
        // se separa de ella como mucho el radio del árbol.
        const ring = Math.sqrt(1 - forest.minHeight ** 2);
        const treeRadius = forest.treeRadiusMin + forest.treeRadiusRange;
        expect(Math.abs(x)).toBeLessThanOrEqual(SHELL.AX * ring + treeRadius + EPS);
        expect(Math.abs(z)).toBeLessThanOrEqual(SHELL.AZ * ring + treeRadius + EPS);
        expect(y).toBeGreaterThanOrEqual(
          SHELL.AY * forest.minHeight * (1 - TURTLE.shell.depth) - EPS,
        );
        expect(y).toBeLessThanOrEqual(
          SHELL.AY * forest.maxHeight + forest.treeHeightMin + forest.treeHeightRange + EPS,
        );
      } else if (tag === TURTLE_TAG.head) {
        const inside = [head.neck, head.skull].some(
          ({ centre, radii }) =>
            Math.hypot(
              (x - centre[0]) / radii[0],
              (y - centre[1]) / radii[1],
              (z - centre[2]) / radii[2],
            ) <=
            1 + EPS,
        );
        expect(inside).toBe(true);
      } else if (tag === TURTLE_TAG.eyes) {
        expect(Math.abs(x - eyes.x)).toBeLessThanOrEqual(eyes.spread + EPS);
        expect(Math.abs(y - eyes.y)).toBeLessThanOrEqual(eyes.spread + EPS);
        expect(Math.abs(Math.abs(z) - eyes.z)).toBeLessThanOrEqual(eyes.spread + EPS);
      } else if (tag >= TURTLE_TAG.flipper && tag < TURTLE_TAG.flipper + flippers.count) {
        const index = tag - TURTLE_TAG.flipper;
        const flipper = index < 2 ? flippers.front : flippers.back;
        // 7 y 9 a un lado (−Z), 8 y 10 al otro: el shader las mueve en contrafase.
        expect(Math.sign(z)).toBe(index % 2 === 1 ? 1 : -1);
        expect(Math.abs(z)).toBeGreaterThanOrEqual(flipper.reachMin - EPS);
        expect(Math.abs(z)).toBeLessThanOrEqual(flipper.reachMin + 2 * flipper.reach + EPS);
        // Lo que la aleta se aleja del cuerpo la barre hacia atrás (X) y la baja (Y): sin ese barrido, X queda
        // a un ancho de su raíz e Y dentro de su grosor.
        const reached = Math.abs(z) - flipper.reachMin;
        expect(Math.abs(x + reached * flipper.sweepX - flipper.x)).toBeLessThanOrEqual(
          flipper.width + EPS,
        );
        expect(Math.abs(y + reached * flipper.dropY)).toBeLessThanOrEqual(flippers.thickness + EPS);
      } else if (tag === TURTLE_TAG.tail) {
        expect(x).toBeLessThanOrEqual(tail.x + EPS);
        expect(x).toBeGreaterThanOrEqual(tail.x - tail.length - EPS);
        expect(Math.hypot(y + tail.dropY * ((tail.x - x) / tail.length), z)).toBeLessThanOrEqual(
          tail.radius + EPS,
        );
      } else {
        expect(tag).toBe(TURTLE_TAG.wake);
        expect(x).toBeLessThanOrEqual(wake.x + EPS);
        expect(x).toBeGreaterThanOrEqual(wake.x - wake.length - EPS);
        expect(Math.abs(y)).toBeLessThanOrEqual(wake.spreadY + wake.length * wake.growY + EPS);
        expect(Math.abs(z)).toBeLessThanOrEqual(wake.spreadZ + wake.length * wake.growZ + EPS);
      }
    }
  });

  for (const plates of [[], [20], ALL_PLATES]) {
    it(`no tree leaf falls inside a plate, and only plates with a project are tagged (plates ${JSON.stringify(plates)})`, () => {
      const count = 20_000;
      const { at } = turtle(count, plates);
      const active = PLATE_SLOTS.filter(({ label }) => plates.includes(label));
      const cell: HexCell = { q: 0, r: 0, h: 0 };
      const seen = new Set<number>();
      for (let i = 0; i < count; i++) {
        const { x, z, tag } = at(i);
        if (isPlate(tag)) seen.add(tag);
        if (tag !== TURTLE_TAG.forest) continue;
        hexCell(x, z, HEX_SIZE, cell);
        expect(active.some(({ q, r }) => q === cell.q && r === cell.r)).toBe(false);
      }
      expect([...seen].sort()).toEqual([...plates].sort());
    });
  }

  it('a shell particle carries the plate label of its cell (and a plate cell is all plate)', () => {
    const count = 20_000;
    const { at } = turtle(count, ALL_PLATES);
    const cell: HexCell = { q: 0, r: 0, h: 0 };
    for (let i = 0; i < count; i++) {
      const { x, z, tag } = at(i);
      if (!isShell(tag)) continue;
      hexCell(x, z, HEX_SIZE, cell);
      const slot = PLATE_SLOTS.find(({ q, r }) => q === cell.q && r === cell.r);
      if (slot === undefined) expect(isPlate(tag)).toBe(false);
      else expect(tag).toBe(slot.label);
    }
  });

  it('a slot without a project is a normal cell: the trees may grow there', () => {
    const { at } = turtle(20_000, []);
    const cell: HexCell = { q: 0, r: 0, h: 0 };
    let treesOnSlots = 0;
    for (let i = 0; i < 20_000; i++) {
      const { x, z, tag } = at(i);
      if (tag !== TURTLE_TAG.forest) continue;
      hexCell(x, z, HEX_SIZE, cell);
      if (PLATE_SLOTS.some(({ q, r }) => q === cell.q && r === cell.r)) treesOnSlots++;
    }
    expect(treesOnSlots).toBeGreaterThan(0);
  });

  it('only touches aR.y (the turtle tag) in the shared aR array', () => {
    const count = 30;
    const positions = new Float32Array(count * 3);
    const rand = new Float32Array(count * 4).fill(7);
    generateTurtle(count, mulberry32(1), new Set([20]), positions, rand);
    for (let i = 0; i < count; i++) {
      expect([rand[i * 4], rand[i * 4 + 2], rand[i * 4 + 3]]).toEqual([7, 7, 7]);
    }
  });

  it('fails with a clear error, instead of looping forever, when the forest cannot be planted', () => {
    // Todo el azar a 0,95: cada punto del caparazón sale por encima de la franja de los árboles.
    expect(() => {
      generateTurtle(10, () => 0.95, new Set(), new Float32Array(30), new Float32Array(40));
    }).toThrow(/Could not plant 30 trees/);
  });
});
