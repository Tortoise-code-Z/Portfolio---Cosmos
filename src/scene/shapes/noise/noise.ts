/**
 * Ruido barato de la escena (docs/04-escena/formas.md → «Utilidades compartidas»): suma de senos anidados, sin
 * tablas ni gradientes. Lo usan los generadores (nube de la nebulosa, continentes y nubes de la Tierra). No
 * tiene que coincidir con el GLSL: la tierra y las placas viajan ya calculadas en `aR` (el shader no las
 * recalcula).
 */

const N3 = {
  /** Cada término: frecuencias del seno exterior y del interior, y amplitud de la torsión. */
  x: { outer: 1.7, innerY: 1.3, innerZ: 0.7, twist: 1.5 },
  y: { outer: 2.1, innerZ: 1.9, innerX: 0.5, twist: 1.2 },
  z: { outer: 1.5, innerX: 2.3, innerY: 0.9, twist: 1.4 },
} as const;

/** Ruido de una octava, en [−1, 1]. */
export function n3(x: number, y: number, z: number): number {
  const a = Math.sin(x * N3.x.outer + Math.sin(y * N3.x.innerY + z * N3.x.innerZ) * N3.x.twist);
  const b = Math.sin(y * N3.y.outer + Math.sin(z * N3.y.innerZ + x * N3.y.innerX) * N3.y.twist);
  const c = Math.sin(z * N3.z.outer + Math.sin(x * N3.z.innerX + y * N3.z.innerY) * N3.z.twist);
  return (a + b + c) / 3;
}

/** Octavas del `fbm`: escala de la frecuencia y peso de cada una. */
const FBM_OCTAVES = [
  { frequency: 1, weight: 1 },
  { frequency: 2.03, weight: 0.5 },
  { frequency: 4.1, weight: 0.25 },
] as const;
const FBM_TOTAL_WEIGHT = 1.75;

/** Tres octavas de `n3`, normalizadas: en [−1, 1]. */
export function fbm(x: number, y: number, z: number): number {
  let sum = 0;
  for (const { frequency, weight } of FBM_OCTAVES) {
    sum += weight * n3(x * frequency, y * frequency, z * frequency);
  }
  return sum / FBM_TOTAL_WEIGHT;
}
