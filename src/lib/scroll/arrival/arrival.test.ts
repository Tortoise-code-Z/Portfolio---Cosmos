import { describe, expect, it } from 'vitest';

import { arrivalProgress, arrivalShapeM, EPILOGUE_ARRIVAL } from './arrival';

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

describe('EPILOGUE_ARRIVAL', () => {
  it('el haz baja después de que empiece a formarse el retrato y acaba después de que esté formado', () => {
    const [start, end] = EPILOGUE_ARRIVAL.beam;
    expect(start).toBeGreaterThan(0);
    expect(end).toBeGreaterThan(EPILOGUE_ARRIVAL.morphEnd);
    expect(end).toBeLessThan(1);
  });

  it('la línea del haz acaba algo más allá del borde de abajo de la ventana, no lejos', () => {
    expect(EPILOGUE_ARRIVAL.beamReach).toBeGreaterThan(1);
    expect(EPILOGUE_ARRIVAL.beamReach).toBeLessThan(1.1);
  });
});
