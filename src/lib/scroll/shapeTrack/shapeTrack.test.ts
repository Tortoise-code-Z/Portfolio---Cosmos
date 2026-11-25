import { describe, expect, it } from 'vitest';

import { EPILOGUE_ARRIVAL } from '../arrival/arrival';
import {
  createShapeMix,
  SHAPE,
  SHAPE_TRACK,
  SHAPE_TRACK_END,
  SHAPE_TRACK_REST,
  shapeMixAt,
  shapePosition,
} from './shapeTrack';

describe('SHAPE', () => {
  it('un id distinto por forma, de 0 a 7 sin huecos', () => {
    const ids = Object.values(SHAPE).sort((a, b) => a - b);
    expect(ids).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});

describe('SHAPE_TRACK', () => {
  it('empieza en la singularidad, acaba en el retrato y no repite forma', () => {
    expect(SHAPE_TRACK[0]).toBe(SHAPE.singularity);
    expect(SHAPE_TRACK.at(-1)).toBe(SHAPE.portrait);
    expect(new Set(SHAPE_TRACK).size).toBe(SHAPE_TRACK.length);
  });

  it('se para justo antes de la última forma (el último cambio, casi entero)', () => {
    expect(Math.floor(SHAPE_TRACK_END)).toBe(SHAPE_TRACK.length - 2);
    expect(SHAPE_TRACK_END - Math.floor(SHAPE_TRACK_END)).toBeCloseTo(SHAPE_TRACK_REST, 9);
    expect(SHAPE_TRACK_REST).toBeGreaterThan(0.99);
    expect(SHAPE_TRACK_REST).toBeLessThan(1);
  });

  it('donde se para, la forma siguiente es la última (el respaldo de `to` no hace falta en la escena)', () => {
    expect(SHAPE_TRACK[Math.floor(SHAPE_TRACK_END) + 1]).toBe(SHAPE_TRACK.at(-1));
  });
});

describe('shapePosition', () => {
  it('fuera de la llegada del epílogo es la `m` de la escena', () => {
    expect(shapePosition(0)).toBe(0);
    expect(shapePosition(1)).toBe(1);
    expect(shapePosition(2.4)).toBe(2.4);
    expect(shapePosition(EPILOGUE_ARRIVAL.base)).toBe(EPILOGUE_ARRIVAL.base);
  });

  it('en la llegada, la de la forma: el retrato, formado en `morphEnd`', () => {
    const { base, morphEnd } = EPILOGUE_ARRIVAL;
    expect(shapePosition(base + morphEnd / 2)).toBeCloseTo(base + 0.5);
    expect(shapePosition(base + morphEnd)).toBe(SHAPE_TRACK_END);
    expect(shapePosition(base + 1)).toBe(SHAPE_TRACK_END);
  });

  it('acotada al recorrido, y al principio si no es un número', () => {
    expect(shapePosition(-1)).toBe(0);
    expect(shapePosition(9)).toBe(SHAPE_TRACK_END);
    expect(shapePosition(Number.NaN)).toBe(0);
    expect(shapePosition(Number.NEGATIVE_INFINITY)).toBe(0);
    expect(shapePosition(Number.POSITIVE_INFINITY)).toBe(SHAPE_TRACK_END);
  });
});

/**
 * La cuenta que hacía el shader antes del mapa de formas (ADR-041), escrita en TS: `m` acotada a 4,999, remapeada en la
 * llegada del epílogo con `morphEnd`, y las formas de `floor(m)` y la siguiente (`shape(5)` era el retrato). El mapa
 * de formas tiene que dar lo mismo en cualquier `m`, también a mitad de un cambio (las fotos fijas solo miran los
 * reposos).
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

describe('el mapa de formas frente a la cuenta vieja del shader', () => {
  const { base, morphEnd } = EPILOGUE_ARRIVAL;
  const cases = [
    -1,
    0,
    0.3,
    1,
    2.5,
    3.999,
    4,
    4.1,
    base + morphEnd / 2,
    base + morphEnd * 0.999,
    base + morphEnd,
    4.8,
    5,
    6,
    Number.NEGATIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  ];

  it.each(cases)('m = %s: las mismas formas y la misma fracción', (m) => {
    const old = oldShapeMix(m);
    const mix = shapeMixAt(shapePosition(m), createShapeMix());
    expect(mix.from).toBe(old.from);
    expect(mix.to).toBe(old.to);
    expect(mix.t).toBeCloseTo(old.t, 9);
  });
});

describe('shapeMixAt', () => {
  it('la forma de `floor(s)`, la siguiente y la fracción', () => {
    const mix = shapeMixAt(2.25, createShapeMix());
    expect(mix).toEqual({ from: SHAPE.galaxy, to: SHAPE.turtle, t: 0.25 });
  });

  it('en una forma entera, quieta en ella (t 0: el shader evalúa una sola)', () => {
    expect(shapeMixAt(1, createShapeMix())).toEqual({
      from: SHAPE.nebula,
      to: SHAPE.galaxy,
      t: 0,
    });
    // También en la Tierra, aunque la siguiente sea el retrato: con t 0 aún no ha empezado a llegar.
    expect(shapeMixAt(4, createShapeMix())).toEqual({
      from: SHAPE.earth,
      to: SHAPE.portrait,
      t: 0,
    });
  });

  it('donde se para la escena, el último cambio casi entero: de la Tierra al retrato', () => {
    const mix = shapeMixAt(SHAPE_TRACK_END, createShapeMix());
    expect(mix.from).toBe(SHAPE.earth);
    expect(mix.to).toBe(SHAPE.portrait);
    expect(mix.t).toBeCloseTo(SHAPE_TRACK_REST, 9);
  });

  it('en la última forma, o más allá, quieta en ella (la escena no llega: `shapePosition` se para antes)', () => {
    const portrait = { from: SHAPE.portrait, to: SHAPE.portrait, t: 0 };
    expect(shapeMixAt(SHAPE_TRACK.length - 1, createShapeMix())).toEqual(portrait);
    expect(shapeMixAt(7, createShapeMix())).toEqual(portrait);
  });

  it('antes del principio o sin número, en la singularidad', () => {
    expect(shapeMixAt(-3, createShapeMix())).toEqual({
      from: SHAPE.singularity,
      to: SHAPE.nebula,
      t: 0,
    });
    expect(shapeMixAt(Number.NaN, createShapeMix()).t).toBe(0);
  });

  it('escribe en el objeto que recibe y lo devuelve (sin objetos nuevos por frame)', () => {
    const out = createShapeMix();
    expect(shapeMixAt(3.5, out)).toBe(out);
    expect(out).toEqual({ from: SHAPE.turtle, to: SHAPE.earth, t: 0.5 });
  });
});
