import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

function renderBar(path = '/'): HTMLElement {
  render(
    <MemoryRouter initialEntries={[path]}>
      <TopBar />
    </MemoryRouter>,
  );
  return screen.getByRole('banner');
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

  it('has no quick mission button nor availability chip yet (F2.6) and no CV without its PDF', () => {
    const bar = renderBar();
    expect(within(bar).queryByRole('button')).toBeNull();
    expect(within(bar).queryByText('Open to work')).toBeNull();
    expect(within(bar).queryByRole('link', { name: 'CV' })).toBeNull();
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
    expect(scrollIntoView).toHaveBeenCalled();
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { name: 'What I carry on my shell' }),
    );
    expect(window.location.hash).toBe('#projects');
  });

  it('the logo goes back to the start: focus on the name and no anchor', async () => {
    window.history.replaceState(null, '', '/#contact');
    const bar = renderBar();
    const scrollIntoView = addChapter(0, 'hero', 'Víctor Pérez');
    await userEvent.click(within(bar).getByRole('link', { name: 'TORTOISE_CODE' }));
    expect(scrollIntoView).toHaveBeenCalled();
    expect(window.location.hash).toBe('');
  });

  it('Ctrl+click is left to the browser (new tab), not hijacked', async () => {
    const bar = renderBar();
    const scrollIntoView = addChapter(4, 'contact', 'Touchdown');
    const user = userEvent.setup();
    await user.keyboard('{Control>}');
    await user.click(within(bar).getByRole('link', { name: 'Contact' }));
    await user.keyboard('{/Control}');
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
