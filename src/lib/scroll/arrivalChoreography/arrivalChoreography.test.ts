import { describe, expect, it } from 'vitest';

import { EPILOGUE_ARRIVAL } from '../arrival/arrival';
import {
  ARRIVAL_CHOREOGRAPHY,
  arrivalBeam,
  arrivalBeamLine,
  arrivalCorners,
  arrivalCornersShow,
  arrivalGuides,
  arrivalLocked,
} from './arrivalChoreography';

describe('arrivalBeam', () => {
  it('arriba hasta que empieza, abajo desde que acaba y lineal entre medias', () => {
    expect(arrivalBeam(0)).toBe(0);
    expect(arrivalBeam(0.05)).toBe(0);
    expect(arrivalBeam(0.375)).toBeCloseTo(0.5);
    expect(arrivalBeam(0.7)).toBe(1);
    expect(arrivalBeam(1)).toBe(1);
  });

  it('usa los cortes de la llegada (los mismos que el shader)', () => {
    const [start, end] = EPILOGUE_ARRIVAL.beam;
    expect(arrivalBeam(start)).toBe(0);
    expect(arrivalBeam(end)).toBe(1);
  });
});

describe('arrivalBeamLine', () => {
  it('va de arriba de la ventana a algo más allá de su borde de abajo', () => {
    expect(arrivalBeamLine(0)).toBe(0);
    expect(arrivalBeamLine(0.375)).toBeCloseTo(0.5125);
    expect(arrivalBeamLine(1)).toBeCloseTo(1.025);
  });
});

describe('arrivalCornersShow', () => {
  it('aparecen al empezar la llegada, en línea recta', () => {
    expect(arrivalCornersShow(0)).toBe(0);
    expect(arrivalCornersShow(0.08)).toBe(0);
    expect(arrivalCornersShow(0.14)).toBeCloseTo(0.5);
    expect(arrivalCornersShow(0.2)).toBe(1);
    expect(arrivalCornersShow(1)).toBe(1);
  });
});

describe('arrivalCorners', () => {
  it('en las de la ventana hasta 0,15, en el destino desde 0,75 y con curva suave entre medias', () => {
    expect(arrivalCorners(0)).toBe(0);
    expect(arrivalCorners(0.15)).toBe(0);
    expect(arrivalCorners(0.45)).toBeCloseTo(0.5);
    // La curva: al principio avanza menos que en línea recta.
    expect(arrivalCorners(0.21)).toBeLessThan(0.1);
    expect(arrivalCorners(0.75)).toBe(1);
    expect(arrivalCorners(1)).toBe(1);
  });

  it('acaban de cerrarse antes del encaje', () => {
    expect(arrivalCorners(ARRIVAL_CHOREOGRAPHY.lock)).toBe(1);
  });
});

describe('arrivalLocked', () => {
  it('encaja en 0,78 y sigue encajado hasta el final', () => {
    expect(arrivalLocked(0)).toBe(false);
    expect(arrivalLocked(0.7799)).toBe(false);
    expect(arrivalLocked(0.78)).toBe(true);
    expect(arrivalLocked(1)).toBe(true);
  });
});

describe('arrivalGuides', () => {
  it('salen al encajar y acaban en 0,92', () => {
    expect(arrivalGuides(0.5)).toBe(0);
    expect(arrivalGuides(ARRIVAL_CHOREOGRAPHY.lock)).toBe(0);
    expect(arrivalGuides(0.85)).toBeCloseTo(0.5);
    expect(arrivalGuides(0.92)).toBe(1);
    expect(arrivalGuides(1)).toBe(1);
  });
});

describe('ARRIVAL_CHOREOGRAPHY', () => {
  it('va en orden: las esquinas aparecen, se cierran y encajan antes de las líneas guía', () => {
    const { cornersShow, corners, lock, guides } = ARRIVAL_CHOREOGRAPHY;
    expect(cornersShow[0]).toBeLessThan(corners[0]);
    expect(corners[1]).toBeLessThanOrEqual(lock);
    expect(guides[0]).toBe(lock);
    expect(guides[1]).toBeLessThanOrEqual(1);
  });
});
