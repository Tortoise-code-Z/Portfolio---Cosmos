import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { selectQuickMissionOpen, useUiStore } from '~/stores/uiStore/uiStore';

import { QUICK_OPENER_ID } from '../quickMission/quickMission';
import { TopBar } from './TopBar';

/** Perfil real con el CV como interruptor. */
const state = vi.hoisted(() => ({ cvEn: null as string | null }));

vi.mock('~/content/profile', async (importOriginal) => {
  const original = await importOriginal<typeof import('~/content/profile')>();
  return {
    get profile() {
      return { ...original.profile, cv: { en: state.cvEn, es: null } };
    },
  };
});

/** Enseña la dirección del router: así se ve si un enlace navegó en vez de saltar. */
function Location(): ReactNode {
  const { pathname, hash } = useLocation();
  return <output>{pathname + hash}</output>;
}

function renderBar(path = '/'): HTMLElement {
  render(
    <MemoryRouter initialEntries={[path]}>
      <TopBar />
      <Location />
    </MemoryRouter>,
  );
  return screen.getByRole('banner');
}

const routerAt = (): string | null => screen.getByRole('status').textContent;

/**
 * Si algo canceló el clic, mirado al final de su recorrido (después de React). Después lo cancela
 * para que jsdom no intente abrir otra pestaña.
 */
function recordPrevented(): { readonly prevented: boolean[]; stop: () => void } {
  const prevented: boolean[] = [];
  const record = (event: Event): void => {
    prevented.push(event.defaultPrevented);
    event.preventDefault();
  };
  window.addEventListener('click', record);
  return {
    prevented,
    stop: () => {
      window.removeEventListener('click', record);
    },
  };
}

function addChapter(index: number, id: string, title: string): ReturnType<typeof vi.fn> {
  const chapter = document.createElement('section');
  chapter.dataset.chapter = String(index);
  chapter.id = id;
  chapter.setAttribute('aria-labelledby', `${id}-title`);
  chapter.innerHTML = `<h2 id="${id}-title" tabindex="-1">${title}</h2>`;
  const scrollIntoView = vi.fn();
  chapter.scrollIntoView = scrollIntoView;
  document.body.append(chapter);
  return scrollIntoView;
}

beforeEach(() => {
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  useUiStore.setState(useUiStore.getInitialState(), true);
  state.cvEn = null;
  document.body.replaceChildren();
});

describe('TopBar', () => {
  it('is the banner: logo home, Projects, Contact and the language pair, as real links', () => {
    const bar = renderBar();
    expect(within(bar).getByRole('link', { name: 'TORTOISE_CODE' })).toHaveAttribute('href', '/');
    expect(within(bar).getByRole('link', { name: 'Projects' })).toHaveAttribute(
      'href',
      '/#projects',
    );
    expect(within(bar).getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/#contact');
    expect(within(bar).getByRole('group', { name: 'Language' })).toBeInTheDocument();
  });

  it('has no CV link without its PDF', () => {
    const bar = renderBar();
    expect(within(bar).queryByRole('link', { name: 'CV' })).toBeNull();
  });

  it('carries the availability chip, a link to Contact, first among the actions', () => {
    const bar = renderBar();
    const chip = within(bar).getByRole('link', { name: 'Open to work' });
    expect(chip).toHaveAttribute('href', '/#contact');
    expect(within(bar).getAllByRole('link')[1]).toBe(chip);
  });

  it.each([
    ['/', 'Quick mission', 'Quick'],
    ['/es', 'Modo misión rápida', 'Rápida'],
  ])(
    '%s: «%s» is a button that opens a dialog, last in the bar, with a short label inside its name',
    (path, name, short) => {
      const bar = renderBar(path);
      const button = within(bar).getByRole('button', { name });
      expect(button).toHaveAttribute('aria-haspopup', 'dialog');
      expect(button).toHaveAttribute('id', QUICK_OPENER_ID);
      expect(within(button).getByText(short)).toBeInTheDocument();
      // Etiqueta en el nombre (WCAG 2.5.3): la forma corta que se ve en móvil está dentro del nombre.
      expect(name.toLowerCase()).toContain(short.toLowerCase());
      const focusable = bar.querySelectorAll('a, button');
      expect(focusable[focusable.length - 1]).toBe(button);
    },
  );

  it('the quick mission button opens the mode', async () => {
    const bar = renderBar();
    await userEvent.click(within(bar).getByRole('button', { name: 'Quick mission' }));
    expect(selectQuickMissionOpen(useUiStore.getState())).toBe(true);
  });

  it('shows the CV link when the PDF of the language exists', () => {
    state.cvEn = '/cv/victor-perez-en.pdf';
    const bar = renderBar();
    expect(within(bar).getByRole('link', { name: 'CV' })).toHaveAttribute(
      'href',
      '/cv/victor-perez-en.pdf',
    );
  });

  it('speaks Spanish in /es, with its links', () => {
    const bar = renderBar('/es');
    expect(within(bar).getByRole('link', { name: 'Proyectos' })).toHaveAttribute(
      'href',
      '/es#projects',
    );
    expect(within(bar).getByRole('link', { name: 'TORTOISE_CODE' })).toHaveAttribute('href', '/es');
  });

  it('in the journey, Projects jumps like the rail: title focused, anchor in place', async () => {
    const bar = renderBar();
    const scrollIntoView = addChapter(3, 'projects', 'What I carry on my shell');
    await userEvent.click(within(bar).getByRole('link', { name: 'Projects' }));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { name: 'What I carry on my shell' }),
    );
    expect(window.location.hash).toBe('#projects');
    // Un salto, no una navegación: el router sigue donde estaba (sin otra entrada en el historial).
    expect(routerAt()).toBe('/');
  });

  it('outside the journey (no chapters), a link just navigates', async () => {
    const bar = renderBar('/projects/chessmate');
    await userEvent.click(within(bar).getByRole('link', { name: 'Projects' }));
    expect(routerAt()).toBe('/#projects');
  });

  it('the logo goes back to the start: focus on the name and no anchor', async () => {
    window.history.replaceState(null, '', '/#contact');
    const bar = renderBar();
    const scrollIntoView = addChapter(0, 'hero', 'Víctor Pérez');
    await userEvent.click(within(bar).getByRole('link', { name: 'TORTOISE_CODE' }));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Víctor Pérez' }));
    expect(window.location.hash).toBe('');
  });

  it('Ctrl+click is left to the browser (new tab), not hijacked', async () => {
    const bar = renderBar();
    const scrollIntoView = addChapter(4, 'contact', 'Touchdown');
    const { prevented, stop } = recordPrevented();
    const user = userEvent.setup();
    await user.keyboard('{Control>}');
    await user.click(within(bar).getByRole('link', { name: 'Contact' }));
    await user.keyboard('{/Control}');
    stop();
    expect(prevented).toEqual([false]);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it.each([
    ['Cmd', { metaKey: true }],
    ['Shift', { shiftKey: true }],
    ['Alt', { altKey: true }],
    ['the middle button', { button: 1 }],
  ])('a click with %s is left to the browser too', (_name, init) => {
    const bar = renderBar();
    const scrollIntoView = addChapter(4, 'contact', 'Touchdown');
    const { prevented, stop } = recordPrevented();
    fireEvent.click(within(bar).getByRole('link', { name: 'Contact' }), init);
    stop();
    expect(prevented).toEqual([false]);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
