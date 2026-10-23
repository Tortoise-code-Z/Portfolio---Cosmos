/** Punto entre `a` y `b`: `t = 0` es `a` y `t = 1` es `b` (sin limitar `t`). */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
