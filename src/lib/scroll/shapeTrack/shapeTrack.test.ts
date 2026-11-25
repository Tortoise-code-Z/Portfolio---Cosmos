import { describe, expect, it } from 'vitest';

import { EPILOGUE_ARRIVAL } from '../arrival/arrival';
import {
  createShapeMix,
  SHAPE,
  SHAPE_TRACK,
  SHAPE_TRACK_END,
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
    expect(SHAPE_TRACK_END).toBeCloseTo(SHAPE_TRACK.length - 2 + 0.999, 9);
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
  });

  it('donde se para la escena, el último cambio casi entero: de la Tierra al retrato', () => {
    const mix = shapeMixAt(SHAPE_TRACK_END, createShapeMix());
    expect(mix.from).toBe(SHAPE.earth);
    expect(mix.to).toBe(SHAPE.portrait);
    expect(mix.t).toBeCloseTo(0.999, 9);
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
