// @vitest-environment node
// Lee `tokens.css` del disco: no necesita DOM (y el URL de jsdom no acepta rutas file:).

import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { skillGroups } from '~/content/skills';
import { LOCALES } from '~/content/types';
import { CHAPTER_INDICES, INTERLUDES } from '~/content/chapters';
import { localize } from '~/lib/i18n/localize/localize';

import { cameraFov, cameraPose, createCameraPose, createParallax } from '../../math/camera/camera';
import { keepOutZones, overlapsRect, type Rect } from '../../math/labelFit/labelFit';
import {
  createScreenPoint,
  projectToScreen,
  type ScreenPoint,
} from '../../math/projection/projection';
import type { ScenePoint } from '../sceneConfig';
import {
  CONSTELLATION_LINKS,
  CONSTELLATION_STARS,
  STAR_LABEL_BOX,
  STAR_LABEL_KEEP_OUT,
  starLabelWidth,
} from './constellationLayout';

const MIN_STAR_DISTANCE = 1.2;
const FLOAT = { min: 0.9, max: 1.5 };
/** Lo más cerca que una línea puede pasar de una estrella que no es suya, en pantalla. */
const MIN_LINE_GAP_PX = 12;

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

function star(id: string): ScenePoint {
  const position = CONSTELLATION_STARS[id];
  if (position === undefined) throw new Error(`Sin posición: ${id}`);
  return position;
}

const skills = skillGroups.flatMap((group) => group.skills);

/** Cada estrella en pantalla, en reposo en la galaxia (m = 2, escritorio), con ese tamaño y ese paralaje. */
function screenAtRest(
  width: number,
  height: number,
  [px, py]: readonly [number, number],
): Map<string, ScreenPoint> {
  const parallax = createParallax();
  parallax.x = px;
  parallax.y = py;
  const pose = cameraPose(2, true, parallax, createCameraPose());
  const viewport = { width, height, fov: cameraFov(width / height) };
  return new Map(
    skills.map(({ id }) => [id, projectToScreen(star(id), pose, viewport, createScreenPoint())]),
  );
}

/** La caja de la etiqueta de una estrella en pantalla, con su texto. */
function labelRect(point: ScreenPoint, text: string): Rect {
  const left = point.x + STAR_LABEL_BOX.offsetPx;
  const half = STAR_LABEL_BOX.heightPx / 2;
  return [left, point.y - half, left + starLabelWidth(text), point.y + half];
}

/** Solo el texto de la caja (sin el trazo ni el relleno): lo que no puede tachar una línea. */
function textRect([left, top, right, bottom]: Rect): Rect {
  const { startPx, endPx, padBlockPx } = STAR_LABEL_BOX;
  return [left + startPx, top + padBlockPx, right - endPx, bottom - padBlockPx];
}

/** Distancia de un punto a un segmento, en píxeles. */
function distanceToSegment(p: ScreenPoint, a: ScreenPoint, b: ScreenPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

/** ¿Pasa el segmento por el rectángulo? (recorte de Liang–Barsky). */
function segmentCrosses(a: ScreenPoint, b: ScreenPoint, [left, top, right, bottom]: Rect): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let from = 0;
  let to = 1;
  for (const [p, q] of [
    [-dx, a.x - left],
    [dx, right - a.x],
    [-dy, a.y - top],
    [dy, bottom - a.y],
  ] as const) {
    if (p === 0) {
      if (q < 0) return false;
    } else if (p < 0) {
      from = Math.max(from, q / p);
    } else {
      to = Math.min(to, q / p);
    }
    if (from > to) return false;
  }
  return true;
}

/** Todas las líneas, con su grupo. */
const LINES = skillGroups.flatMap((group) =>
  CONSTELLATION_LINKS[group.id].map(([a, b]) => ({ group: group.id, a, b })),
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

  it('each group is one figure: lines between two different stars of the group, no repeats, all joined', () => {
    for (const group of skillGroups) {
      const ids = group.skills.map(({ id }) => id);
      const links = CONSTELLATION_LINKS[group.id];
      for (const [a, b] of links) {
        expect(a, group.id).not.toBe(b);
        expect(ids, group.id).toContain(a);
        expect(ids, group.id).toContain(b);
      }
      const pairs = links.map(([a, b]) => [a, b].sort().join('·'));
      expect(new Set(pairs).size, group.id).toBe(pairs.length);
      // Todas unidas: desde la primera se llega a todas por sus líneas.
      const reached = new Set([ids[0]]);
      for (let grew = true; grew;) {
        grew = false;
        for (const [a, b] of links) {
          if (reached.has(a) !== reached.has(b)) {
            reached.add(a);
            reached.add(b);
            grew = true;
          }
        }
      }
      expect([...reached].sort(), group.id).toEqual([...ids].sort());
    }
  });

  it('no line of one group crosses a line of another (seen from above, on the X–Z plane)', () => {
    const side = (p: ScenePoint, q: ScenePoint, r: ScenePoint): number =>
      (q[0] - p[0]) * (r[2] - p[2]) - (q[2] - p[2]) * (r[0] - p[0]);
    for (const [index, s] of LINES.entries()) {
      for (const t of LINES.slice(index + 1)) {
        if (s.group === t.group) continue;
        const [sa, sb, ta, tb] = [star(s.a), star(s.b), star(t.a), star(t.b)];
        const crosses =
          side(sa, sb, ta) * side(sa, sb, tb) < 0 && side(ta, tb, sa) * side(ta, tb, sb) < 0;
        expect(crosses, `${s.group} × ${t.group}`).toBe(false);
      }
    }
  });

  it('the label box is 22 px high and grows 6.6 px per letter, composed or not', () => {
    expect(STAR_LABEL_BOX.heightPx).toBe(22);
    expect(starLabelWidth('Vite') - starLabelWidth('Vit')).toBeCloseTo(6.6, 10);
    expect(starLabelWidth('Máquinas')).toBeCloseTo(14 + 8 * 6.6 + 6, 10);
    // «á» como «a» + acento combinante (dos unidades): la misma caja.
    expect(starLabelWidth('Máquinas')).toBe(starLabelWidth('Máquinas'));
    expect(starLabelWidth('Vite', 10) - starLabelWidth('Vit', 10)).toBeCloseTo(6, 10);
  });

  it('every label, EN and ES, is one letter per unit once composed, and within the Latin set of Plex Mono', () => {
    for (const skill of skills) {
      for (const locale of LOCALES) {
        const text = localize(locale, skill.label).normalize('NFC');
        expect(text, skill.id).not.toMatch(/\p{M}/u);
        // La parte latina de la fuente (`fonts.css`, U+0000–00FF y algunos más): ni emojis ni otros alfabetos.
        expect(text, skill.id).toMatch(/^[ -ÿ]+$/);
      }
    }
  });

  it('what it keeps clear of the interface comes from the tokens where it can (panel, bar, rail height)', () => {
    const tokens = readFileSync(new URL('../../../styles/tokens.css', import.meta.url), 'utf8');
    const root = tokens.slice(
      tokens.indexOf(':root {'),
      tokens.indexOf('}', tokens.indexOf(':root {')),
    );
    const px = (name: string): number => {
      const value = new RegExp(`${name}:\\s*(\\d+)px;`).exec(root)?.[1];
      if (value === undefined) throw new Error(`${name} no es un valor en px del :root`);
      return Number(value);
    };
    // En escritorio el `--gutter` es `--space-5` (el de móvil, `--space-4`, va en su media query).
    expect(root).toContain('--gutter: max(var(--space-5),');
    expect(STAR_LABEL_KEEP_OUT.wide.panelRight).toBe(px('--space-5') + px('--panel-w'));
    expect(STAR_LABEL_KEEP_OUT.wide.barBottom).toBe(px('--topbar-h'));
    expect(STAR_LABEL_KEEP_OUT.narrow.barBottom).toBe(px('--topbar-h'));
    // El raíl: una parada por capítulo y por interludio, de `--target-min`, que encoge hasta `--rail-stop-min`.
    const stops = CHAPTER_INDICES.length + INTERLUDES.length;
    expect(root).toContain(`--rail-stops: ${String(stops)};`);
    for (const { rail } of [STAR_LABEL_KEEP_OUT.wide, STAR_LABEL_KEEP_OUT.narrow]) {
      expect(rail.stops).toBe(stops);
      expect(rail.stopPx).toBe(px('--target-min'));
      expect(rail.minStopPx).toBe(px('--rail-stop-min'));
    }
    // La misma cuenta que usa el CSS del raíl (su alto y bajarlo si no cabe bajo la barra).
    expect(root).toContain('--rail-half-h: calc(var(--rail-stops) * var(--rail-stop) / 2);');
    expect(root).toContain(
      '(100svh - var(--topbar-h) - env(safe-area-inset-top, 0px)) / var(--rail-stops),',
    );
  });

  // Regla 2, en reposo (m = 2): proyectadas con la cámara de la galaxia, delante de ella, ninguna etiqueta pisa otra,
  // ni el panel, la barra, el raíl o el HUD, y todas caben en el lienzo; en inglés y en español, con el ratón quieto y
  // en las esquinas. Fuera del reposo o de estos tamaños, la escena oculta la que no cabe (`fitLabels`).
  for (const { width, height } of VIEWPORTS) {
    for (const locale of LOCALES) {
      it(`at rest (m = 2), ${String(width)}×${String(height)} (${locale}): every label fits, apart from the rest`, () => {
        const zones = keepOutZones(width, height, true);
        for (const parallax of PARALLAXES) {
          const screen = screenAtRest(width, height, parallax);
          const where = `parallax ${parallax.join(', ')}`;
          const labels = skills.map(({ id, label }) => {
            const point = screen.get(id) ?? createScreenPoint();
            expect(point.inFront, `${id} · ${where}`).toBe(true);
            return { id, rect: labelRect(point, localize(locale, label)) };
          });
          for (const { id, rect } of labels) {
            const box = { left: rect[0], top: rect[1], right: rect[2], bottom: rect[3] };
            const covered = zones
              .filter((zone) => overlapsRect(box, zone.rect))
              .map(({ name }) => name);
            expect(covered, `${id} · ${where}`).toEqual([]);
          }
          for (const [index, a] of labels.entries()) {
            for (const b of labels.slice(index + 1)) {
              const box = { left: a.rect[0], top: a.rect[1], right: a.rect[2], bottom: a.rect[3] };
              expect(overlapsRect(box, b.rect), `${a.id} · ${b.id} · ${where}`).toBe(false);
            }
          }
        }
      });
    }
  }

  // Regla 3 en pantalla, en reposo: cada figura se reconoce (ninguna línea roza una estrella que no es suya: un
  // triángulo no se queda en una raya) y ninguna línea tacha el texto de una etiqueta que no es de sus estrellas.
  for (const { width, height } of VIEWPORTS) {
    it(`at rest (m = 2), ${String(width)}×${String(height)}: no line grazes another star or strikes a label`, () => {
      for (const parallax of PARALLAXES) {
        const screen = screenAtRest(width, height, parallax);
        const where = `parallax ${parallax.join(', ')}`;
        for (const { a, b } of LINES) {
          const [pa, pb] = [screen.get(a), screen.get(b)];
          if (pa === undefined || pb === undefined) throw new Error(`${a} · ${b}`);
          for (const skill of skills) {
            if (skill.id === a || skill.id === b) continue;
            const point = screen.get(skill.id) ?? createScreenPoint();
            expect(
              distanceToSegment(point, pa, pb),
              `${a}–${b} · ${skill.id} · ${where}`,
            ).toBeGreaterThanOrEqual(MIN_LINE_GAP_PX);
            for (const locale of LOCALES) {
              const text = textRect(labelRect(point, localize(locale, skill.label)));
              expect(
                segmentCrosses(pa, pb, text),
                `${a}–${b} × ${skill.id} (${locale}) · ${where}`,
              ).toBe(false);
            }
          }
        }
      }
    });
  }
});
