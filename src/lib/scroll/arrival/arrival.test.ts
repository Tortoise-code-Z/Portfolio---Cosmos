import { describe, expect, it } from 'vitest';

import { arrivalBeam, arrivalProgress, arrivalShapeM, EPILOGUE_ARRIVAL } from './arrival';

describe('arrivalProgress', () => {
  it('0 antes de la llegada, lo que lleva dentro y 1 desde el epílogo', () => {
    expect(arrivalProgress(3.2)).toBe(0);
    expect(arrivalProgress(4)).toBe(0);
    expect(arrivalProgress(4.25)).toBeCloseTo(0.25);
    expect(arrivalProgress(5)).toBe(1);
    expect(arrivalProgress(7)).toBe(1);
  });

  it('una `m` que no es un número no lleva nada', () => {
    expect(arrivalProgress(Number.NaN)).toBe(0);
  });
});

describe('arrivalShapeM', () => {
  it('fuera de la llegada no cambia', () => {
    expect(arrivalShapeM(0)).toBe(0);
    expect(arrivalShapeM(2.4)).toBe(2.4);
    expect(arrivalShapeM(4)).toBe(4);
  });

  it('el retrato está formado en `morphEnd` y se queda así hasta el final', () => {
    const { base, morphEnd } = EPILOGUE_ARRIVAL;
    expect(arrivalShapeM(base + morphEnd / 2)).toBeCloseTo(base + 0.5);
    expect(arrivalShapeM(base + morphEnd)).toBeCloseTo(base + 1);
    expect(arrivalShapeM(base + 0.9)).toBe(base + 1);
    expect(arrivalShapeM(base + 1)).toBe(base + 1);
  });

  it('una `m` que no es un número sigue sin serlo (quien la usa ya la acota)', () => {
    expect(arrivalShapeM(Number.NaN)).toBeNaN();
  });
});

describe('arrivalBeam', () => {
  it('arriba hasta que empieza, abajo desde que acaba y lineal entre medias', () => {
    const [start, end] = EPILOGUE_ARRIVAL.beam;
    expect(arrivalBeam(0)).toBe(0);
    expect(arrivalBeam(start)).toBe(0);
    expect(arrivalBeam((start + end) / 2)).toBeCloseTo(0.5);
    expect(arrivalBeam(end)).toBe(1);
    expect(arrivalBeam(1)).toBe(1);
  });

  it('el haz baja después de que empiece a formarse el retrato y acaba después de que esté formado', () => {
    const [start, end] = EPILOGUE_ARRIVAL.beam;
    expect(start).toBeGreaterThan(0);
    expect(end).toBeGreaterThan(EPILOGUE_ARRIVAL.morphEnd);
    expect(end).toBeLessThan(1);
  });
});
