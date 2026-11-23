import { describe, expect, it } from 'vitest';

import { projectEntries } from '~/content/projects/entries';

import {
  assignPlates,
  FIRST_PLATE_LABEL,
  LAST_PLATE_LABEL,
  NO_PLATE,
  PLATE_LOOK,
  PLATE_PIN,
  PLATE_SLOTS,
  plateLabelOf,
  plateSlugOf,
  type PlateProject,
} from './plateSlots';

const project = (slug: string, order: number, featured = false): PlateProject => ({
  slug,
  order,
  featured,
});

describe('PLATE_SLOTS', () => {
  it('matches the table in constelaciones-y-placas.md: 7 distinct cells, labels 20..26 in order', () => {
    expect(PLATE_SLOTS.map(({ q, r, label }) => [q, r, label])).toEqual([
      [0, 0, 20],
      [-1, 0, 21],
      [1, 0, 22],
      [0, -1, 23],
      [0, 1, 24],
      [1, -1, 25],
      [-1, 1, 26],
    ]);
    expect(PLATE_SLOTS[0]?.label).toBe(FIRST_PLATE_LABEL);
    expect(PLATE_SLOTS.at(-1)?.label).toBe(LAST_PLATE_LABEL);
  });
});

describe('assignPlates', () => {
  it('no projects, no plates', () => {
    expect(assignPlates([])).toEqual([]);
  });

  it('one project takes the centre', () => {
    expect(assignPlates([project('solo', 1, true)])).toEqual([{ slug: 'solo', label: 20 }]);
  });

  it('the featured one takes the centre even when it is not first by order; the rest follow order', () => {
    expect(
      assignPlates([project('c', 3), project('a', 1), project('b', 2, true)]).map(
        ({ slug, label }) => `${slug}:${String(label)}`,
      ),
    ).toEqual(['b:20', 'a:21', 'c:22']);
  });

  it('at most 7: the eighth project has no plate', () => {
    const projects = Array.from({ length: 8 }, (_, i) =>
      project(`p${String(i + 1)}`, i + 1, i === 0),
    );
    const plates = assignPlates(projects);
    expect(plates.map(({ label }) => label)).toEqual([20, 21, 22, 23, 24, 25, 26]);
    expect(plates.map(({ slug }) => slug)).not.toContain('p8');
  });

  it('with the real content (v1): Chessmate in the centre, AstroHub behind, Cosmos ahead', () => {
    expect(assignPlates(projectEntries)).toEqual([
      { slug: 'chessmate', label: 20 },
      { slug: 'astrohub', label: 21 },
      { slug: 'cosmos', label: 22 },
    ]);
  });

  it('does not reorder the list it receives', () => {
    const projects = [project('b', 2), project('a', 1, true)];
    assignPlates(projects);
    expect(projects.map(({ slug }) => slug)).toEqual(['b', 'a']);
  });
});

describe('plateLabelOf / plateSlugOf', () => {
  const plates = assignPlates(projectEntries);

  it('go from a project to its plate and back', () => {
    expect(plateLabelOf(plates, 'astrohub')).toBe(21);
    expect(plateSlugOf(plates, 21)).toBe('astrohub');
    for (const { slug, label } of plates) {
      expect(plateSlugOf(plates, plateLabelOf(plates, slug))).toBe(slug);
      expect(plateLabelOf(plates, plateSlugOf(plates, label))).toBe(label);
    }
  });

  it('no project, an unknown one or a plate without a project: none', () => {
    // El shader compara `abs(tag − uPlate) < 0,5`: «ninguna» tiene que quedar al menos a 1 de cualquier placa.
    expect(Number.isInteger(NO_PLATE)).toBe(true);
    expect(NO_PLATE).toBeLessThanOrEqual(FIRST_PLATE_LABEL - 1);
    expect(plateLabelOf(plates, null)).toBe(NO_PLATE);
    expect(plateLabelOf(plates, 'nope')).toBe(NO_PLATE);
    expect(plateSlugOf(plates, NO_PLATE)).toBeNull();
    expect(plateSlugOf(plates, LAST_PLATE_LABEL)).toBeNull();
  });
});

describe('PLATE_LOOK', () => {
  it('has the figures of the spec (constelaciones-y-placas.md, 03-tortuga.md)', () => {
    // Escritas aquí: con las de la config, cualquier cifra pasaría.
    expect(PLATE_LOOK).toEqual({
      chapter: 3,
      litFrom: 0.2,
      cycleSeconds: 2.6,
      interactiveFrom: 0.6,
    });
  });
});

describe('PLATE_PIN', () => {
  it('the tag is as tall as its line, its padding and its border; the stem of the spec is 46 px', () => {
    const { tagHeightPx, lineHeightPx, padBlockPx, borderPx, stemPx, liftY } = PLATE_PIN;
    expect(tagHeightPx).toBe(lineHeightPx + 2 * (padBlockPx + borderPx));
    expect(stemPx).toBe(46);
    expect(liftY).toBe(0.06);
    expect(PLATE_PIN.floors).toBe(3);
  });

  it('has the figures of the spec (componentes.md → «Pin de placa», constelaciones-y-placas.md → «Pins»)', () => {
    // Escritas aquí: con las de la config, una cifra que cambiara a la vez en la config y en el CSS pasaría.
    expect(PLATE_PIN).toEqual({
      liftY: 0.06,
      stemPx: 46,
      gapPx: 4,
      tagLeftPx: 2,
      fontPx: 11,
      narrowFontPx: 10,
      advanceEm: 0.6,
      trackingEm: 0.1,
      padInlinePx: 8,
      padBlockPx: 4,
      lineHeightPx: 16,
      borderPx: 1,
      tagHeightPx: 26,
      floors: 3,
    });
  });
});
