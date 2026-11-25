import { describe, expect, it } from 'vitest';

import { EPILOGUE_ARRIVAL } from '../arrival/arrival';
import { arrivalBeam, arrivalBeamLine } from './arrivalChoreography';

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
