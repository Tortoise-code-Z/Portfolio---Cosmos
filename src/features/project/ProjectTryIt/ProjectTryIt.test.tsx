import { render, screen, within } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';

import type { TryIt } from '~/content/types';

import { ProjectTryIt } from './ProjectTryIt';

const README = 'https://github.com/x/y#readme';

const TRY_IT: TryIt = {
  intro: { en: 'Log in and look around.', es: 'Inicia sesión y echa un vistazo.' },
  steps: [
    { en: 'Log in.', es: 'Inicia sesión.' },
    { en: 'Go to Courses → All courses.', es: 'Ve a Cursos → Todos los cursos.' },
  ],
  credentials: [
    { label: { en: 'User', es: 'Usuario' }, user: 'lisa12', password: '123456' },
    { label: { en: 'Admin', es: 'Administrador' }, user: 'root', password: '1234567' },
  ],
};

function renderAt(path: string, tryIt: TryIt = TRY_IT): HTMLElement {
  const Stub = createRoutesStub([
    { path: '*', Component: () => <ProjectTryIt tryIt={tryIt} readme={README} /> },
  ]);
  const { container } = render(<Stub initialEntries={[path]} />);
  return container;
}

describe('ProjectTryIt', () => {
  it('introducción, pasos en orden (la flecha con icono) y la guía del README', async () => {
    const container = renderAt('/projects/x');
    expect(await screen.findByText('Log in and look around.')).toBeInTheDocument();
    const steps = within(container.querySelector('ol') as HTMLElement).getAllByRole('listitem');
    expect(steps.map((step) => step.textContent)).toEqual([
      'Log in.',
      'Go to Courses → All courses.',
    ]);
    expect(steps[1]?.querySelector('svg')).not.toBeNull();
    expect(
      screen.getByRole('link', { name: /^Read the full guide in the README/ }),
    ).toHaveAttribute('href', README);
  });

  it('cada cuenta con su nombre, usuario y contraseña, y un copiar por dato que dice cuál', async () => {
    renderAt('/projects/x');
    await screen.findByRole('heading', { level: 3, name: 'Demo accounts' });
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('root')).toBeInTheDocument();
    expect(screen.getByText('1234567')).toBeInTheDocument();
    for (const name of [
      'Copy username (User)',
      'Copy password (User)',
      'Copy username (Admin)',
      'Copy password (Admin)',
    ]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('los ids de lo que se copia son únicos y apuntan al valor', async () => {
    const container = renderAt('/projects/x');
    await screen.findByText('lisa12');
    const ids = [...container.querySelectorAll('code')].map((code) => code.id);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
    expect(document.getElementById(ids[3] ?? '')).toHaveTextContent('1234567');
  });

  it('en español', async () => {
    const container = renderAt('/es/projects/x');
    expect(
      await screen.findByRole('heading', { name: 'Cuentas de demostración' }),
    ).toBeInTheDocument();
    expect(container.querySelector('ol')).toHaveTextContent('Ve a Cursos → Todos los cursos.');
    expect(
      screen.getByRole('button', { name: 'Copiar contraseña (Administrador)' }),
    ).toBeInTheDocument();
  });

  it.each([
    ['/projects/x', 'Demo account'],
    ['/es/projects/x', 'Cuenta de demostración'],
  ])('%s con una sola cuenta: el título en singular', async (path, title) => {
    renderAt(path, { ...TRY_IT, credentials: TRY_IT.credentials.slice(0, 1) });
    expect((await screen.findByRole('heading', { level: 3 })).textContent).toBe(title);
  });

  it('sin cuentas de demo no pinta el bloque', async () => {
    renderAt('/projects/x', { ...TRY_IT, credentials: [] });
    await screen.findByText('Log in and look around.');
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
