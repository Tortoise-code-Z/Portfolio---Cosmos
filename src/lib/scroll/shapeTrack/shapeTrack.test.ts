import { describe, expect, it } from 'vitest';

import { EPILOGUE_ARRIVAL } from '../arrival/arrival';
import { journeyValue } from '../journeyPosition/journeyPosition';
import { stepAt } from '../mapM/mapM';
import {
  CHAPTER_SHAPES,
  createShapeMix,
  isShip,
  journeySteps,
  SHAPE,
  SHAPE_TRACK,
  SHIP_ARRIVAL,
  shapeMixAt,
  shapePosition,
  type ShapeMix,
  type ShapeSegment,
} from './shapeTrack';

describe('SHAPE', () => {
  it('un id distinto por forma, de 0 a 7 sin huecos', () => {
    const ids = Object.values(SHAPE).sort((a, b) => a - b);
    expect(ids).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});

describe('SHAPE_TRACK y CHAPTER_SHAPES', () => {
  it('empiezan en la singularidad, acaban en el retrato y no repiten forma', () => {
    for (const track of [SHAPE_TRACK, CHAPTER_SHAPES]) {
      expect(track[0]).toBe(SHAPE.singularity);
      expect(track.at(-1)).toBe(SHAPE.portrait);
      expect(new Set(track).size).toBe(track.length);
    }
  });

  it('el viaje pasa por el satélite entre la nebulosa y la galaxia, y por la nave nodriza entre la tortuga y la Tierra', () => {
    const satellite = SHAPE_TRACK.indexOf(SHAPE.satellite);
    expect(SHAPE_TRACK[satellite - 1]).toBe(SHAPE.nebula);
    expect(SHAPE_TRACK[satellite + 1]).toBe(SHAPE.galaxy);
    const mothership = SHAPE_TRACK.indexOf(SHAPE.mothership);
    expect(SHAPE_TRACK[mothership - 1]).toBe(SHAPE.turtle);
    expect(SHAPE_TRACK[mothership + 1]).toBe(SHAPE.earth);
  });

  it('las formas de los capítulos son las del viaje sin naves', () => {
    expect(CHAPTER_SHAPES).toEqual(SHAPE_TRACK.filter((id) => !isShip(id)));
  });

  it('isShip: el satélite y la nave nodriza, nada más', () => {
    expect(Object.values(SHAPE).filter(isShip)).toEqual([SHAPE.satellite, SHAPE.mothership]);
  });
});

describe('shapePosition', () => {
  it('fuera de la llegada del epílogo es la `m` de la escena', () => {
    expect(shapePosition(0)).toBe(0);
    expect(shapePosition(1)).toBe(1);
    expect(shapePosition(2.4)).toBe(2.4);
    expect(shapePosition(EPILOGUE_ARRIVAL.base)).toBe(EPILOGUE_ARRIVAL.base);
  });

  it('en la llegada, la de la forma: el retrato, formado y entero en `morphEnd`', () => {
    const { base, morphEnd } = EPILOGUE_ARRIVAL;
    expect(shapePosition(base + morphEnd / 2)).toBeCloseTo(base + 0.5);
    expect(shapePosition(base + morphEnd)).toBe(CHAPTER_SHAPES.length - 1);
    expect(shapePosition(base + 1)).toBe(CHAPTER_SHAPES.length - 1);
  });

  it('acotada a las formas de los capítulos, y al principio si no es un número', () => {
    const last = CHAPTER_SHAPES.length - 1;
    expect(shapePosition(-1)).toBe(0);
    expect(shapePosition(9)).toBe(last);
    expect(shapePosition(Number.NaN)).toBe(0);
    expect(shapePosition(Number.NEGATIVE_INFINITY)).toBe(0);
    expect(shapePosition(Number.POSITIVE_INFINITY)).toBe(last);
  });
});

/**
 * La cuenta que hacía el shader antes del mapa de formas (ADR-041), escrita en TS: `m` acotada a 4,999, remapeada en la
 * llegada del epílogo con `morphEnd`, y las formas de `floor(m)` y la siguiente (`shape(5)` era el retrato). Sin naves
 * (`CHAPTER_SHAPES`), el mapa de formas da lo mismo en cualquier `m` hasta que el retrato se forma, también a mitad de
 * un cambio; desde ahí ya no se para en el último cambio casi entero (Tierra → retrato a 0,999), sino en el retrato
 * entero (el shader evalúa una sola forma).
 */
const OLD_LAST_M = 4.999;
const OLD_SHAPE_OF_K = [
  SHAPE.singularity,
  SHAPE.nebula,
  SHAPE.galaxy,
  SHAPE.turtle,
  SHAPE.earth,
  SHAPE.portrait,
];

function oldShapeMix(uM: number): { from: number | undefined; to: number | undefined; t: number } {
  const { base, morphEnd } = EPILOGUE_ARRIVAL;
  let m = Math.min(Math.max(uM, 0), OLD_LAST_M);
  if (m > base) m = Math.min(base + (m - base) / morphEnd, OLD_LAST_M);
  const k = Math.floor(m);
  return { from: OLD_SHAPE_OF_K[k], to: OLD_SHAPE_OF_K[k + 1], t: m - k };
}

const chapterMix = (m: number): ShapeMix =>
  shapeMixAt(shapePosition(m), CHAPTER_SHAPES, createShapeMix());

describe('las formas de los capítulos frente a la cuenta vieja del shader', () => {
  const { base, morphEnd } = EPILOGUE_ARRIVAL;
  const before = [
    -1,
    0,
    0.3,
    1,
    2.5,
    3.999,
    4,
    4.1,
    base + morphEnd / 2,
    base + morphEnd * 0.99,
    Number.NEGATIVE_INFINITY,
  ];

  it.each(before)('m = %s: las mismas formas y la misma fracción', (m) => {
    const old = oldShapeMix(m);
    const mix = chapterMix(m);
    expect(mix.from).toBe(old.from);
    expect(mix.to).toBe(old.to);
    expect(mix.t).toBeCloseTo(old.t, 9);
  });

  it.each([base + morphEnd, 4.8, 5, 6, Number.POSITIVE_INFINITY])(
    'm = %s: con el retrato formado, quieta en él (antes, Tierra → retrato a 0,999)',
    (m) => {
      const old = oldShapeMix(m);
      expect([old.from, old.to]).toEqual([SHAPE.earth, SHAPE.portrait]);
      expect(old.t).toBeCloseTo(0.999, 9);
      expect(chapterMix(m)).toEqual({ from: SHAPE.portrait, to: SHAPE.portrait, t: 0 });
    },
  );
});

/** Un viaje como el de `JOURNEY_SEGMENTS`: el Mission log y Mission control, cada uno con su nave. */
const SEGMENTS: readonly ShapeSegment[] = [
  { kind: 'chapter', base: 0, morphStart: 0 },
  { kind: 'chapter', base: 1, morphStart: null },
  { kind: 'interlude-arrival', base: 1, morphStart: null },
  { kind: 'interlude', base: 1, morphStart: null },
  { kind: 'interlude-exit', base: 1, morphStart: null },
  { kind: 'interlude-tail', base: 1, morphStart: 0 },
  { kind: 'chapter', base: 2, morphStart: 0.52 },
  { kind: 'chapter', base: 3, morphStart: null },
  { kind: 'interlude-arrival', base: 3, morphStart: null },
  { kind: 'interlude', base: 3, morphStart: null },
  { kind: 'interlude-exit', base: 3, morphStart: null },
  { kind: 'interlude-tail', base: 3, morphStart: 0 },
  { kind: 'chapter', base: 4, morphStart: null },
  { kind: 'arrival', base: 4, morphStart: 0, linear: true },
  { kind: 'chapter', base: 5, morphStart: null },
];

describe('journeySteps', () => {
  const { shape, ship } = journeySteps(SEGMENTS);
  const trackMix = (s: number): ShapeMix => shapeMixAt(s, SHAPE_TRACK, createShapeMix());
  const shapeAt = (segment: number, fraction: number): number =>
    journeyValue(segment + fraction, shape);

  it('un paso de forma y uno de nave por tramo', () => {
    expect(shape).toHaveLength(SEGMENTS.length);
    expect(ship).toHaveLength(SEGMENTS.length);
  });

  it('las formas: las de `m`, con las dos naves entre medias y el retrato entero al final', () => {
    expect(shape).toEqual([
      { base: 0, morphStart: 0 },
      { base: 1, morphStart: null },
      { base: 1, morphStart: 0, morphEnd: SHIP_ARRIVAL.formed, linear: true },
      { base: 2, morphStart: null },
      { base: 2, morphStart: null },
      { base: 2, morphStart: 0 },
      { base: 3, morphStart: 0.52 },
      { base: 4, morphStart: null },
      { base: 4, morphStart: 0, morphEnd: SHIP_ARRIVAL.formed, linear: true },
      { base: 5, morphStart: null },
      { base: 5, morphStart: null },
      { base: 5, morphStart: 0 },
      { base: 6, morphStart: null },
      { base: 6, morphStart: 0, morphEnd: EPILOGUE_ARRIVAL.morphEnd, linear: true },
      { base: 7, morphStart: null },
    ]);
  });

  it('cada tramo acaba en la forma con la que empieza el siguiente (sin saltos)', () => {
    shape.forEach((step, index) => {
      const next = shape[index + 1];
      if (next !== undefined) expect(stepAt(step, 1)).toBe(next.base);
    });
  });

  it('de la nebulosa al satélite en la llegada (formado en `SHIP_ARRIVAL.formed`) y a la galaxia en la cola', () => {
    expect(trackMix(shapeAt(2, 0))).toEqual({ from: SHAPE.nebula, to: SHAPE.satellite, t: 0 });
    expect(trackMix(shapeAt(2, SHIP_ARRIVAL.formed / 2)).t).toBeCloseTo(0.5);
    expect(trackMix(shapeAt(2, SHIP_ARRIVAL.formed))).toEqual({
      from: SHAPE.satellite,
      to: SHAPE.galaxy,
      t: 0,
    });
    expect(trackMix(shapeAt(3, 0.5))).toEqual({ from: SHAPE.satellite, to: SHAPE.galaxy, t: 0 });
    expect(trackMix(shapeAt(4, 0.9)).t).toBe(0);
    expect(trackMix(shapeAt(5, 0.5))).toEqual({
      from: SHAPE.satellite,
      to: SHAPE.galaxy,
      t: 0.5,
    });
    expect(trackMix(shapeAt(6, 0))).toEqual({ from: SHAPE.galaxy, to: SHAPE.turtle, t: 0 });
  });

  it('Mission control: de la tortuga a la nave nodriza en la llegada, y de ella a la Tierra en la cola', () => {
    expect(trackMix(shapeAt(8, 0))).toEqual({ from: SHAPE.turtle, to: SHAPE.mothership, t: 0 });
    expect(trackMix(shapeAt(8, SHIP_ARRIVAL.formed / 2)).t).toBeCloseTo(0.5);
    expect(trackMix(shapeAt(9, 0.5))).toEqual({ from: SHAPE.mothership, to: SHAPE.earth, t: 0 });
    expect(trackMix(shapeAt(10, 0.5))).toEqual({ from: SHAPE.mothership, to: SHAPE.earth, t: 0 });
    expect(trackMix(shapeAt(11, 0.5))).toEqual({
      from: SHAPE.mothership,
      to: SHAPE.earth,
      t: 0.5,
    });
    expect(trackMix(shapeAt(12, 0))).toEqual({ from: SHAPE.earth, to: SHAPE.portrait, t: 0 });
  });

  it('en el epílogo, el retrato se forma en `morphEnd` y se queda entero', () => {
    const { morphEnd } = EPILOGUE_ARRIVAL;
    const portrait = { from: SHAPE.portrait, to: SHAPE.portrait, t: 0 };
    expect(shapeAt(13, morphEnd / 2)).toBeCloseTo(6.5);
    expect(trackMix(shapeAt(13, morphEnd))).toEqual(portrait);
    expect(trackMix(shapeAt(14, 0.5))).toEqual(portrait);
  });

  it('la nave: 0 → 1 en la llegada, 1 en la pantalla, 1 → 2 en la salida, 2 en la cola (en los dos interludios)', () => {
    expect(ship.slice(8, 12)).toEqual(ship.slice(2, 6));
    expect(ship.slice(2, 6)).toEqual([
      { base: 0, morphStart: 0, linear: true },
      { base: 1, morphStart: null },
      { base: 1, morphStart: 0, linear: true },
      { base: 2, morphStart: null },
    ]);
    expect(journeyValue(3.5, ship)).toBe(1);
    expect(journeyValue(5.5, ship)).toBe(2);
  });

  it('la nave, en línea recta en sus huecos: lo recorrido del tramo es lo que avanza', () => {
    for (const fraction of [0, 0.1, 0.5, 0.9, 1]) {
      expect(journeyValue(2 + fraction, ship)).toBeCloseTo(fraction, 12);
      expect(journeyValue(4 + fraction, ship)).toBeCloseTo(1 + fraction, 12);
    }
  });

  it('fuera de los interludios, la nave en 0', () => {
    for (const index of [0, 1, 6, 7, 12, 13, 14]) {
      expect(ship[index]).toEqual({ base: 0, morphStart: null });
    }
  });

  it('sin tramos, sin pasos', () => {
    expect(journeySteps([])).toEqual({ shape: [], ship: [] });
  });
});

describe('shapeMixAt', () => {
  it('la forma de `floor(s)`, la siguiente y la fracción, en la lista que recibe', () => {
    expect(shapeMixAt(2.25, CHAPTER_SHAPES, createShapeMix())).toEqual({
      from: SHAPE.galaxy,
      to: SHAPE.turtle,
      t: 0.25,
    });
    expect(shapeMixAt(2.25, SHAPE_TRACK, createShapeMix())).toEqual({
      from: SHAPE.satellite,
      to: SHAPE.galaxy,
      t: 0.25,
    });
  });

  it('en una forma entera, quieta en ella (t 0: el shader evalúa una sola)', () => {
    expect(shapeMixAt(1, CHAPTER_SHAPES, createShapeMix())).toEqual({
      from: SHAPE.nebula,
      to: SHAPE.galaxy,
      t: 0,
    });
    // También en la Tierra, aunque la siguiente sea el retrato: con t 0 aún no ha empezado a llegar.
    expect(shapeMixAt(4, CHAPTER_SHAPES, createShapeMix())).toEqual({
      from: SHAPE.earth,
      to: SHAPE.portrait,
      t: 0,
    });
  });

  it('en la última forma, o más allá, quieta en ella', () => {
    const portrait = { from: SHAPE.portrait, to: SHAPE.portrait, t: 0 };
    expect(shapeMixAt(CHAPTER_SHAPES.length - 1, CHAPTER_SHAPES, createShapeMix())).toEqual(
      portrait,
    );
    expect(shapeMixAt(SHAPE_TRACK.length - 1, SHAPE_TRACK, createShapeMix())).toEqual(portrait);
    expect(shapeMixAt(9, SHAPE_TRACK, createShapeMix())).toEqual(portrait);
  });

  it('antes del principio o sin número, en la singularidad', () => {
    expect(shapeMixAt(-3, SHAPE_TRACK, createShapeMix())).toEqual({
      from: SHAPE.singularity,
      to: SHAPE.nebula,
      t: 0,
    });
    expect(shapeMixAt(Number.NaN, SHAPE_TRACK, createShapeMix()).t).toBe(0);
  });

  it('escribe en el objeto que recibe y lo devuelve (sin objetos nuevos por frame)', () => {
    const out = createShapeMix();
    expect(shapeMixAt(3.5, CHAPTER_SHAPES, out)).toBe(out);
    expect(out).toEqual({ from: SHAPE.turtle, to: SHAPE.earth, t: 0.5 });
  });
});
