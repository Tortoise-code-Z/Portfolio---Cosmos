import { describe, expect, it } from 'vitest';

import { mapM, type ChapterLayout, type JourneyStep } from '../mapM/mapM';
import { journeyPosition, journeyValue } from './journeyPosition';

// Cuatro tramos; el tercero mide 0 (un hueco de nave con movimiento reducido).
const LAYOUT: ChapterLayout = [
  { top: 0, height: 1000 },
  { top: 1000, height: 500 },
  { top: 1500, height: 0 },
  { top: 1500, height: 2000 },
];

describe('journeyPosition', () => {
  it('el tramo y lo recorrido de él, en línea recta', () => {
    expect(journeyPosition(0, LAYOUT)).toBe(0);
    expect(journeyPosition(250, LAYOUT)).toBe(0.25);
    expect(journeyPosition(1000, LAYOUT)).toBe(1);
    expect(journeyPosition(1250, LAYOUT)).toBe(1.5);
    expect(journeyPosition(2500, LAYOUT)).toBe(3.5);
  });

  it('un tramo que mide 0 se salta: del anterior se pasa al siguiente', () => {
    expect(journeyPosition(1498, LAYOUT)).toBeCloseTo(1.996);
    expect(journeyPosition(1500, LAYOUT)).toBe(3);
  });

  it('antes del principio, 0; más allá del último, su final', () => {
    expect(journeyPosition(-80, LAYOUT)).toBe(0);
    expect(journeyPosition(9000, LAYOUT)).toBe(4);
  });

  it('el píxel de margen del ancla cuenta como el principio del tramo siguiente', () => {
    // `segmentAt` da el tramo 1 un píxel antes de su `top` (el redondeo del ancla): lo recorrido no baja de 0.
    expect(journeyPosition(999.5, LAYOUT)).toBe(1);
  });

  it('no retrocede al bajar', () => {
    let last = -1;
    for (let y = -100; y <= 4000; y += 10) {
      const j = journeyPosition(y, LAYOUT);
      expect(j).toBeGreaterThanOrEqual(last);
      last = j;
    }
  });

  it('sin tramos, 0', () => {
    expect(journeyPosition(300, [])).toBe(0);
  });
});

const STEPS: readonly JourneyStep[] = [
  { base: 0, morphStart: 0 },
  { base: 1, morphStart: 0, morphEnd: 0.5, linear: true },
  { base: 2, morphStart: null },
  { base: 2, morphStart: 0.5 },
];

describe('journeyValue', () => {
  it('lo de cada tramo a su fracción (`stepAt`)', () => {
    expect(journeyValue(0, STEPS)).toBe(0);
    expect(journeyValue(0.5, STEPS)).toBe(0.5);
    expect(journeyValue(1.25, STEPS)).toBe(1.5);
    expect(journeyValue(1.5, STEPS)).toBe(2);
    expect(journeyValue(1.9, STEPS)).toBe(2);
    expect(journeyValue(2.5, STEPS)).toBe(2);
  });

  it('el último tramo se queda en su `base`, también más allá (como `mapM`)', () => {
    expect(journeyValue(3, STEPS)).toBe(2);
    expect(journeyValue(3.9, STEPS)).toBe(2);
    expect(journeyValue(4, STEPS)).toBe(2);
    expect(journeyValue(99, STEPS)).toBe(2);
  });

  it('antes del principio o sin número, el principio', () => {
    expect(journeyValue(-2, STEPS)).toBe(0);
    expect(journeyValue(Number.NaN, STEPS)).toBe(0);
  });

  it('sin pasos, 0', () => {
    expect(journeyValue(1.5, [])).toBe(0);
  });

  it('con los pasos de `m`, la misma cifra que `mapM` en cada píxel', () => {
    const layout: ChapterLayout = [
      { top: 0, height: 1000 },
      { top: 1000, height: 800 },
      { top: 1800, height: 600 },
      { top: 2400, height: 1000 },
    ];
    for (let y = 0; y <= 3400; y += 37) {
      expect(journeyValue(journeyPosition(y, layout), STEPS)).toBeCloseTo(
        mapM(y, layout, STEPS),
        12,
      );
    }
  });
});
