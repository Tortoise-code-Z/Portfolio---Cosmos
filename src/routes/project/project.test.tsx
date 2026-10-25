import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createBrowserRouter, createRoutesStub, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { openQuickMission, useUiStore } from '~/stores/uiStore/uiStore';

import ProjectRoute from './project';

const Stub = createRoutesStub([
  { path: '/', Component: () => <p>home</p> },
  { path: '/projects/:slug', Component: ProjectRoute },
  { path: '/es/projects/:slug', Component: ProjectRoute },
]);

/** jsdom no implementa `showModal` ni `close` del `<dialog>` (como en QuickMissionDialog.test.tsx). */
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
  window.localStorage.clear();
  useUiStore.setState(useUiStore.getInitialState(), true);
});

/** Lo enfocable de la página en orden de documento (el del Tab: nada usa `tabindex` positivo). */
function focusableNames(): string[] {
  return [...document.querySelectorAll<HTMLElement>('a[href], button')].map(
    (element) => element.getAttribute('aria-label') ?? element.textContent.trim(),
  );
}

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

  it('al cargar la página, el foco no se mueve; «Next project» lleva el foco al nombre del siguiente', async () => {
    render(<Stub initialEntries={['/projects/chessmate']} />);
    expect(await screen.findByRole('heading', { level: 1 })).not.toHaveFocus();
    await userEvent.click(screen.getByRole('link', { name: /Next project\s+AstroHub/ }));
    const title = await screen.findByRole('heading', { level: 1, name: 'AstroHub' });
    expect(title).toHaveFocus();
  });

  it('un enlace del modo misión rápida a otro proyecto cierra el modo (la ficha se rehace)', async () => {
    // Con la dirección real (no en memoria): el modo mira el ancla de `window.location`.
    window.history.replaceState(null, '', '/projects/chessmate');
    const router = createBrowserRouter([{ path: '/projects/:slug', Component: ProjectRoute }]);
    render(<RouterProvider router={router} />);
    await screen.findByRole('heading', { level: 1, name: 'Chessmate' });
    act(() => {
      openQuickMission();
    });
    const dialog = screen.getByRole('dialog', { name: /Víctor Pérez/ });
    expect(dialog).toHaveAttribute('open');
    await userEvent.click(within(dialog).getByRole('link', { name: /View project\s*AstroHub/ }));
    await screen.findByRole('heading', { level: 1, name: 'AstroHub' });
    expect(useUiStore.getState().quickMissionOpen).toBe(false);
    expect(document.querySelector('dialog')).not.toHaveAttribute('open');
    expect(window.location.pathname + window.location.hash).toBe('/projects/astrohub');
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
  it('la sugerencia de idioma va la última en el orden del Tab, también en la ficha', async () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['es-ES']);
    render(<Stub initialEntries={['/projects/chessmate']} />);
    const accept = await screen.findByRole('link', { name: 'Ver en español' });
    expect(
      (document.querySelector('dialog') as Node).compareDocumentPosition(accept) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(focusableNames().slice(-2)).toEqual(['Ver en español', 'No, gracias']);
  });
});
