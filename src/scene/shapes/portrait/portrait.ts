import { smoothstep } from '~/lib/math/smoothstep/smoothstep';

import type { Rng } from '../prng/prng';
import { PORTRAIT_FRAME } from '../shapeContract/shapeContract';

/**
 * Forma 5 · retrato (docs/04-escena/formas.md → «Retrato»): un relieve sacado de una sola foto, como holograma de
 * escáner. Lee dos imágenes de `src/assets/portrait/` (las genera `scripts/portrait/`): `portrait-color.jpg`, la
 * foto, y `portrait-depth.png` (R profundidad 3..255 y 0 = fondo · G distancia al borde ×16 · B contornos). Las
 * cifras son las de la prueba de la sesión 34 con los ajustes que eligió Víctor (`PORTRAIT`).
 */

/** Las dos imágenes, en RGBA (como `ImageData.data`). */
export interface PortraitPixels {
  readonly width: number;
  readonly height: number;
  readonly color: Uint8ClampedArray;
  readonly pack: Uint8ClampedArray;
}

export const PORTRAIT = {
  /**
   * Canal R del paquete: la figura va de aquí a 255 y el fondo es 0. El 1 y el 2 no se usan: algunos navegadores con
   * protección contra huellas (Brave) meten ruido de ±1–2 en lo que se lee de un canvas, y un fondo a 1 sería figura.
   */
  depthFloor: 3,
  /** Escáner: una fila de cada tres. */
  rowStep: 3,
  /** Relieve: la profundidad de la foto (0–1) se estira a esta fracción del ancho de la prueba (2,4). */
  relief: 0.33,
  /** Distancia de la cámara de la foto, en anchos de la prueba: cada punto donde lo vio (sin grietas de frente). */
  photoDistance: 6.2,
  /** El ancho del mundo de la prueba: las cifras de arriba van en esas unidades. */
  probeWidth: 2.4,
  /** Borde de la silueta: paredes que se curvan hacia atrás y hacia dentro (lejos del fondo), más oscuras. */
  rim: { walls: 5, inward: 14, depth: 0.3, shade: 0.55 },
  /** Saltos de profundidad dentro de la figura (la mandíbula sobre el cuello): una pared. */
  gap: { from: 0.025, step: 0.04, max: 24, shade: 0.35 },
  /** Luz: robot (pocos niveles) ↔ realista, el brillo de los contornos y el del borde de la silueta. */
  light: { levels: 4, realism: 0.74, base: 0.1, gain: 0.85, edge: 0.9, rim: 0.6, rimReach: 0.3 },
} as const;

const SITE_FRONT = 0;
const SITE_RIM = 1;
const SITE_GAP = 2;
const NEIGHBOURS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

/** Un valor de una matriz cuyo índice ya se sabe dentro (el `?? 0` solo calma al tipado). */
const at = (array: ArrayLike<number>, i: number): number => array[i] ?? 0;

/** La luz del holograma de un píxel (sin el barrido, que es del shader). */
function light(pixels: PortraitPixels, i: number, shade: number): number {
  const { color, pack } = pixels;
  const { levels, realism, base, gain, edge, rim, rimReach } = PORTRAIT.light;
  const luma =
    ((0.299 * at(color, i) + 0.587 * at(color, i + 1) + 0.114 * at(color, i + 2)) / 255) * shade;
  const posterised = Math.floor(luma * levels + 0.5) / levels;
  const contour = (at(pack, i + 2) / 255) * shade * (1 - realism * 0.6);
  const border = 1 - smoothstep(0, rimReach, Math.min(at(pack, i + 1) / 16 / 12, 1));
  return base + gain * (posterised + (luma - posterised) * realism) + edge * contour + rim * border;
}

/** Por qué unas imágenes no valen, o `null`. */
export function portraitPixelsProblem(pixels: PortraitPixels): string | null {
  const { width, height, color, pack } = pixels;
  if (width !== PORTRAIT_FRAME.imageWidth || height !== PORTRAIT_FRAME.imageHeight) {
    return `the portrait must be ${String(PORTRAIT_FRAME.imageWidth)}×${String(PORTRAIT_FRAME.imageHeight)}`;
  }
  const length = width * height * 4;
  if (color.length !== length || pack.length !== length)
    return 'the portrait images are incomplete';
  return null;
}

/**
 * Escribe `count` partículas del retrato en `out` (4 por partícula: x, y, z y la luz). Primero los sitios (cada
 * píxel de la figura en las filas del escáner, y las paredes del borde y de los saltos); después se reparten las
 * partículas entre ellos al azar, sin repetir mientras quedan. Lanza `RangeError` con unas imágenes que no valen
 * o sin figura.
 */
export function generatePortrait(
  count: number,
  rng: Rng,
  pixels: PortraitPixels,
  out: Float32Array,
): void {
  const problem = portraitPixelsProblem(pixels);
  if (problem !== null) throw new RangeError(`[scene] Invalid portrait: ${problem}`);
  const { width, height, pack } = pixels;
  const { depthFloor } = PORTRAIT;
  const depth = (index: number): number =>
    Math.max(at(pack, index * 4) - depthFloor, 0) / (255 - depthFloor);
  const inside = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < width && y < height;
  const isFigure = (x: number, y: number): boolean =>
    inside(x, y) && at(pack, (y * width + x) * 4) >= depthFloor;
  /** Fondo dentro de la imagen: el borde de la silueta (el de la foto no cuenta). */
  const isBackground = (x: number, y: number): boolean => inside(x, y) && !isFigure(x, y);

  // Cada sitio: el píxel (índice) y su clase en los dos bits bajos.
  const sites: number[] = [];
  for (let y = 0; y < height; y += PORTRAIT.rowStep) {
    for (let x = 0; x < width; x++) {
      if (!isFigure(x, y)) continue;
      const index = y * width + x;
      sites.push(index * 4 + SITE_FRONT);
      let border = false;
      let deepest = depth(index);
      for (const [ox, oy] of NEIGHBOURS) {
        border ||= isBackground(x + ox, y + oy);
        if (isFigure(x + ox, y + oy)) deepest = Math.min(deepest, depth((y + oy) * width + x + ox));
      }
      if (border) for (let s = 0; s < PORTRAIT.rim.walls; s++) sites.push(index * 4 + SITE_RIM);
      const gap = depth(index) - deepest;
      if (gap > PORTRAIT.gap.from) {
        const walls = Math.min(Math.ceil(gap / PORTRAIT.gap.step), PORTRAIT.gap.max);
        for (let s = 0; s < walls; s++) sites.push(index * 4 + SITE_GAP);
      }
    }
  }
  if (sites.length === 0) throw new RangeError('[scene] Invalid portrait: no figure in the depth');

  // Sin repetir mientras quedan sitios (Fisher–Yates parcial); con más partículas que sitios, al azar.
  const order = Uint32Array.from(sites.keys());
  const scale = PORTRAIT_FRAME.width / width;
  const probe = PORTRAIT_FRAME.width / PORTRAIT.probeWidth;
  const photoDistance = PORTRAIT.photoDistance * probe;
  for (let i = 0; i < count; i++) {
    let pick: number;
    if (i < order.length) {
      const j = i + Math.floor(rng() * (order.length - i));
      pick = at(order, j);
      order[j] = at(order, i);
      order[i] = pick;
    } else {
      pick = Math.floor(rng() * order.length);
    }
    const site = at(sites, pick);
    const index = site >>> 2;
    const kind = site & 3;
    const px = index % width;
    const py = (index - px) / width;
    // Dentro de su píxel a lo largo de la fila; en el centro de la fila (el escáner).
    let x = px + rng();
    let y = py + 0.5;
    let z = depth(index);
    let shade = 1;
    if (kind === SITE_RIM) {
      let bx = 0;
      let by = 0;
      for (const [ox, oy] of NEIGHBOURS) {
        if (isBackground(px + ox, py + oy)) {
          bx += ox;
          by += oy;
        }
      }
      const f = Math.sqrt(rng());
      const inward = PORTRAIT.rim.inward * f * f;
      // Hacia dentro: lejos del fondo (b apunta a él), en x y en y.
      x = px + 0.5 - bx * inward;
      y = py + 0.5 - by * inward;
      z -= PORTRAIT.rim.depth * Math.sin((f * Math.PI) / 2);
      shade = 1 - PORTRAIT.rim.shade * f;
    } else if (kind === SITE_GAP) {
      let deepest = z;
      for (const [ox, oy] of NEIGHBOURS) {
        if (isFigure(px + ox, py + oy))
          deepest = Math.min(deepest, depth((py + oy) * width + px + ox));
      }
      const f = rng();
      z -= (z - deepest) * f;
      shade = 1 - PORTRAIT.gap.shade * f;
    }
    const tz = (z - 0.5) * PORTRAIT.relief * probe;
    const perspective = (photoDistance - tz) / photoDistance;
    out[i * 4] = (x - width / 2) * scale * perspective;
    out[i * 4 + 1] = (height / 2 - y) * scale * perspective;
    out[i * 4 + 2] = tz;
    out[i * 4 + 3] =
      light(pixels, index * 4, shade) * smoothstep(height, height - PORTRAIT_FRAME.fadeBottomPx, y);
  }
}
