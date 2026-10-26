import { describe, expect, it } from 'vitest';

import { mulberry32 } from '../prng/prng';
import { GALAXY, generateGalaxy } from './galaxy';

const EPS = 1e-4;

describe('generateGalaxy', () => {
  const count = 20_000;
  const out = new Float32Array(count * 3);
  generateGalaxy(count, mulberry32(31), out);
  const { bulge, arms } = GALAXY;

  /** La caja que sale de las fórmulas: radio de los brazos más la dispersión máxima. */
  const maxArmRadius = arms.reach + arms.minRadius;
  const maxSpread = arms.scatterBase + maxArmRadius * arms.scatterSlope;
  const maxFlat = Math.max(maxArmRadius + Math.SQRT2 * maxSpread, bulge.radius);
  const maxThickness = Math.max(
    ...Array.from({ length: 801 }, (_, k) => {
      const radius = arms.minRadius + (k / 800) * arms.reach;
      return (
        (arms.scatterBase + radius * arms.scatterSlope) *
        arms.thicknessScale *
        (arms.thicknessOffset - radius / arms.reach)
      );
    }),
    bulge.radius * bulge.flattenY,
  );

  it('stays within the box its formulas allow', () => {
    for (let i = 0; i < count; i++) {
      const x = out[i * 3] ?? 0;
      const y = out[i * 3 + 1] ?? 0;
      const z = out[i * 3 + 2] ?? 0;
      expect(Math.hypot(x, z)).toBeLessThanOrEqual(maxFlat + EPS);
      expect(Math.abs(y)).toBeLessThanOrEqual(maxThickness + EPS);
    }
  });

  it('is a flat disc: much wider than it is thick', () => {
    let flat = 0;
    let thick = 0;
    for (let i = 0; i < count; i++) {
      flat += Math.hypot(out[i * 3] ?? 0, out[i * 3 + 2] ?? 0);
      thick += Math.abs(out[i * 3 + 1] ?? 0);
    }
    expect(flat / thick).toBeGreaterThan(10);
  });

  it("15 % in the bulge (about half of it within the arms' inner radius) and three arms by index", () => {
    let inBulge = 0;
    for (let i = 0; i < count; i++) {
      if (Math.hypot(out[i * 3] ?? 0, out[i * 3 + 1] ?? 0, out[i * 3 + 2] ?? 0) < arms.minRadius) {
        inBulge++;
      }
    }
    // Dentro del radio mínimo de los brazos solo cae bulbo (y algún desvío): con su reparto (`rng^1,8`) y su
    // achatado, ~54 % del bulbo, es decir ~8 % del total (medido: 7,7–8,1 % con varias semillas). La franja
    // 7–9 % solo admite un bulbo de entre ~13 % y ~17 %.
    expect(inBulge / count).toBeGreaterThan(0.07);
    expect(inBulge / count).toBeLessThan(0.09);
    expect(GALAXY.bulgeShare).toBe(0.15);
    // Cada brazo arranca en su ángulo: las partículas de brazo cerca del centro se agrupan en tres.
    const angles = [0, 1, 2].map((arm) => {
      let sx = 0;
      let sz = 0;
      for (let i = arm; i < count; i += 3) {
        const x = out[i * 3] ?? 0;
        const z = out[i * 3 + 2] ?? 0;
        const radius = Math.hypot(x, z);
        if (radius < 1 || radius > 1.6) continue;
        sx += x / radius;
        sz += z / radius;
      }
      return Math.atan2(sz, sx);
    });
    const gap = (a: number, b: number): number => {
      const d = Math.abs(a - b) % (2 * Math.PI);
      return Math.min(d, 2 * Math.PI - d);
    };
    expect(gap(angles[0] ?? 0, angles[1] ?? 0)).toBeCloseTo((2 * Math.PI) / 3, 0);
    expect(gap(angles[1] ?? 0, angles[2] ?? 0)).toBeCloseTo((2 * Math.PI) / 3, 0);
  });
});
