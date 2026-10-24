import { render, screen, within } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';

import { profile } from '~/content/profile';
import { projects } from '~/content/projects';

import { neighbours, type Neighbours } from '../neighbours/neighbours';
import { ProjectPager } from './ProjectPager';

function renderAt(path: string, around: Neighbours): void {
  const Stub = createRoutesStub([
    { path: '*', Component: () => <ProjectPager neighbours={around} contact={profile.contact} /> },
  ]);
  render(<Stub initialEntries={[path]} />);
}

describe('ProjectPager', () => {
  it('anterior y siguiente con su nombre y su ruta del idioma', async () => {
    renderAt('/projects/astrohub', neighbours(projects, 'astrohub'));
    const nav = await screen.findByRole('navigation', { name: 'More projects' });
    const prev = within(nav).getByRole('link', { name: 'Previous project Chessmate' });
    const next = within(nav).getByRole('link', { name: 'Next project Cosmos' });
    expect(prev).toHaveAttribute('href', '/projects/chessmate');
    expect(prev).toHaveAttribute('rel', 'prev');
    expect(next).toHaveAttribute('href', '/projects/cosmos');
    expect(next).toHaveAttribute('rel', 'next');
  });

  it('en español, y sin anterior en el primero', async () => {
    renderAt('/es/projects/chessmate', neighbours(projects, 'chessmate'));
    const nav = await screen.findByRole('navigation', { name: 'Más proyectos' });
    expect(within(nav).getAllByRole('link')).toHaveLength(1);
    expect(within(nav).getByRole('link', { name: 'Siguiente proyecto AstroHub' })).toHaveAttribute(
      'href',
      '/es/projects/astrohub',
    );
  });

  it('sin vecinos no hay navegación, pero sí el contacto', async () => {
    renderAt('/projects/x', { prev: undefined, next: undefined });
    const contact = await screen.findByRole('list', { name: 'Contact' });
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(within(contact).getByRole('link', { name: /^GitHub/ })).toHaveAttribute(
      'href',
      profile.contact.github,
    );
    expect(within(contact).getByRole('link', { name: /^LinkedIn/ })).toHaveAttribute(
      'href',
      profile.contact.linkedin,
    );
    expect(within(contact).getByRole('link', { name: profile.contact.email })).toHaveAttribute(
      'href',
      `mailto:${profile.contact.email}`,
    );
  });
});
