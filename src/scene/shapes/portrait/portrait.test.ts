import { describe, expect, it } from 'vitest';

import { mulberry32 } from '../prng/prng';
import { PORTRAIT_FRAME } from '../shapeContract/shapeContract';
import { generatePortrait, PORTRAIT, portraitPixelsProblem, type PortraitPixels } from './portrait';

const W = PORTRAIT_FRAME.imageWidth;
const H = PORTRAIT_FRAME.imageHeight;
const EPS = 1e-4;
/** El valor del canal R a media profundidad (0,5): la figura va de `depthFloor` a 255. */
const MID_DEPTH = PORTRAIT.depthFloor + (255 - PORTRAIT.depthFloor) / 2;

interface Figure {
  /** ¿Es figura el píxel? (Si no, fondo: profundidad 0.) */
  readonly inside?: (x: number, y: number) => boolean;
  /** Profundidad del paquete (`depthFloor`..255). */
  readonly depth?: (x: number, y: number) => number;
  /** Gris de la foto (0..255). */
  readonly grey?: (x: number, y: number) => number;
  /** Contornos (canal B del paquete). */
  readonly contour?: (x: number, y: number) => number;
  /** Distancia al borde ×16 (canal G). Por defecto, lejos del borde. */
  readonly border?: (x: number, y: number) => number;
}

/** Unas imágenes hechas a mano, del tamaño del contrato. */
function pixels({
  inside = () => true,
  depth = () => MID_DEPTH,
  grey = () => 160,
  contour = () => 0,
  border = () => 255,
}: Figure = {}): PortraitPixels {
  const color = new Uint8ClampedArray(W * H * 4);
  const pack = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      color.fill(grey(x, y), i, i + 3);
      color[i + 3] = 255;
      if (!inside(x, y)) continue;
      pack[i] = depth(x, y);
      pack[i + 1] = border(x, y);
      pack[i + 2] = contour(x, y);
      pack[i + 3] = 255;
    }
  }
  return { width: W, height: H, color, pack };
}

function portrait(count: number, image: PortraitPixels, seed = 7): Float32Array {
  const out = new Float32Array(count * 4);
  generatePortrait(count, mulberry32(seed), image, out);
  return out;
}

/** La fila de la imagen (0..H−1) de una `y` del mundo (su centro), para una figura en el plano del origen. */
function rowOf(y: number): number {
  return H / 2 - y / (PORTRAIT_FRAME.width / W) - 0.5;
}

const FULL = pixels();
/** Un rectángulo en el centro, con fondo alrededor: tiene borde de silueta. */
const BOX = pixels({ inside: (x, y) => x >= 200 && x < 520 && y >= 150 && y < 450 });

describe('generatePortrait', () => {
  it('rejects images of another size, incomplete ones and a depth with no figure', () => {
    const out = new Float32Array(4);
    expect(portraitPixelsProblem(FULL)).toBeNull();
    expect(() => {
      generatePortrait(1, mulberry32(1), { ...FULL, width: W - 1 }, out);
    }).toThrow(/720×637/);
    expect(() => {
      generatePortrait(1, mulberry32(1), { ...FULL, pack: FULL.pack.subarray(4) }, out);
    }).toThrow(/incomplete/);
    expect(() => {
      generatePortrait(1, mulberry32(1), pixels({ inside: () => false }), out);
    }).toThrow(/no figure/);
  });

  it('same seed and images → same bytes; another seed, another sampling', () => {
    expect(portrait(500, BOX)).toEqual(portrait(500, BOX));
    expect(portrait(500, BOX, 8)).not.toEqual(portrait(500, BOX));
  });

  it('the portrait of n particles is the start of the one with more (the hot degradation reuses it)', () => {
    const many = portrait(3000, BOX);
    expect(portrait(1200, BOX)).toEqual(many.subarray(0, 1200 * 4));
    // También con más partículas que sitios, cuando ya se repiten.
    const tiny = pixels({ inside: (x, y) => x === 300 && y === 300 });
    expect(portrait(10, tiny)).toEqual(portrait(40, tiny).subarray(0, 40));
  });

  it('scanner rows: a flat figure lands on every third row of the photo, centred and within the frame', () => {
    const out = portrait(20_000, FULL);
    const rows = new Set<number>();
    for (let i = 0; i < 20_000; i++) {
      const [x = 0, y = 0, z = 0] = out.subarray(i * 4, i * 4 + 3);
      const row = rowOf(y);
      expect(Math.abs(row - Math.round(row))).toBeLessThan(EPS);
      expect(Math.abs(Math.round(row) % PORTRAIT.rowStep)).toBe(0);
      rows.add(Math.round(row));
      expect(Math.abs(x)).toBeLessThanOrEqual(PORTRAIT_FRAME.width / 2 + EPS);
      expect(Math.abs(y)).toBeLessThanOrEqual(PORTRAIT_FRAME.halfHeight + EPS);
      // La profundidad del medio: en el plano del origen.
      expect(Math.abs(z)).toBeLessThan(0.01);
    }
    expect(rows.size).toBe(Math.ceil(H / PORTRAIT.rowStep));
  });

  it('nearer in the photo is nearer the camera (+Z), and seen in perspective: a little smaller', () => {
    const image = pixels({ depth: (x) => (x < W / 2 ? 30 : 230) });
    const out = portrait(4000, image);
    let farX = 0;
    let nearX = 0;
    for (let i = 0; i < 4000; i++) {
      const x = out[i * 4] ?? 0;
      const z = out[i * 4 + 2] ?? 0;
      if (x < -1) {
        expect(z).toBeLessThan(0);
        farX = Math.min(farX, x);
      } else if (x > 1) {
        expect(z).toBeGreaterThan(0);
        nearX = Math.max(nearX, x);
      }
    }
    expect(nearX).toBeLessThan(-farX);
  });

  it('the light: brighter photo, contours and the silhouette border light more; the cut at the bottom fades out', () => {
    const lightAt = (figure: Figure, count = 2000): number[] => {
      const out = portrait(count, pixels(figure));
      return Array.from({ length: count }, (_, i) => out[i * 4 + 3] ?? 0);
    };
    const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
    // Lejos del corte de abajo, para que el fundido no cuente.
    const top = { inside: (_x: number, y: number) => y < 300 };
    const dark = mean(lightAt({ ...top, grey: () => 40 }));
    const bright = mean(lightAt({ ...top, grey: () => 220 }));
    expect(bright).toBeGreaterThan(dark + 0.4);
    expect(mean(lightAt({ ...top, contour: () => 255 }))).toBeGreaterThan(mean(lightAt(top)) + 0.3);
    expect(mean(lightAt({ ...top, border: () => 0 }))).toBeCloseTo(mean(lightAt(top)) + 0.6, 5);
    // El corte de abajo: la última fila, apagada; por encima del fundido, entera.
    const out = portrait(20_000, FULL);
    for (let i = 0; i < 20_000; i++) {
      const row = Math.round(rowOf(out[i * 4 + 1] ?? 0));
      const light = out[i * 4 + 3] ?? 0;
      if (row === H - 1) expect(light).toBeLessThan(EPS);
      if (row < H - PORTRAIT_FRAME.fadeBottomPx) expect(light).toBeGreaterThan(0.5);
    }
  });

  it('the silhouette border gets walls that curve back and dim; a depth jump gets a wall too', () => {
    const flat = portrait(20_000, BOX);
    let behind = 0;
    for (let i = 0; i < 20_000; i++) {
      if ((flat[i * 4 + 2] ?? 0) < -0.05) behind++;
    }
    expect(behind).toBeGreaterThan(0);
    // Sin borde ni saltos (toda la imagen, plana), nadie queda detrás.
    const full = portrait(20_000, FULL);
    expect(
      Array.from({ length: 20_000 }, (_, i) => full[i * 4 + 2] ?? 0).some((z) => z < -0.05),
    ).toBe(false);
    // Un escalón de profundidad en x = 360 (sin fondo alrededor): la pared llena el hueco entre los dos planos.
    const step = portrait(20_000, pixels({ depth: (x) => (x < 360 ? 60 : 200) }));
    const between = Array.from({ length: 20_000 }, (_, i) => step[i * 4 + 2] ?? 0).filter(
      (z) => z > -0.2 && z < 0.2,
    );
    expect(between.length).toBeGreaterThan(0);
  });

  it('the silhouette walls curve inwards on every side: none leaves the figure (back in photo pixels)', () => {
    const out = portrait(20_000, BOX);
    const scale = PORTRAIT_FRAME.width / W;
    const photoDistance = (PORTRAIT.photoDistance * PORTRAIT_FRAME.width) / PORTRAIT.probeWidth;
    for (let i = 0; i < 20_000; i++) {
      const [x = 0, y = 0, z = 0] = out.subarray(i * 4, i * 4 + 3);
      // Se deshace la perspectiva de la foto (más lejos, algo mayor) para volver a su píxel.
      const unit = scale * ((photoDistance - z) / photoDistance);
      const px = x / unit + W / 2;
      const py = H / 2 - y / unit;
      expect(px).toBeGreaterThanOrEqual(200 - EPS);
      expect(px).toBeLessThanOrEqual(520 + EPS);
      expect(py).toBeGreaterThanOrEqual(150 - EPS);
      expect(py).toBeLessThanOrEqual(450 + EPS);
    }
  });

  it('a background read with noise (1 or 2, as some anti-fingerprinting browsers give) is still background', () => {
    const noisy = pixels({ inside: (x, y) => x >= 200 && x < 520 && y >= 150 && y < 450 });
    for (let i = 0; i < W * H; i++) {
      if ((noisy.pack[i * 4] ?? 0) === 0) noisy.pack[i * 4] = 1 + (i % 2);
    }
    expect(portrait(5000, noisy)).toEqual(portrait(5000, BOX));
  });

  it('more particles than sites: every particle gets a place, none is left empty or broken', () => {
    const tiny = pixels({ inside: (x, y) => x >= 300 && x < 303 && y === 300 });
    const out = portrait(50, tiny);
    expect(out.every((value) => Number.isFinite(value))).toBe(true);
    for (let i = 0; i < 50; i++) expect(Math.round(rowOf(out[i * 4 + 1] ?? 0))).toBe(300);
  });
});
