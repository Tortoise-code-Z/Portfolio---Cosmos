import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';

import ProjectRoute from './project';

const Stub = createRoutesStub([
  { path: '/', Component: () => <p>home</p> },
  { path: '/projects/:slug', Component: ProjectRoute },
  { path: '/es/projects/:slug', Component: ProjectRoute },
]);

describe('ProjectRoute', () => {
  it.each([
    ['/projects/chessmate', 'Chessmate', 'About the project'],
    ['/es/projects/astrohub', 'AstroHub', 'Sobre el proyecto'],
  ])('%s → la página del proyecto en su idioma', async (path, name, about) => {
    render(<Stub initialEntries={[path]} />);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(name);
    expect(screen.getByRole('heading', { level: 2, name: about })).toBeInTheDocument();
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
