import { describe, expect, it } from 'vitest';

import { skillGroups } from '~/content/skills';
import { LOCALES, type Label, type Locale } from '~/content/types';

import { cameraFov, cameraPose, createCameraPose, createParallax } from '../../math/camera/camera';
import { createScreenPoint, projectToScreen } from '../../math/projection/projection';
import {
  CONSTELLATION_LINKS,
  CONSTELLATION_STARS,
  STAR_LABEL_BOX,
  starLabelWidth,
} from './constellationLayout';

const MIN_STAR_DISTANCE = 1.2;
const FLOAT = { min: 0.9, max: 1.5 };

/**
 * Lo que tapa la interfaz en escritorio, en píxeles CSS (medido en Chromium en F4.3a, EN y ES; el e2e de F4.3c lo
 * mide de verdad): el panel (`--gutter` + `--panel-w`), la barra de arriba, el raíl (centrado en vertical, desde el
 * borde derecho del lienzo; el ancho del español) y el HUD (abajo a la derecha). Con un margen alrededor.
 */
const PANEL_RIGHT = 24 + 540;
const BAR_BOTTOM = 64;
const RAIL = { fromRight: 154, halfHeight: 110 };
const HUD = { fromRight: 247, top: 62, bottom: 24 };
const MARGIN = 8;

/** Los tamaños que vigila la aceptación, con barra de scroll clásica (15 px menos de lienzo) y sin ella. */
const VIEWPORTS = [
  { width: 1265, height: 720 },
  { width: 1280, height: 720 },
  { width: 1425, height: 900 },
  { width: 1440, height: 900 },
] as const;

/** El ratón en las cuatro esquinas y en reposo: el paralaje mueve la cámara (y las etiquetas con ella). */
const PARALLAXES = [
  [0, 0],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
] as const;

type Rect = readonly [left: number, top: number, right: number, bottom: number];

function overlaps(a: Rect, b: Rect): boolean {
  return a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
}

function text(label: Label, locale: Locale): string {
  return typeof label === 'string' ? label : label[locale];
}

function star(id: string): readonly [number, number, number] {
  const position = CONSTELLATION_STARS[id];
  if (position === undefined) throw new Error(`Sin posición: ${id}`);
  return position;
}

const skills = skillGroups.flatMap((group) =>
  group.skills.map((skill) => ({ group: group.id, ...skill })),
);

describe('constellationLayout', () => {
  it('has one star per skill of the content, and none left over', () => {
    expect(Object.keys(CONSTELLATION_STARS).sort()).toEqual(skills.map(({ id }) => id).sort());
  });

  it('floats every star above the galaxy plane (Y between 0.9 and 1.5)', () => {
    for (const [, y] of Object.values(CONSTELLATION_STARS)) {
      expect(y).toBeGreaterThanOrEqual(FLOAT.min);
      expect(y).toBeLessThanOrEqual(FLOAT.max);
    }
  });

  it('keeps every two stars at least 1.2 apart', () => {
    const ids = Object.keys(CONSTELLATION_STARS);
    for (const [index, a] of ids.entries()) {
      for (const b of ids.slice(index + 1)) {
        const [ax, ay, az] = star(a);
        const [bx, by, bz] = star(b);
        expect(Math.hypot(ax - bx, ay - by, az - bz), `${a} · ${b}`).toBeGreaterThanOrEqual(
          MIN_STAR_DISTANCE,
        );
      }
    }
  });

  it('links stars of the same group only, and every star of a group is on its figure', () => {
    for (const group of skillGroups) {
      const ids = new Set(group.skills.map(({ id }) => id));
      const linked = new Set(CONSTELLATION_LINKS[group.id].flat());
      expect(
        [...linked].filter((id) => !ids.has(id)),
        group.id,
      ).toEqual([]);
      expect(
        [...ids].filter((id) => !linked.has(id)),
        group.id,
      ).toEqual([]);
    }
  });

  it('no line of one group crosses a line of another (seen from above, on the X–Z plane)', () => {
    const segments = skillGroups.flatMap((group) =>
      CONSTELLATION_LINKS[group.id].map(([a, b]) => ({ group: group.id, a: star(a), b: star(b) })),
    );
    const side = (p: readonly number[], q: readonly number[], r: readonly number[]): number =>
      ((q[0] ?? 0) - (p[0] ?? 0)) * ((r[2] ?? 0) - (p[2] ?? 0)) -
      ((q[2] ?? 0) - (p[2] ?? 0)) * ((r[0] ?? 0) - (p[0] ?? 0));
    for (const [index, s] of segments.entries()) {
      for (const t of segments.slice(index + 1)) {
        if (s.group === t.group) continue;
        const crosses =
          side(s.a, s.b, t.a) * side(s.a, s.b, t.b) < 0 &&
          side(t.a, t.b, s.a) * side(t.a, t.b, s.b) < 0;
        expect(crosses, `${s.group} × ${t.group}`).toBe(false);
      }
    }
  });

  it('the label box is 22 px high and grows 6.6 px per letter', () => {
    expect(STAR_LABEL_BOX.heightPx).toBe(22);
    expect(starLabelWidth('Vite') - starLabelWidth('Vit')).toBeCloseTo(6.6, 10);
    expect(starLabelWidth('Máquinas')).toBeCloseTo(14 + 8 * 6.6 + 6, 10);
  });

  // Regla 2: proyectadas con la cámara de la galaxia, ninguna etiqueta pisa otra, ni el panel, la barra, el raíl o el
  // HUD, y todas caben en el lienzo; en inglés y en español, con el ratón quieto y en las esquinas.
  for (const { width, height } of VIEWPORTS) {
    for (const locale of LOCALES) {
      it(`at ${String(width)}×${String(height)} (${locale}) every label fits, apart from the rest`, () => {
        const viewport = { width, height, fov: cameraFov(width / height) };
        const covered: Rect[] = [
          [-Infinity, -Infinity, PANEL_RIGHT + MARGIN, Infinity],
          [-Infinity, -Infinity, Infinity, BAR_BOTTOM + MARGIN],
          [
            width - RAIL.fromRight - MARGIN,
            height / 2 - RAIL.halfHeight - MARGIN,
            Infinity,
            height / 2 + RAIL.halfHeight + MARGIN,
          ],
          [width - HUD.fromRight - MARGIN, height - HUD.top - MARGIN, Infinity, Infinity],
          [width - MARGIN, -Infinity, Infinity, Infinity],
          [-Infinity, height - MARGIN, Infinity, Infinity],
        ];
        const parallax = createParallax();
        const pose = createCameraPose();
        const point = createScreenPoint();
        for (const [px, py] of PARALLAXES) {
          parallax.x = px;
          parallax.y = py;
          cameraPose(2, true, parallax, pose);
          const labels = skills.map(({ id, label }) => {
            projectToScreen(star(id), pose, viewport, point);
            const left = point.x + STAR_LABEL_BOX.offsetPx;
            const half = STAR_LABEL_BOX.heightPx / 2;
            return {
              id,
              rect: [
                left,
                point.y - half,
                left + starLabelWidth(text(label, locale)),
                point.y + half,
              ] as Rect,
            };
          });
          const where = `parallax ${String(px)}, ${String(py)}`;
          for (const { id, rect } of labels) {
            expect(
              covered.filter((zone) => overlaps(rect, zone)),
              `${id} · ${where}`,
            ).toEqual([]);
          }
          for (const [index, a] of labels.entries()) {
            for (const b of labels.slice(index + 1)) {
              expect(overlaps(a.rect, b.rect), `${a.id} · ${b.id} · ${where}`).toBe(false);
            }
          }
        }
      });
    }
  }
});
