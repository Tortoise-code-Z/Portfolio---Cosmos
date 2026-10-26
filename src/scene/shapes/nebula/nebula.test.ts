import { describe, expect, it } from 'vitest';

import { mulberry32 } from '../prng/prng';
import type { Vec3 } from '../sampling/sampling';
import { cloudDensity, cloudDistance, cloudPoint, generateNebula, NEBULA } from './nebula';

/** Margen del redondeo a `Float32`. */
const EPS = 1e-4;

function nebula(count: number, rng = mulberry32(21)): Float32Array {
  const out = new Float32Array(count * 3);
  generateNebula(count, rng, out);
  return out;
}

describe('generateNebula', () => {
  const count = 20_000;
  const out = nebula(count);
  const protostarCount = Math.ceil(count * NEBULA.protostarFraction);

  it('the first 7 % are the protostar: a ball of radius ≤ 0.45 or the accretion disk', () => {
    const { ballRadius, diskInnerRadius, diskWidth, diskThickness } = NEBULA.protostar;
    let ball = 0;
    for (let i = 0; i < protostarCount; i++) {
      const [x = 0, y = 0, z = 0] = out.subarray(i * 3, i * 3 + 3);
      const radius = Math.hypot(x, y, z);
      if (radius <= ballRadius + EPS) {
        ball++;
        continue;
      }
      expect(Math.abs(y)).toBeLessThanOrEqual(diskThickness + EPS);
      const flat = Math.hypot(x, z);
      expect(flat).toBeGreaterThanOrEqual(diskInnerRadius - EPS);
      expect(flat).toBeLessThanOrEqual(diskInnerRadius + diskWidth + EPS);
    }
    expect(ball / protostarCount).toBeCloseTo(NEBULA.protostar.ballShare, 1);
  });

  it('the cloud stays inside its ellipsoid and inside its box (which trims the ellipsoid in Y)', () => {
    const [bx, by, bz] = NEBULA.cloud.box;
    for (let i = protostarCount; i < count; i++) {
      const [x = 0, y = 0, z = 0] = out.subarray(i * 3, i * 3 + 3);
      expect(cloudDistance(x, y, z)).toBeLessThanOrEqual(1 + EPS);
      expect(Math.abs(x)).toBeLessThanOrEqual(bx);
      expect(Math.abs(y)).toBeLessThanOrEqual(by);
      expect(Math.abs(z)).toBeLessThanOrEqual(bz);
    }
  });

  it('the noise carves the cloud: the density is not uniform (the octant counts differ)', () => {
    const octants = new Array<number>(8).fill(0);
    for (let i = protostarCount; i < count; i++) {
      const [x = 0, y = 0, z = 0] = out.subarray(i * 3, i * 3 + 3);
      const octant = Number(x > 0) + Number(y > 0) * 2 + Number(z > 0) * 4;
      octants[octant] = (octants[octant] ?? 0) + 1;
    }
    expect(Math.max(...octants) / Math.min(...octants)).toBeGreaterThan(1.2);
  });

  it('no particle sits exactly at the origin (the singularity normalises `position`)', () => {
    for (let i = 0; i < count; i++) {
      expect(Math.hypot(out[i * 3] ?? 0, out[i * 3 + 1] ?? 0, out[i * 3 + 2] ?? 0)).toBeGreaterThan(
        0,
      );
    }
    // Un azar que da 0 pondría la bola en el origen: se aparta lo mínimo.
    const zero = nebula(1, () => 0);
    expect(Math.hypot(zero[0] ?? 0, zero[1] ?? 0, zero[2] ?? 0)).toBeCloseTo(NEBULA.minRadius, 8);
  });

  it('a cloud candidate exactly at the origin is nudged off it', () => {
    let call = 0;
    // Primer candidato: el centro exacto (0,5 en cada eje); después, todo en la esquina (fuera).
    const rng = (): number => (call++ < 3 ? 0.5 : 0.999);
    expect(cloudPoint(rng, [0, 0, 0])).toEqual([NEBULA.minRadius, 0, 0]);
  });

  it('when the attempts run out, it keeps the last candidate that was inside the ellipsoid', () => {
    // Todo el azar a 0,999: la protoestrella va al disco y cada candidato de la nube cae en la esquina de
    // la caja (fuera del elipsoide). Sin ningún candidato dentro, se queda junto al centro.
    const out = nebula(100, () => 0.999);
    const last = out.subarray(99 * 3, 100 * 3);
    expect(cloudDistance(last[0] ?? 0, last[1] ?? 0, last[2] ?? 0)).toBeLessThanOrEqual(1);
    expect([...last]).toEqual([expect.closeTo(NEBULA.minRadius, 8), 0, 0]);
  });

  it('a candidate inside that never passes the threshold is the one kept, not a later one outside', () => {
    const { box, thresholdMin, thresholdRange, maxAttempts } = NEBULA.cloud;
    // Un punto de dentro con poca densidad: ni con el umbral más bajo pasaría… con el azar del umbral alto.
    const candidate: Vec3 = [box[0] * 0.8, 0, 0];
    expect(cloudDistance(...candidate)).toBeLessThan(1);
    expect(cloudDensity(...candidate)).toBeLessThan(thresholdMin + 0.999 * thresholdRange);
    const toRandom = (value: number, half: number): number => (value / half + 1) / 2;
    // Intento 1: el candidato y un umbral alto (no pasa); los 79 siguientes, en la esquina (fuera).
    const script = [
      toRandom(candidate[0], box[0]),
      toRandom(candidate[1], box[1]),
      toRandom(candidate[2], box[2]),
      0.999,
    ];
    let call = 0;
    const rng = (): number => script[call++] ?? 0.999;
    const out = cloudPoint(rng, [0, 0, 0]);
    expect(out[0]).toBeCloseTo(candidate[0], 9);
    expect(out[1]).toBeCloseTo(0, 9);
    expect(out[2]).toBeCloseTo(0, 9);
    expect(call).toBe(script.length + (maxAttempts - 1) * 3);
  });
});
