import { act, render, screen, within } from '@testing-library/react';
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { projects } from '~/content/projects';
import { uiTexts } from '~/content/texts';
import { localize } from '~/lib/i18n/localize/localize';
import { setVisitedProject, useUiStore } from '~/stores/uiStore/uiStore';

import { Projects } from './Projects';

function renderAt(path: string): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Projects />
    </MemoryRouter>,
  );
}

const ordered = [...projects].sort((a, b) => a.order - b.order);

/** La fila (`<li>`) del proyecto con ese nombre. */
function rowOf(name: string): HTMLElement {
  const row = screen.getByRole('heading', { name }).closest('li');
  if (row === null) throw new Error(`Row of ${name} not found`);
  return row;
}

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
      expect(screen.getByRole('link', { name: `Ver proyecto ${name}` })).toHaveAttribute(
        'href',
        `/es/projects/${project.slug}`,
      );
      const code = screen.getByRole('link', {
        name: `Código ${name} (se abre en una pestaña nueva)`,
      });
      expect(code).toHaveAttribute('href', project.links.code);
      const demo = screen.queryByRole('link', {
        name: `Demo ${name} (se abre en una pestaña nueva)`,
      });
      if (project.links.demo === null) expect(demo).toBeNull();
      else expect(demo).toHaveAttribute('href', project.links.demo);
    },
  );

  it.each(ordered.map((project) => [project.name, project] as const))(
    '%s: the «Featured» label sits in its row only if the project is featured',
    (name, project) => {
      renderAt('/');
      const row = rowOf(name);
      if (project.featured) expect(within(row).getByText('Featured')).toBeInTheDocument();
      else expect(within(row).queryByText('Featured')).toBeNull();
    },
  );

  it.each(ordered.map((project) => [project.name, project] as const))(
    '%s: meta line with role, context and core stack in the active language, then the summary',
    (name, project) => {
      renderAt('/es');
      const row = rowOf(name);
      const meta = row.querySelector('[data-meta]');
      if (!(meta instanceof HTMLElement)) throw new Error('Meta line not found');
      const items = within(meta)
        .getAllByRole('listitem')
        .map((item) => item.textContent);
      expect(items).toContain(uiTexts.es[`projects.role.${project.role}`]);
      expect(items).toContain(uiTexts.es[`projects.context.${project.context}`]);
      for (const label of project.stack.core) expect(items).toContain(localize('es', label));
      expect(within(row).getByText(project.summary.es)).toBeInTheDocument();
    },
  );

  describe('back from a project page', () => {
    afterEach(() => {
      useUiStore.setState(useUiStore.getInitialState(), true);
    });

    /** Viaje en `/`, una página de proyecto y la navegación de verdad entre las dos (PUSH y POP). */
    function renderJourney(): ReturnType<typeof createMemoryRouter> {
      const router = createMemoryRouter(
        [
          { path: '/', Component: Projects },
          { path: '/projects/:slug', Component: () => <p>project page</p> },
        ],
        { initialEntries: ['/projects/astrohub'] },
      );
      render(<RouterProvider router={router} />);
      return router;
    }

    const viewLink = (name: string): HTMLElement =>
      within(rowOf(name)).getByRole('link', { name: `View project ${name}` });

    it('«Back to the shell» (/#projects): the focus lands on that row and scrolls it into view', async () => {
      const router = renderJourney();
      setVisitedProject('astrohub');
      const focus = vi.spyOn(HTMLElement.prototype, 'focus');
      await act(() => router.navigate('/#projects'));
      expect(viewLink('AstroHub')).toHaveFocus();
      // El enlace no restaura scroll: el foco tiene que traer la fila a la vista.
      expect(focus).toHaveBeenCalledWith({ preventScroll: false });
      focus.mockRestore();
    });

    it('the browser Back button: the same row, without moving the restored scroll', async () => {
      const router = createMemoryRouter(
        [
          { path: '/', Component: Projects },
          { path: '/projects/:slug', Component: () => <p>project page</p> },
        ],
        { initialEntries: ['/', '/projects/cosmos'], initialIndex: 1 },
      );
      render(<RouterProvider router={router} />);
      setVisitedProject('cosmos');
      const focus = vi.spyOn(HTMLElement.prototype, 'focus');
      await act(() => router.navigate(-1));
      expect(viewLink('Cosmos')).toHaveFocus();
      expect(focus).toHaveBeenCalledWith({ preventScroll: true });
      focus.mockRestore();
    });

    it('elsewhere in the journey (logo, #contact): the focus is left alone and the visit is forgotten', async () => {
      const router = renderJourney();
      setVisitedProject('astrohub');
      await act(() => router.navigate('/#contact'));
      expect(document.body).toHaveFocus();
      expect(useUiStore.getState().visitedProject).toBeNull();
    });

    it('with no project seen, nothing happens', async () => {
      const router = renderJourney();
      await act(() => router.navigate('/#projects'));
      expect(document.body).toHaveFocus();
    });
  });
});
