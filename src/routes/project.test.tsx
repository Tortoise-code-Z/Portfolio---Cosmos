import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';

import ProjectPage from './project';

const Stub = createRoutesStub([
  { path: '/', Component: () => <p>home</p> },
  { path: '/projects/:slug', Component: ProjectPage },
  { path: '/es/projects/:slug', Component: ProjectPage },
]);

describe('ProjectPage (mínima hasta F2.7)', () => {
  it('nombre, tagline y resumen del proyecto en inglés', async () => {
    render(<Stub initialEntries={['/projects/chessmate']} />);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Chessmate');
    expect(
      screen.getByText('An online chess academy with interactive courses.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the shell' })).toHaveAttribute(
      'href',
      '/#projects',
    );
  });

  it('en español, con la vuelta a /es', async () => {
    render(<Stub initialEntries={['/es/projects/astrohub']} />);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('AstroHub');
    expect(screen.getByRole('link', { name: 'Volver al caparazón' })).toHaveAttribute(
      'href',
      '/es#projects',
    );
  });

  it.each([
    ['/projects/no-existe', 'Lost in space'],
    ['/projects/Chessmate', 'Lost in space'],
    ['/es/projects/no-existe', 'Perdido en el espacio'],
  ])('slug desconocido %s: la página 404 del idioma, sin lanzar', async (path, title) => {
    render(<Stub initialEntries={[path]} />);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(title);
  });
});
