import { describe, expect, it } from 'vitest';

import { projects } from '~/content/projects';

import { neighbours } from './neighbours';

const slugs = (slug: string): [string | undefined, string | undefined] => {
  const { prev, next } = neighbours(projects, slug);
  return [prev?.slug, next?.slug];
};

describe('neighbours', () => {
  it('sigue el orden de lectura de `projects`', () => {
    expect(projects.map((project) => project.slug)).toEqual(['chessmate', 'astrohub', 'cosmos']);
    expect(slugs('astrohub')).toEqual(['chessmate', 'cosmos']);
  });

  it('sin vuelta: el primero no tiene anterior y el último no tiene siguiente', () => {
    expect(slugs('chessmate')).toEqual([undefined, 'astrohub']);
    expect(slugs('cosmos')).toEqual(['astrohub', undefined]);
  });

  it('un slug que no está: ni anterior ni siguiente', () => {
    expect(slugs('no-existe')).toEqual([undefined, undefined]);
  });

  it('con un solo proyecto no hay vecinos', () => {
    const [only] = projects;
    if (only === undefined) throw new Error('neighbours.test: no hay proyectos');
    expect(neighbours([only], only.slug)).toEqual({ prev: undefined, next: undefined });
  });
});
