/**
 * Amortiguado exponencial (docs/02-experiencia/scroll-y-escena.md → «Suavizado»): `current` persigue a `target`
 * y avanza `min(1, dt · rate)` de lo que le falta. Casi independiente de los fps (usa el tiempo del frame, `dt`, en
 * segundos); nunca se pasa del objetivo, con `dt ≤ 0` o `rate ≤ 0` no se mueve y, si se queda a menos de
 * `epsilon`, se iguala para llegar exacta al objetivo.
 */
export function damp(
  current: number,
  target: number,
  dt: number,
  rate: number,
  epsilon = 0,
): number {
  // Con `dt` o `rate` que no son positivos (también `NaN`), el factor es 0; así `0 · ∞` nunca llega a la cuenta.
  const factor = dt > 0 && rate > 0 ? Math.min(1, dt * rate) : 0;
  const next = current + (target - current) * factor;
  return Math.abs(target - next) < epsilon ? target : next;
}
