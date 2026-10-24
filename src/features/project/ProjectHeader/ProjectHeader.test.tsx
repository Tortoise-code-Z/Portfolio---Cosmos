import { render, screen, within } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';

import { projects } from '~/content/projects';
import type { Project } from '~/content/types';

import { PROJECT_TITLE_ID, ProjectHeader } from './ProjectHeader';

function bySlug(slug: string): Project {
  const project = projects.find((candidate) => candidate.slug === slug);
  if (project === undefined) throw new Error(`ProjectHeader.test: no hay proyecto «${slug}»`);
  return project;
}

function renderHeader(path: string, project: Project): void {
  const Stub = createRoutesStub([
    { path: '*', Component: () => <ProjectHeader project={project} /> },
  ]);
  render(<Stub initialEntries={[path]} />);
}

describe('ProjectHeader', () => {
  it('vuelta, nombre (h1 con id), tagline, metadatos y acciones en inglés', async () => {
    const chessmate = bySlug('chessmate');
    renderHeader('/projects/chessmate', chessmate);

    const title = await screen.findByRole('heading', { level: 1, name: 'Chessmate' });
    expect(title).toHaveAttribute('id', PROJECT_TITLE_ID);
    expect(screen.getByRole('link', { name: 'Back to the shell' })).toHaveAttribute(
      'href',
      '/#projects',
    );
    expect(screen.getByText(chessmate.tagline.en)).toBeInTheDocument();

    const [meta] = screen.getAllByRole('list');
    if (meta === undefined) throw new Error('sin lista de metadatos');
    expect(
      within(meta)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Featured', '2025', 'Front end', 'Personal project']);

    expect(screen.getByRole('link', { name: /^Live demo/ })).toHaveAttribute(
      'href',
      chessmate.links.demo,
    );
    expect(screen.getByRole('link', { name: /^Code/ })).toHaveAttribute(
      'href',
      chessmate.links.code,
    );
  });

  it('en español; sin «Destacado» ni demo cuando el proyecto no los tiene', async () => {
    const astrohub = bySlug('astrohub');
    const withoutDemo: Project = {
      ...astrohub,
      featured: false,
      links: { ...astrohub.links, demo: null },
    };
    renderHeader('/es/projects/astrohub', withoutDemo);

    await screen.findByRole('heading', { level: 1, name: 'AstroHub' });
    expect(screen.getByRole('link', { name: 'Volver al caparazón' })).toHaveAttribute(
      'href',
      '/es#projects',
    );
    expect(screen.getByText(astrohub.tagline.es)).toBeInTheDocument();
    expect(screen.queryByText('Destacado')).toBeNull();
    expect(screen.queryByRole('link', { name: /^Demo/ })).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });
});
