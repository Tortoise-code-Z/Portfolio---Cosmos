import { PLATE_SLOTS, type PlateSlot } from '../../config/plateSlots/plateSlots';
import { HEX_SIZE, SHELL } from '../../config/sceneConfig';
import { discOutsideCell, hexCell, type HexCell } from '../hexGrid/hexGrid';
import type { Rng } from '../prng/prng';
import { TURTLE_FLIPPERS, TURTLE_TAG } from '../shapeContract/shapeContract';
import { boundedGauss, randomDirection, TAU, type Vec3 } from '../sampling/sampling';

/**
 * Forma 3 · Tortuga cósmica (docs/04-escena/formas.md): caparazón con su rejilla y sus placas, bosque, cabeza,
 * aletas, cola y estela (`pTur`), con la etiqueta de cada parte en `aR.y`. Cabeza hacia +X. Las partes van por
 * índice (fracciones fijas); los números son los del prototipo.
 */

/** Hasta qué fracción del índice llega cada parte (el resto, la estela). */
export const TURTLE_PARTS = {
  shell: 0.44,
  plastron: 0.48,
  forest: 0.58,
  head: 0.65,
  eyes: 0.654,
  flippers: 0.834,
  tail: 0.844,
} as const;

export const TURTLE = {
  shell: {
    /** El caparazón se hunde hasta un 3 % hacia dentro (grosor). */
    depth: 0.03,
    /** Se prefieren los bordes: un punto lejos del borde (`h < 0,8`) se re-muestrea con un 50 %. */
    resampleBelowH: 0.8,
    resampleChance: 0.5,
    maxAttempts: 4,
    /** Etiqueta de borde: cerca del lado de la celda o en la falda del caparazón. */
    edgeAboveH: 0.82,
    edgeBelowHeight: 0.08,
  },
  plastron: { radius: 0.94, y: -0.06 },
  forest: {
    trees: 30,
    /** Los árboles crecen en la franja media del caparazón (altura relativa `v`). */
    minHeight: 0.3,
    maxHeight: 0.85,
    treeHeightMin: 0.32,
    treeHeightRange: 0.38,
    treeRadiusMin: 0.14,
    treeRadiusRange: 0.1,
    /** Las partículas se apilan hacia la base (`rng^0,8`). */
    heightExponent: 0.8,
    maxAttempts: 10_000,
  },
  head: {
    neckShare: 0.3,
    jitter: 0.05,
    neck: { centre: [2.5, 0.22, 0], radii: [0.55, 0.32, 0.38] },
    skull: { centre: [3.15, 0.38, 0], radii: [0.58, 0.38, 0.43] },
  },
  eyes: { x: 3.52, y: 0.55, z: 0.28, spread: 0.03 },
  flippers: {
    count: TURTLE_FLIPPERS,
    front: { reachMin: 1.7, reach: 1.1, x: 1.5, width: 0.42, sweepX: 0.45, dropY: 0.08 },
    back: { reachMin: 1.6, reach: 0.6, x: -1.7, width: 0.35, sweepX: 0.5, dropY: 0.06 },
    /** El ancho de la aleta se estrecha hacia la punta (`1 − (e + 1) · taper`). */
    taper: 0.25,
    thickness: 0.05,
    maxAttempts: 64,
  },
  tail: { x: -2.55, length: 0.75, radius: 0.18, dropY: 0.05 },
  wake: { x: -3, length: 7, spreadY: 0.2, growY: 0.12, spreadZ: 0.3, growZ: 0.16 },
} as const;

/** Un árbol del bosque: base sobre el caparazón, alto y radio. */
interface Tree {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly height: number;
  readonly radius: number;
}

/** Punto del caparazón (hemisferio superior del elipsoide) y su altura relativa `v` (0 falda, 1 cumbre). */
function shellPoint(rng: Rng, out: [number, number, number, number]): void {
  const v = rng();
  const angle = rng() * TAU;
  const ring = Math.sqrt(1 - v * v);
  const depth = 1 - rng() * TURTLE.shell.depth;
  out[0] = SHELL.AX * ring * Math.cos(angle) * depth;
  out[1] = SHELL.AY * v * depth;
  out[2] = SHELL.AZ * ring * Math.sin(angle) * depth;
  out[3] = v;
}

/** Los huecos con proyecto. */
function activeSlots(plates: ReadonlySet<number>): PlateSlot[] {
  return PLATE_SLOTS.filter((slot) => plates.has(slot.label));
}

/** La etiqueta de placa de una celda (20..26) si es un hueco con proyecto; si no, 0. */
function plateLabel(cell: HexCell, slots: readonly PlateSlot[]): number {
  for (const slot of slots) if (slot.q === cell.q && slot.r === cell.r) return slot.label;
  return 0;
}

/**
 * Los 30 árboles, en la franja media y con **todo** el círculo de su base fuera de las placas
 * (formas.md): así ninguna hoja cae dentro de una placa.
 */
function plantForest(rng: Rng, slots: readonly PlateSlot[]): Tree[] {
  const { forest } = TURTLE;
  const point: [number, number, number, number] = [0, 0, 0, 0];
  const trees: Tree[] = [];
  for (let attempt = 0; trees.length < forest.trees; attempt++) {
    if (attempt >= forest.maxAttempts) {
      throw new Error(`[scene] Could not plant ${String(forest.trees)} trees off the plates`);
    }
    shellPoint(rng, point);
    const [x, y, z, v] = point;
    if (v < forest.minHeight || v > forest.maxHeight) continue;
    const height = forest.treeHeightMin + rng() * forest.treeHeightRange;
    const radius = forest.treeRadiusMin + rng() * forest.treeRadiusRange;
    if (!slots.every(({ q, r }) => discOutsideCell(x, z, radius, q, r, HEX_SIZE))) continue;
    trees.push({ x, y, z, height, radius });
  }
  return trees;
}

/**
 * Escribe `count` posiciones en `positions` (x, y, z) y la etiqueta de cada partícula en `rand` (`aR.y`, 4 por
 * partícula). `plates`: las etiquetas de placa con proyecto (el resto de huecos son celdas normales).
 */
export function generateTurtle(
  count: number,
  rng: Rng,
  plates: ReadonlySet<number>,
  positions: Float32Array,
  rand: Float32Array,
): void {
  const { shell, plastron, forest, head, eyes, flippers, tail, wake } = TURTLE;
  const slots = activeSlots(plates);
  const trees = plantForest(rng, slots);
  const point: [number, number, number, number] = [0, 0, 0, 0];
  const cell: HexCell = { q: 0, r: 0, h: 0 };
  const direction: Vec3 = [0, 0, 0];

  for (let i = 0; i < count; i++) {
    const f = i / count;
    let x: number;
    let y: number;
    let z: number;
    let tag: number;
    if (f < TURTLE_PARTS.shell) {
      for (let attempt = 1; ; attempt++) {
        shellPoint(rng, point);
        hexCell(point[0], point[2], HEX_SIZE, cell);
        const resample =
          cell.h < shell.resampleBelowH &&
          plateLabel(cell, slots) === 0 &&
          rng() < shell.resampleChance &&
          attempt < shell.maxAttempts;
        if (!resample) break;
      }
      [x, y, z] = point;
      const plate = plateLabel(cell, slots);
      const edge = cell.h > shell.edgeAboveH || point[3] < shell.edgeBelowHeight;
      tag = plate !== 0 ? plate : edge ? TURTLE_TAG.shellEdge : TURTLE_TAG.shell;
    } else if (f < TURTLE_PARTS.plastron) {
      const angle = rng() * TAU;
      const radius = Math.sqrt(rng()) * plastron.radius;
      x = Math.cos(angle) * radius * SHELL.AX;
      z = Math.sin(angle) * radius * SHELL.AZ;
      y = plastron.y;
      tag = TURTLE_TAG.plastron;
    } else if (f < TURTLE_PARTS.forest) {
      const tree = trees[i % trees.length];
      if (tree === undefined) throw new Error('[scene] The forest has no trees');
      const up = rng() ** forest.heightExponent;
      const angle = rng() * TAU;
      const spread = (1 - up) * tree.radius * Math.sqrt(rng());
      x = tree.x + Math.cos(angle) * spread;
      z = tree.z + Math.sin(angle) * spread;
      y = tree.y + up * tree.height;
      tag = TURTLE_TAG.forest;
    } else if (f < TURTLE_PARTS.head) {
      randomDirection(rng, direction);
      const jitter = 1 - rng() * head.jitter;
      const part = rng() < head.neckShare ? head.neck : head.skull;
      x = part.centre[0] + direction[0] * part.radii[0] * jitter;
      y = part.centre[1] + direction[1] * part.radii[1] * jitter;
      z = part.centre[2] + direction[2] * part.radii[2] * jitter;
      tag = TURTLE_TAG.head;
    } else if (f < TURTLE_PARTS.eyes) {
      const side = rng() < 0.5 ? 1 : -1;
      x = eyes.x + boundedGauss(rng) * eyes.spread;
      y = eyes.y + boundedGauss(rng) * eyes.spread;
      z = side * eyes.z + boundedGauss(rng) * eyes.spread;
      tag = TURTLE_TAG.eyes;
    } else if (f < TURTLE_PARTS.flippers) {
      const index = Math.min(
        Math.floor(
          ((f - TURTLE_PARTS.eyes) / (TURTLE_PARTS.flippers - TURTLE_PARTS.eyes)) * flippers.count,
        ),
        flippers.count - 1,
      );
      const flipper = index < 2 ? flippers.front : flippers.back;
      const side = index % 2 === 1 ? 1 : -1;
      // Un punto del disco unidad por rechazo (con tope: si se agota, el centro).
      let along = 0;
      let across = 0;
      for (let attempt = 0; attempt < flippers.maxAttempts; attempt++) {
        const a = rng() * 2 - 1;
        const b = rng() * 2 - 1;
        if (a * a + b * b <= 1) {
          along = a;
          across = b;
          break;
        }
      }
      const out = flipper.reachMin + (along + 1) * flipper.reach;
      const reached = out - flipper.reachMin;
      z = side * out;
      x =
        flipper.x +
        across * flipper.width * (1 - (along + 1) * flippers.taper) -
        reached * flipper.sweepX;
      y = boundedGauss(rng) * flippers.thickness - reached * flipper.dropY;
      tag = TURTLE_TAG.flipper + index;
    } else if (f < TURTLE_PARTS.tail) {
      const t = rng();
      const angle = rng() * TAU;
      const radius = (1 - t) * tail.radius * Math.sqrt(rng());
      x = tail.x - t * tail.length;
      y = -tail.dropY * t + Math.sin(angle) * radius;
      z = Math.cos(angle) * radius;
      tag = TURTLE_TAG.tail;
    } else {
      const behind = rng() * wake.length;
      x = wake.x - behind;
      y = boundedGauss(rng) * (wake.spreadY + behind * wake.growY);
      z = boundedGauss(rng) * (wake.spreadZ + behind * wake.growZ);
      tag = TURTLE_TAG.wake;
    }
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    rand[i * 4 + 1] = tag;
  }
}
