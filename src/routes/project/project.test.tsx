import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import { useUiStore } from '~/stores/uiStore/uiStore';

import ProjectRoute from './project';

const Stub = createRoutesStub([
  { path: '/', Component: () => <p>home</p> },
  { path: '/projects/:slug', Component: ProjectRoute },
  { path: '/es/projects/:slug', Component: ProjectRoute },
]);

afterEach(() => {
  useUiStore.setState(useUiStore.getInitialState(), true);
});

describe('ProjectRoute', () => {
  it.each([
    ['/projects/chessmate', 'Chessmate', 'About the project'],
    ['/es/projects/astrohub', 'AstroHub', 'Sobre el proyecto'],
  ])('%s → la página del proyecto en su idioma', async (path, name, about) => {
    render(<Stub initialEntries={[path]} />);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(name);
    expect(screen.getByRole('heading', { level: 2, name: about })).toBeInTheDocument();
  });

  it('lleva la interfaz fija: Skip al nombre, la barra con «Quick mission» y EN / ES a esta misma página', async () => {
    render(<Stub initialEntries={['/es/projects/chessmate']} />);
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveAttribute(
      'href',
      '#project-title',
    );
    expect(screen.getByRole('link', { name: 'TORTOISE_CODE' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Modo misión rápida' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute(
      'href',
      '/projects/chessmate',
    );
    expect(document.querySelector('dialog')).not.toBeNull();
    // Sin capítulos no hay raíl ni HUD.
    expect(screen.queryByRole('navigation', { name: /chapters|capítulos/i })).toBeNull();
  });

  it('apunta el proyecto como visto (el viaje dejará el foco en su fila al volver)', async () => {
    render(<Stub initialEntries={['/projects/cosmos']} />);
    await screen.findByRole('heading', { level: 1 });
    expect(useUiStore.getState().visitedProject).toBe('cosmos');
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
