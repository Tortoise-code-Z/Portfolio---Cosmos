import { clamp } from '../clamp/clamp';

/**
 * Curva suave de 0 a 1 entre `edge0` y `edge1` (la de GLSL): 0 antes, 1 después y sin tirón en los
 * bordes. Con los dos bordes iguales es un escalón.
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}
