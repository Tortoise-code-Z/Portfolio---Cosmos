import { describe, expect, it } from 'vitest';

import { projectEntries } from '~/content/projects/entries';

import {
  assignPlates,
  FIRST_PLATE_LABEL,
  LAST_PLATE_LABEL,
  PLATE_SLOTS,
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
