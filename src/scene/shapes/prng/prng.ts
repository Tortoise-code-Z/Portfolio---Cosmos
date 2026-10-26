/**
 * Azar con semilla para la escena (docs/04-escena/formas.md → «Utilidades compartidas», ADR-011): sustituye a
 * `Math.random` (prohibido en `src/scene/**` por ESLint) para que cada visita genere el mismo universo.
 */

/** Un generador: cada llamada da un número en [0, 1). */
export type Rng = () => number;

const UINT32 = 0x1_0000_0000;

/** `mulberry32`: rápido, 32 bits de estado, suficiente para repartir partículas. */
export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / UINT32;
  };
}

/**
 * Semilla propia de una parte (`'nebula'`, `'galaxy'`…) a partir de la del proyecto: FNV-1a del nombre sobre
 * la semilla y un mezclado final (el de MurmurHash3). Cada forma consume su propio flujo, así que retocar una
 * no mueve las demás.
 */
export function subSeed(seed: number, name: string): number {
  let hash = (0x811c9dc5 ^ seed) >>> 0;
  for (let i = 0; i < name.length; i++) {
    hash = Math.imul(hash ^ name.charCodeAt(i), 0x01000193) >>> 0;
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return hash >>> 0;
}
