/**
 * Amortiguado exponencial (docs/02-experiencia/scroll-y-escena.md → «Suavizado»): `current` persigue a `target`
 * y avanza `min(1, dt · rate)` de lo que le falta. Depende del tiempo del frame (`dt`, en segundos), no de los
 * fps; nunca se pasa del objetivo, con `dt ≤ 0` no se mueve y, si se queda a menos de `epsilon`, llega (para no
 * recalcular sin fin).
 */
export function damp(
  current: number,
  target: number,
  dt: number,
  rate: number,
  epsilon = 0,
): number {
  const next = current + (target - current) * Math.min(1, Math.max(dt, 0) * rate);
  return Math.abs(target - next) < epsilon ? target : next;
}
