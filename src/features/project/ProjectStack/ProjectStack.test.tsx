import { render, screen, within } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';

import type { Project } from '~/content/types';

import { hasStack, ProjectStack } from './ProjectStack';

const STACK: Project['stack'] = {
  core: ['React', 'TypeScript'],
  libraries: [],
  design: [{ en: 'Responsive design', es: 'Diseño responsive' }],
  tooling: ['Vite'],
};

const EMPTY: Project['stack'] = { core: [], libraries: [], design: [], tooling: [] };

function renderAt(path: string, stack: Project['stack']): void {
  const Stub = createRoutesStub([{ path: '*', Component: () => <ProjectStack stack={stack} /> }]);
  render(<Stub initialEntries={[path]} />);
}

describe('ProjectStack', () => {
  it('un h3 por grupo con etiquetas, en orden; el grupo vacío no se pinta', async () => {
    renderAt('/projects/x', STACK);
    const titles = await screen.findAllByRole('heading', { level: 3 });
    expect(titles.map((title) => title.textContent)).toEqual([
      'Languages & frameworks',
      'Design & styling',
      'Tooling',
    ]);
    const [core] = screen.getAllByRole('list');
    if (core === undefined) throw new Error('sin listas de etiquetas');
    expect(
      within(core)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['React', 'TypeScript']);
  });

  it('las etiquetas traducibles salen en el idioma de la página', async () => {
    renderAt('/es/projects/x', STACK);
    expect(await screen.findByText('Diseño responsive')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Diseño y estilos' })).toBeInTheDocument();
  });

  it('hasStack: falso solo si los cuatro grupos están vacíos', () => {
    expect(hasStack(STACK)).toBe(true);
    expect(hasStack(EMPTY)).toBe(false);
    expect(hasStack({ ...EMPTY, tooling: ['Git'] })).toBe(true);
  });
});
