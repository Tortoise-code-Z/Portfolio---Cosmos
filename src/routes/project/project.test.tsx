import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';

import { projects } from '~/content/projects';
import type { Project } from '~/content/types';

import ProjectPage from './project';

function projectBySlug(slug: string): Project {
  const project = projects.find((candidate) => candidate.slug === slug);
  if (project === undefined) throw new Error(`project.test: no hay proyecto «${slug}»`);
  return project;
}

const chessmate = projectBySlug('chessmate');
const astrohub = projectBySlug('astrohub');

const Stub = createRoutesStub([
  { path: '/', Component: () => <p>home</p> },
  { path: '/projects/:slug', Component: ProjectPage },
  { path: '/es/projects/:slug', Component: ProjectPage },
]);

describe('ProjectPage (mínima hasta F2.7)', () => {
  it('nombre, tagline y resumen del proyecto en inglés', async () => {
    render(<Stub initialEntries={['/projects/chessmate']} />);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(chessmate.name);
    expect(screen.getByText(chessmate.tagline.en)).toBeInTheDocument();
    expect(screen.getByText(chessmate.summary.en)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the shell' })).toHaveAttribute(
      'href',
      '/#projects',
    );
  });

  it('nombre, tagline y resumen en español, con la vuelta a /es', async () => {
    render(<Stub initialEntries={['/es/projects/astrohub']} />);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(astrohub.name);
    expect(screen.getByText(astrohub.tagline.es)).toBeInTheDocument();
    expect(screen.getByText(astrohub.summary.es)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al caparazón' })).toHaveAttribute(
      'href',
      '/es#projects',
    );
  });

  it.each([
    ['/projects/no-existe', 'Lost in space'],
    ['/projects/Chessmate', 'Lost in space'],
    ['/PROJECTS/chessmate', 'Lost in space'],
    ['/Es/projects/chessmate', 'Lost in space'],
    ['/es/projects/no-existe', 'Perdido en el espacio'],
    ['/es/PROJECTS/chessmate', 'Perdido en el espacio'],
  ])(
    'slug desconocido o ruta con mayúsculas %s: la 404 del idioma, sin lanzar',
    async (path, title) => {
      render(<Stub initialEntries={[path]} />);
      expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(title);
    },
  );
});
