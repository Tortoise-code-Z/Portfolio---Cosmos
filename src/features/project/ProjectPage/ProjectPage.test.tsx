import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';

import { projects } from '~/content/projects';
import type { Project } from '~/content/types';

import { ProjectPage } from './ProjectPage';

function bySlug(slug: string): Project {
  const project = projects.find((candidate) => candidate.slug === slug);
  if (project === undefined) throw new Error(`ProjectPage.test: no hay proyecto «${slug}»`);
  return project;
}

function renderAt(path: string, project: Project): HTMLElement {
  const Stub = createRoutesStub([
    { path: '*', Component: () => <ProjectPage project={project} /> },
  ]);
  const { container } = render(<Stub initialEntries={[path]} />);
  return container;
}

const h2s = (): (string | null)[] =>
  screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);

describe('ProjectPage', () => {
  it('Chessmate: todas las secciones con datos, en el orden de la spec', async () => {
    renderAt('/projects/chessmate', bySlug('chessmate'));
    await screen.findByRole('heading', { level: 1, name: 'Chessmate' });
    expect(h2s()).toEqual([
      'About the project',
      'Key features',
      'Tech stack',
      'Development process',
      'Notes',
      'Try it',
      'Gallery',
    ]);
    expect(
      screen.getByRole('heading', { level: 3, name: 'Technical highlights' }),
    ).toBeInTheDocument();
  });

  it('cada sección se nombra con su título (región con nombre)', async () => {
    renderAt('/projects/chessmate', bySlug('chessmate'));
    await screen.findByRole('main');
    expect(screen.getByRole('region', { name: 'Tech stack' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Try it' })).toBeInTheDocument();
  });

  it('Cosmos (sin proceso, retos ni «Try it»): esas secciones no se pintan', async () => {
    renderAt('/es/projects/cosmos', bySlug('cosmos'));
    await screen.findByRole('heading', { level: 1, name: 'Cosmos' });
    expect(h2s()).toEqual(['Sobre el proyecto', 'Funcionalidades', 'Stack tecnológico', 'Notas']);
  });

  it('solo retos, sin párrafos de proceso: van con su propio h2', async () => {
    const chessmate = bySlug('chessmate');
    renderAt('/projects/chessmate', { ...chessmate, process: { en: [], es: [] } });
    await screen.findByRole('main');
    expect(h2s()).toContain('Technical highlights');
    expect(h2s()).not.toContain('Development process');
    expect(screen.queryByRole('heading', { level: 3, name: 'Technical highlights' })).toBeNull();
  });

  it('un proyecto vacío solo pinta la cabecera y el pie', async () => {
    const chessmate = bySlug('chessmate');
    const empty: Project = {
      ...chessmate,
      about: { en: [], es: [] },
      features: [],
      stack: { core: [], libraries: [], design: [], tooling: [] },
      process: { en: [], es: [] },
      highlights: [],
      notes: [],
      tryIt: null,
      cover: null,
      gallery: [],
    };
    const container = renderAt('/projects/chessmate', empty);
    await screen.findByRole('heading', { level: 1, name: 'Chessmate' });
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0);
    expect(container.querySelector('figure')).toBeNull();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('con portada: imagen con sus medidas y el texto alternativo del idioma', async () => {
    const chessmate = bySlug('chessmate');
    const cover = {
      src: '/images/chessmate/cover.webp',
      width: 1600,
      height: 900,
      sources: {
        avif: '/images/chessmate/cover.avif 1600w',
        webp: '/images/chessmate/cover.webp 1600w',
      },
      alt: { en: 'Chessmate home page', es: 'Inicio de Chessmate' },
      share: { src: '/images/chessmate/cover.jpeg', width: 1200, height: 675 },
    };
    renderAt('/es/projects/chessmate', { ...chessmate, cover });
    const image = await screen.findByRole('img', { name: 'Inicio de Chessmate' });
    expect(image).toHaveAttribute('src', cover.src);
    expect(image).toHaveAttribute('width', '1600');
    expect(image).toHaveAttribute('height', '900');
  });

  it('con galería: su sección va detrás de «Try it», antes del pie', async () => {
    const chessmate = bySlug('chessmate');
    const gallery = [
      {
        src: '/g/1.webp',
        width: 1600,
        height: 900,
        sources: { avif: '/g/1.avif 1600w', webp: '/g/1.webp 1600w' },
        alt: { en: 'Home page', es: 'Inicio' },
      },
    ];
    renderAt('/projects/chessmate', { ...chessmate, gallery });
    await screen.findByRole('main');
    expect(h2s().slice(-2)).toEqual(['Try it', 'Gallery']);
    expect(screen.getByRole('button', { name: 'Open image 1 of 1 Home page' })).toBeInTheDocument();
  });

  it('un solo main, un solo h1 y ningún salto de nivel en los títulos', async () => {
    renderAt('/projects/astrohub', bySlug('astrohub'));
    await screen.findByRole('main');
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const levels = screen
      .getAllByRole('heading')
      .map((heading) => Number(heading.tagName.slice(1)));
    levels.forEach((level, index) => {
      if (index > 0) expect(level - (levels[index - 1] ?? level)).toBeLessThanOrEqual(1);
    });
  });
});
