import type { Rng } from '../prng/prng';

/**
 * Muestreo de los generadores (docs/04-escena/formas.md → «Utilidades compartidas»). Sin objetos nuevos por
 * llamada: la dirección se escribe en un vector que reutiliza quien la pide.
 */

/** Vector de trabajo que se reutiliza (x, y, z). */
export type Vec3 = [number, number, number];

export const TAU = Math.PI * 2;

/** Dirección uniforme en la esfera unidad, escrita en `out` (consume dos números: altura y ángulo). */
export function randomDirection(rng: Rng, out: Vec3): Vec3 {
  const height = rng() * 2 - 1;
  const angle = rng() * TAU;
  const ring = Math.sqrt(1 - height * height);
  out[0] = ring * Math.cos(angle);
  out[1] = height;
  out[2] = ring * Math.sin(angle);
  return out;
}

/**
 * Campana estrecha del prototipo: suma de 4 uniformes centrada, **acotada en [−1, 1]** y con desviación
 * típica ≈ 0,29 (no 1). Las escalas de `formas.md` («espesor gaussiano 0,06») son con esta campana: el
 * resultado nunca pasa de ±escala, y las cajas límite de los tests salen exactas.
 */
export function boundedGauss(rng: Rng): number {
  return (rng() + rng() + rng() + rng() - 2) / 2;
}
