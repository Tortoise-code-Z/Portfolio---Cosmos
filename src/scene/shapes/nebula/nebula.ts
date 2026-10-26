import { fbm } from '../noise/noise';
import type { Rng } from '../prng/prng';
import { boundedGauss, randomDirection, TAU, type Vec3 } from '../sampling/sampling';

/**
 * Forma 1 · Nebulosa (docs/04-escena/formas.md): una protoestrella con su disco de acreción y una nube tallada
 * por el ruido. Va en `position` (Three exige uno) y de ella se deriva también la singularidad (forma 0, en
 * el shader): por eso ninguna partícula cae en el origen exacto.
 */
export const NEBULA = {
  /** Las primeras partículas (por índice) son la protoestrella; el resto, la nube. */
  protostarFraction: 0.07,
  protostar: {
    /** Parte de la protoestrella que es la bola central; el resto, el disco. */
    ballShare: 0.4,
    /** Radio máximo de la bola, concentrada en el centro (`rng²`). */
    ballRadius: 0.45,
    diskInnerRadius: 0.6,
    diskWidth: 1.3,
    /** Espesor del disco, con la campana acotada (`boundedGauss`). */
    diskThickness: 0.06,
  },
  cloud: {
    /** Semiejes de la caja donde se prueba (y del elipsoide, redondeados por arriba). */
    box: [7.5, 4.4, 5.2],
    /** Semiejes al cuadrado del elipsoide: dentro si `x²/a + y²/b + z²/c ≤ 1`. */
    ellipsoidSq: [56, 19.4, 27],
    noiseScale: 0.42,
    /** El pico de densidad no cae en el centro: el ruido se desplaza (como el prototipo). */
    noiseOffset: [1.3, 0, -0.7],
    noiseWeight: 0.95,
    /** Lo que suma estar cerca del centro (`(1 − d) · peso`). */
    centreWeight: 0.5,
    /** Umbral de aceptación: `mínimo + rng · margen`. */
    thresholdMin: 0.3,
    thresholdRange: 0.28,
    maxAttempts: 80,
  },
  /**
   * Lo mínimo que se aparta del origen una partícula que caería en él: la singularidad normaliza
   * `position`, y el vector cero no tiene dirección.
   */
  minRadius: 1e-4,
} as const;

/** Distancia elíptica normalizada de la nube: ≤ 1 dentro del elipsoide. */
export function cloudDistance(x: number, y: number, z: number): number {
  const [a, b, c] = NEBULA.cloud.ellipsoidSq;
  return Math.sqrt((x * x) / a + (y * y) / b + (z * z) / c);
}

/** Densidad de la nube en un punto: el ruido (desplazado) más la cercanía al centro. */
export function cloudDensity(x: number, y: number, z: number): number {
  const { noiseScale, noiseOffset, noiseWeight, centreWeight } = NEBULA.cloud;
  const [ox, oy, oz] = noiseOffset;
  const noise = fbm(x * noiseScale + ox, y * noiseScale + oy, z * noiseScale + oz);
  return noise * noiseWeight + (1 - cloudDistance(x, y, z)) * centreWeight;
}

/**
 * Un punto de la nube, escrito en `out`: muestreo con rechazo en la caja, se acepta donde hay densidad. Si se
 * agotan los intentos, el último candidato que cayó dentro del elipsoide; si no cayó ninguno
 * (probabilidad ~1e-26), junto al centro.
 */
export function cloudPoint(rng: Rng, out: Vec3): Vec3 {
  const { box, thresholdMin, thresholdRange, maxAttempts } = NEBULA.cloud;
  const [bx, by, bz] = box;
  out[0] = NEBULA.minRadius;
  out[1] = 0;
  out[2] = 0;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const x = (rng() * 2 - 1) * bx;
    const y = (rng() * 2 - 1) * by;
    const z = (rng() * 2 - 1) * bz;
    if (cloudDistance(x, y, z) > 1) continue;
    out[0] = x;
    out[1] = y;
    out[2] = z;
    if (cloudDensity(x, y, z) > thresholdMin + rng() * thresholdRange) break;
  }
  if (out[0] === 0 && out[1] === 0 && out[2] === 0) out[0] = NEBULA.minRadius;
  return out;
}

/** Escribe `count` posiciones (x, y, z) en `out`. */
export function generateNebula(count: number, rng: Rng, out: Float32Array): void {
  const { protostar, minRadius } = NEBULA;
  const protostarCount = count * NEBULA.protostarFraction;
  const direction: Vec3 = [0, 0, 0];
  for (let i = 0; i < count; i++) {
    let x: number;
    let y: number;
    let z: number;
    if (i < protostarCount) {
      if (rng() < protostar.ballShare) {
        randomDirection(rng, direction);
        const radius = Math.max(rng() ** 2 * protostar.ballRadius, minRadius);
        x = direction[0] * radius;
        y = direction[1] * radius;
        z = direction[2] * radius;
      } else {
        const angle = rng() * TAU;
        const radius = protostar.diskInnerRadius + rng() * protostar.diskWidth;
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius;
        y = boundedGauss(rng) * protostar.diskThickness;
      }
    } else {
      cloudPoint(rng, direction);
      [x, y, z] = direction;
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
}
