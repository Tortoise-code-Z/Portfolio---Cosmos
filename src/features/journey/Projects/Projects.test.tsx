import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { projects } from '~/content/projects';

import { Projects } from './Projects';

function renderAt(path: string): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Projects />
    </MemoryRouter>,
  );
}

const ordered = [...projects].sort((a, b) => a.order - b.order);

describe('Projects', () => {
  it('region #projects with one row per project, in reading order', () => {
    renderAt('/');
    const region = screen.getByRole('region', { name: 'What I carry on my shell' });
    expect(region).toHaveAttribute('id', 'projects');
    expect(
      within(region)
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(ordered.map((project) => project.name));
  });

  it.each(ordered.map((project) => [project.name, project] as const))(
    '%s: page, demo (if any) and code links, named with the project',
    (name, project) => {
      renderAt('/es');
      expect(screen.getByRole('link', { name: `Ver proyecto, ${name}` })).toHaveAttribute(
        'href',
        `/es/projects/${project.slug}`,
      );
      const code = screen.getByRole('link', {
        name: `Código, ${name} (se abre en una pestaña nueva)`,
      });
      expect(code).toHaveAttribute('href', project.links.code);
      const demo = screen.queryByRole('link', {
        name: `Demo, ${name} (se abre en una pestaña nueva)`,
      });
      if (project.links.demo === null) expect(demo).toBeNull();
      else expect(demo).toHaveAttribute('href', project.links.demo);
    },
  );

  it('only the featured project carries the «Featured» label', () => {
    renderAt('/');
    const featured = projects.filter((project) => project.featured);
    expect(screen.getAllByText('Featured')).toHaveLength(featured.length);
  });

  it('meta line: role, context and core stack in the active language', () => {
    renderAt('/es');
    const first = ordered[0];
    if (first === undefined) throw new Error('No projects');
    const row = screen.getByRole('heading', { name: first.name }).closest('li');
    if (row === null) throw new Error('Row not found');
    const meta = row.querySelector('[data-meta]');
    expect(meta?.textContent).toContain('Proyecto personal');
    expect(within(row).getByText(first.summary.es)).toBeInTheDocument();
  });
});
