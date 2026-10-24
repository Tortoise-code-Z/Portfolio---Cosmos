import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  closeQuickMission,
  openQuickMission,
  selectQuickMissionOpen,
  useUiStore,
} from '~/stores/uiStore/uiStore';

import { QUICK_OPENER_ID } from '../quickMission/quickMission';
import { QuickMissionDialog } from './QuickMissionDialog';

/**
 * jsdom no implementa `showModal` ni `close`: lo mínimo del navegador. `showModal` pone `open`;
 * `close` lo quita y lanza `close`, que es lo que hace también `Esc` en un navegador de verdad.
 */
const showModal = vi.fn(function (this: HTMLDialogElement) {
  this.setAttribute('open', '');
});
const close = vi.fn(function (this: HTMLDialogElement) {
  if (!this.hasAttribute('open')) return;
  this.removeAttribute('open');
  this.dispatchEvent(new Event('close'));
});

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = showModal;
  HTMLDialogElement.prototype.close = close;
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  useUiStore.setState(useUiStore.getInitialState(), true);
  showModal.mockClear();
  close.mockClear();
});

function renderDialog(path = '/'): { unmount: () => void } {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <button type="button" id={QUICK_OPENER_ID}>
        Quick mission
      </button>
      <QuickMissionDialog />
    </MemoryRouter>,
  );
}

/** El `<dialog>` cerrado no está en el árbol accesible: se busca por su etiqueta. */
const dialogElement = (): HTMLDialogElement => {
  const dialog = document.querySelector('dialog');
  if (dialog === null) throw new Error('No <dialog> rendered');
  return dialog;
};

const isOpen = (): boolean => selectQuickMissionOpen(useUiStore.getState());
const address = (): string => window.location.pathname + window.location.hash;

describe('QuickMissionDialog', () => {
  it('closed, it is an empty <dialog>: the pre-rendered page does not repeat the journey', () => {
    renderDialog();
    expect(dialogElement()).not.toHaveAttribute('open');
    expect(dialogElement()).toBeEmptyDOMElement();
  });

  it('opens as a modal named by its title, with the focus on «Back to the journey»', () => {
    renderDialog();
    act(() => {
      openQuickMission();
    });
    expect(showModal).toHaveBeenCalledTimes(1);
    const dialog = screen.getByRole('dialog', { name: 'Víctor Pérez · Frontend Developer' });
    // El rótulo no alarga el nombre: el lector lo añade como descripción al abrir.
    expect(dialog).toHaveAccessibleDescription('Quick mission · everything on one page');
    expect(screen.getByRole('button', { name: 'Back to the journey' })).toHaveFocus();
  });

  it('writes #quick in place (shareable, no history entry) and gives back the old anchor on close', async () => {
    window.history.replaceState(null, '', '/#about');
    const length = window.history.length;
    renderDialog();
    act(() => {
      openQuickMission();
    });
    expect(address()).toBe('/#quick');
    expect(window.history.length).toBe(length);

    await userEvent.click(screen.getByRole('button', { name: 'Back to the journey' }));
    expect(close).toHaveBeenCalledTimes(1);
    expect(isOpen()).toBe(false);
    expect(address()).toBe('/#about');
    expect(dialogElement()).toBeEmptyDOMElement();
  });

  it('Esc (the browser closes the dialog) also closes it and the focus goes back to the bar button', () => {
    renderDialog();
    act(() => {
      openQuickMission();
    });
    act(() => {
      dialogElement().close();
    });
    expect(isOpen()).toBe(false);
    expect(document.getElementById(QUICK_OPENER_ID)).toHaveFocus();
  });

  it('/#quick opens it on load; closing leaves the address without an anchor', () => {
    window.history.replaceState(null, '', '/es#quick');
    renderDialog('/es');
    expect(isOpen()).toBe(true);
    expect(
      screen.getByRole('dialog', { name: 'Víctor Pérez · Desarrollador Frontend' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Volver al viaje' })).toHaveFocus();

    act(() => {
      dialogElement().close();
    });
    expect(address()).toBe('/es');
    expect(document.getElementById(QUICK_OPENER_ID)).toHaveFocus();
  });

  it('a #quick written later (hashchange) opens it too; another anchor does not', () => {
    renderDialog();
    act(() => {
      window.history.replaceState(null, '', '/#skills');
      fireEvent(window, new HashChangeEvent('hashchange'));
    });
    expect(isOpen()).toBe(false);
    act(() => {
      window.history.replaceState(null, '', '/#quick');
      fireEvent(window, new HashChangeEvent('hashchange'));
    });
    expect(isOpen()).toBe(true);
  });

  it('closing from the store (not from the dialog) closes the <dialog> as well', () => {
    renderDialog();
    act(() => {
      openQuickMission();
    });
    act(() => {
      closeQuickMission();
    });
    expect(close).toHaveBeenCalledTimes(1);
    expect(dialogElement()).not.toHaveAttribute('open');
  });

  it('leaving the journey while open forgets it, so it does not pop up again on return', () => {
    const { unmount } = renderDialog();
    act(() => {
      openQuickMission();
    });
    unmount();
    expect(isOpen()).toBe(false);
  });

  it('a page that mounts it while it is still open from the previous one (no #quick): closes, does not reopen', () => {
    // Un enlace del modo lleva a un proyecto, que también lo monta: el estado llega abierto.
    window.history.replaceState(null, '', '/projects/chessmate');
    openQuickMission();
    renderDialog('/projects/chessmate');
    expect(showModal).not.toHaveBeenCalled();
    expect(isOpen()).toBe(false);
    expect(address()).toBe('/projects/chessmate');
  });

  it('mounted with #quick in the address and the state open, it opens', () => {
    window.history.replaceState(null, '', '/#quick');
    openQuickMission();
    renderDialog('/#quick');
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(isOpen()).toBe(true);
  });

  it('does not touch an address that is no longer #quick (a link took you elsewhere)', () => {
    window.history.replaceState(null, '', '/#about');
    renderDialog();
    act(() => {
      openQuickMission();
    });
    window.history.replaceState(null, '', '/projects/chessmate');
    act(() => {
      dialogElement().close();
    });
    expect(address()).toBe('/projects/chessmate');
  });

  it('stops listening to the address after unmounting', () => {
    const { unmount } = renderDialog();
    unmount();
    window.history.replaceState(null, '', '/#quick');
    fireEvent(window, new HashChangeEvent('hashchange'));
    expect(isOpen()).toBe(false);
  });
});
