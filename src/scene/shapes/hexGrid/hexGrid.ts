/**
 * Rejilla hexagonal *pointy-top* del caparazón (docs/04-escena/formas.md → «Forma 3»), en el plano XZ y con
 * coordenadas axiales `q, r` (las de `config/plateSlots`). `size` es la distancia del centro a un vértice.
 */

const SQRT3 = Math.sqrt(3);
/** Radio interior (centro a lado) de un hexágono de tamaño 1. */
export const HEX_INNER_RATIO = SQRT3 / 2;

/** Normales de los tres pares de lados de un hexágono *pointy-top*. */
const SIDE_NORMALS = [
  [1, 0],
  [0.5, HEX_INNER_RATIO],
  [0.5, -HEX_INNER_RATIO],
] as const;

/** Celda de trabajo que se reutiliza entre llamadas. */
export interface HexCell {
  q: number;
  r: number;
  /** Distancia «hexagonal» al centro, relativa al radio interior: 0 en el centro, 1 en el borde. */
  h: number;
}

/** Centro de la celda `(q, r)` en el plano XZ. */
export function hexCenterX(q: number, r: number, size: number): number {
  return size * SQRT3 * (q + r / 2);
}
export function hexCenterZ(r: number, size: number): number {
  return size * 1.5 * r;
}

/** Mayor distancia de `(dx, dz)` (relativo al centro) a los lados: ≤ radio interior ⇔ dentro. */
function sideDistance(dx: number, dz: number): number {
  let max = 0;
  for (const [nx, nz] of SIDE_NORMALS) max = Math.max(max, Math.abs(dx * nx + dz * nz));
  return max;
}

/** La celda que contiene `(x, z)`, escrita en `out` (redondeo cúbico). */
export function hexCell(x: number, z: number, size: number, out: HexCell): HexCell {
  const fq = ((SQRT3 / 3) * x - z / 3) / size;
  const fr = ((2 / 3) * z) / size;
  const fs = -fq - fr;
  let q = Math.round(fq);
  let r = Math.round(fr);
  const s = Math.round(fs);
  const dq = Math.abs(q - fq);
  const dr = Math.abs(r - fr);
  const ds = Math.abs(s - fs);
  if (dq > ds && dq > dr) q = -s - r;
  else if (ds <= dr) r = -q - s;
  // `Math.round(-0.4)` da −0: se normaliza para comparar y escribir etiquetas sin sorpresas.
  out.q = q + 0;
  out.r = r + 0;
  out.h =
    sideDistance(x - hexCenterX(out.q, out.r, size), z - hexCenterZ(out.r, size)) /
    (size * HEX_INNER_RATIO);
  return out;
}

/**
 * ¿Queda el círculo de centro `(x, z)` y radio `radius` entero fuera de la celda `(q, r)`? Conservador: exige
 * que algún par de lados lo deje fuera con todo su radio, así que nunca dice «fuera» de un círculo que la
 * toca (a cambio, rechaza algún círculo junto a una esquina que no la tocaría).
 */
export function discOutsideCell(
  x: number,
  z: number,
  radius: number,
  q: number,
  r: number,
  size: number,
): boolean {
  return (
    sideDistance(x - hexCenterX(q, r, size), z - hexCenterZ(r, size)) >=
    size * HEX_INNER_RATIO + radius
  );
}
