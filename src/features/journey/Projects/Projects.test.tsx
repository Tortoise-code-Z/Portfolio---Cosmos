import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { projectEntries as projects } from '~/content/projects/entries';
import { uiTexts } from '~/content/texts';
import { localize } from '~/lib/i18n/localize/localize';
import {
  selectActiveProject,
  setActiveProject,
  setSceneLevel,
  setVisitedProject,
  turnSceneOff,
  useUiStore,
} from '~/stores/uiStore/uiStore';

import { Projects } from './Projects';

function renderAt(path: string): () => void {
  const { unmount } = render(
    <MemoryRouter initialEntries={[path]}>
      <Projects />
    </MemoryRouter>,
  );
  return unmount;
}

function pointed(): string | null {
  return selectActiveProject(useUiStore.getState());
}

/**
 * jsdom no sabe de dónde viene el foco (`:focus-visible` no distingue teclado de puntero): el test lo dice. Lo de
 * verdad lo prueba `plates.spec.ts` en el navegador.
 */
function focusFromKeyboard(fromKeyboard: boolean): void {
  // eslint-disable-next-line @typescript-eslint/unbound-method -- el original, para llamarlo con su `this` (`call`)
  const matches = Element.prototype.matches;
  vi.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, selector) {
    // Como en un navegador: solo casa el que tiene el foco (un `<li>` que nunca lo recibe, no).
    return selector === ':focus-visible'
      ? fromKeyboard && this === document.activeElement
      : matches.call(this, selector);
  });
}

/** El primer enlace de una fila («View project»). */
function linkOf(row: HTMLElement): HTMLElement {
  const link = row.querySelector<HTMLElement>('a[href]');
  if (link === null) throw new Error('Row without links');
  return link;
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

    it('back with the keyboard and the scene on, that focus points at its project (its plate lights); with the mouse, not', async () => {
      setSceneLevel('high');
      focusFromKeyboard(true);
      const router = renderJourney();
      setVisitedProject('astrohub');
      await act(() => router.navigate('/#projects'));
      expect(viewLink('AstroHub')).toHaveFocus();
      expect(pointed()).toBe('astrohub');
      vi.restoreAllMocks();
    });

    it('back with the mouse (the focus the code gives is not :focus-visible), nothing is pointed', async () => {
      setSceneLevel('high');
      focusFromKeyboard(false);
      const router = renderJourney();
      setVisitedProject('astrohub');
      await act(() => router.navigate('/#projects'));
      expect(viewLink('AstroHub')).toHaveFocus();
      expect(pointed()).toBeNull();
      vi.restoreAllMocks();
    });

    it('with no project seen, nothing happens', async () => {
      const router = renderJourney();
      await act(() => router.navigate('/#projects'));
      expect(document.body).toHaveFocus();
    });
  });

  describe('the plates of the turtle', () => {
    const [first, second] = ordered;
    if (first === undefined || second === undefined) throw new Error('Two projects needed');

    afterEach(() => {
      vi.restoreAllMocks();
      useUiStore.setState(useUiStore.getInitialState(), true);
    });

    /** Las reglas de un bloque del CSS de la fila: sus selectores (en cualquier orden) y su cuerpo. */
    function rowRules(block: string): { selectors: string[]; body: string }[] {
      return [...block.matchAll(/(^|\n)\s*([^{}@/]+?)\s*\{([^{}]*)\}/g)].map((match) => ({
        selectors: (match[2] ?? '')
          .split(',')
          .map((selector) => selector.trim())
          .sort(),
        body: match[3] ?? '',
      }));
    }

    /** El CSS de la fila, sin comentarios. */
    const rowCss = (): string =>
      readFileSync(
        join(dirname(fileURLToPath(import.meta.url)), '../ProjectRow/ProjectRow.module.css'),
        'utf8',
      ).replace(/\/\*[\s\S]*?\*\//g, '');

    /** El cuerpo de un `@media` del CSS de la fila (hasta su llave de cierre, en la primera columna). */
    function media(css: string, query: string): string {
      const start = css.indexOf(`@media ${query} {`);
      if (start === -1) throw new Error(`No @media ${query}`);
      return css.slice(start, css.indexOf('\n}', start));
    }

    it('amber is the focus in one of its links, the mouse over it or, with the scene, its pointed project (CSS)', () => {
      const css = rowCss();
      const top = css.replace(/@media[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
      expect(rowRules(top)).toEqual(
        expect.arrayContaining([
          {
            selectors: ['.row:focus-within', '.row[data-hot]'],
            body: expect.stringContaining('border-color: var(--color-star);') as string,
          },
          {
            selectors: ['.row:focus-within::before', '.row[data-hot]::before'],
            body: expect.stringContaining('opacity: 1;') as string,
          },
        ]),
      );
      // El `:hover`, solo donde se puede pasar por encima: en táctil se queda pegado tras el toque.
      expect(top).not.toContain(':hover');
      expect(rowRules(media(css, '(hover: hover)'))).toEqual([
        {
          selectors: ['.row:hover'],
          body: expect.stringContaining('border-color: var(--color-star);') as string,
        },
        {
          selectors: ['.row:hover::before'],
          body: expect.stringContaining('opacity: 1;') as string,
        },
      ]);
    });

    it('its pointer area reaches half the gap of the list (the gap it reads from there) and covers its own border', () => {
      const css = rowCss();
      const list = readFileSync(
        join(dirname(fileURLToPath(import.meta.url)), 'Projects.module.css'),
        'utf8',
      ).replace(/\/\*[\s\S]*?\*\//g, '');
      expect(list).toMatch(
        /\.rows \{[^}]*--_rows-gap: var\(--space-1\);[^}]*gap: var\(--_rows-gap\);/,
      );
      expect(rowRules(css)).toEqual(
        expect.arrayContaining([
          {
            selectors: ['.row::after'],
            body: expect.stringMatching(
              /inset-block: calc\(var\(--_rows-gap, 0px\) \/ -2\);\s+inset-inline: calc\(-1 \* var\(--border-width\)\) 0;/,
            ) as string,
          },
        ]),
      );
    });

    it('in Windows high contrast, the pointed row is painted with Highlight (the system evens out its colours)', () => {
      expect(rowRules(media(rowCss(), '(forced-colors: active)'))).toEqual([
        {
          selectors: ['.row[data-hot]'],
          body: expect.stringContaining('border-color: Highlight;') as string,
        },
      ]);
    });

    it('without the scene, a row points at nothing', () => {
      focusFromKeyboard(true);
      renderAt('/');
      const row = rowOf(first.name);
      fireEvent.pointerEnter(row, { pointerType: 'mouse' });
      fireEvent.focus(linkOf(row));
      fireEvent.click(row);
      expect(pointed()).toBeNull();
      expect(row).not.toHaveAttribute('data-hot');
    });

    it('the mouse points at its project on entering and lets it go on leaving (touch and pen enter nothing)', () => {
      setSceneLevel('high');
      renderAt('/');
      const row = rowOf(first.name);
      fireEvent.pointerEnter(row, { pointerType: 'touch' });
      fireEvent.pointerEnter(row, { pointerType: 'pen' });
      expect(pointed()).toBeNull();
      fireEvent.pointerEnter(row, { pointerType: 'mouse' });
      expect(pointed()).toBe(first.slug);
      expect(row).toHaveAttribute('data-hot', '');
      fireEvent.pointerLeave(row, { pointerType: 'touch' });
      expect(pointed()).toBe(first.slug);
      fireEvent.pointerLeave(row, { pointerType: 'mouse' });
      expect(pointed()).toBeNull();
      expect(row).not.toHaveAttribute('data-hot');
    });

    it('the keyboard focus on one of its links points at it; focus moving inside the row keeps it; leaving lets it go', () => {
      setSceneLevel('medium');
      focusFromKeyboard(true);
      vi.spyOn(document, 'hasFocus').mockReturnValue(true);
      renderAt('/');
      const row = rowOf(first.name);
      const links = within(row).getAllByRole('link');
      act(() => {
        links[0]?.focus();
      });
      expect(pointed()).toBe(first.slug);
      // Ni un instante de «suelto» al pasar de un enlace a otro de la misma fila.
      const listener = vi.fn();
      const unsubscribe = useUiStore.subscribe(listener);
      act(() => {
        links.at(-1)?.focus();
      });
      unsubscribe();
      expect(listener).not.toHaveBeenCalled();
      expect(pointed()).toBe(first.slug);
      act(() => {
        linkOf(rowOf(second.name)).focus();
      });
      expect(pointed()).toBe(second.slug);
      expect(row).not.toHaveAttribute('data-hot');
      act(() => {
        linkOf(rowOf(second.name)).blur();
      });
      expect(pointed()).toBeNull();
    });

    it("only the keyboard focus points: the pointer focus does not (nor the one given back on returning to the tab, unless it was the keyboard's)", () => {
      setSceneLevel('high');
      focusFromKeyboard(false);
      renderAt('/');
      act(() => {
        linkOf(rowOf(first.name)).focus();
      });
      expect(pointed()).toBeNull();
    });

    it('leaving the window is not letting go: a blur while the document has no focus keeps it', () => {
      setSceneLevel('high');
      focusFromKeyboard(true);
      renderAt('/');
      const link = linkOf(rowOf(first.name));
      act(() => {
        link.focus();
      });
      vi.spyOn(document, 'hasFocus').mockReturnValue(false);
      fireEvent.blur(link);
      expect(pointed()).toBe(first.slug);
    });

    it('the last gesture wins: the mouse leaving a row that is no longer pointed keeps the other one', () => {
      setSceneLevel('high');
      focusFromKeyboard(true);
      renderAt('/');
      fireEvent.pointerEnter(rowOf(first.name), { pointerType: 'mouse' });
      act(() => {
        linkOf(rowOf(second.name)).focus();
      });
      expect(pointed()).toBe(second.slug);
      fireEvent.pointerLeave(rowOf(first.name), { pointerType: 'mouse' });
      expect(pointed()).toBe(second.slug);
    });

    it('a tap points at its project, another tap switches, a tap outside turns it off', () => {
      setSceneLevel('low');
      renderAt('/');
      fireEvent.click(rowOf(first.name));
      expect(pointed()).toBe(first.slug);
      fireEvent.click(within(rowOf(second.name)).getByRole('heading', { level: 3 }));
      expect(pointed()).toBe(second.slug);
      fireEvent.click(screen.getByRole('heading', { level: 2 }));
      expect(pointed()).toBeNull();
    });

    it('a project pointed from the scene (a pin) is marked in its row', () => {
      setSceneLevel('high');
      renderAt('/');
      act(() => {
        setActiveProject(second.slug);
      });
      expect(rowOf(second.name)).toHaveAttribute('data-hot', '');
      expect(rowOf(first.name)).not.toHaveAttribute('data-hot');
    });

    it('nothing stays pointed when the journey goes away (a project page) or the scene turns off', () => {
      setSceneLevel('high');
      const unmount = renderAt('/');
      fireEvent.click(rowOf(first.name));
      expect(pointed()).toBe(first.slug);
      unmount();
      expect(pointed()).toBeNull();

      renderAt('/');
      fireEvent.click(rowOf(second.name));
      expect(pointed()).toBe(second.slug);
      act(() => {
        turnSceneOff();
      });
      expect(pointed()).toBeNull();
      expect(rowOf(second.name)).not.toHaveAttribute('data-hot');
      fireEvent.click(rowOf(second.name));
      expect(pointed()).toBeNull();
    });
  });
});
