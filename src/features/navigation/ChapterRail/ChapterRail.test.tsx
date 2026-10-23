import { act, render, screen, within } from '@testing-library/react';
import { Profiler } from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CHAPTER_INDICES } from '~/content/chapters';
import { uiTexts } from '~/content/texts';
import { sceneStore, setScrollTarget } from '~/stores/sceneStore/sceneStore';

import { ChapterRail, splitChapterLabel } from './ChapterRail';

const EN = [
  'Home · Singularity',
  'About · Nebula',
  'Skills · Galaxy',
  'Projects · Cosmic turtle',
  'Contact · Earth',
];

function renderRail(path = '/'): HTMLElement {
  render(
    <MemoryRouter initialEntries={[path]}>
      <ChapterRail />
    </MemoryRouter>,
  );
  return screen.getByRole('navigation');
}

beforeEach(() => {
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  sceneStore.setState(sceneStore.getInitialState(), true);
  document.body.replaceChildren();
});

describe('ChapterRail', () => {
  it('is a navigation landmark with an ordered list of five buttons, one per chapter', () => {
    const rail = renderRail();
    expect(rail).toHaveAccessibleName('Chapters');
    const list = within(rail).getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(
      within(list)
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual(EN);
  });

  it('shows the section and the scene of each chapter', () => {
    const rail = renderRail();
    const projects = within(rail).getByRole('button', { name: 'Projects · Cosmic turtle' });
    expect(projects).toHaveTextContent('ProjectsCosmic turtle');
  });

  it('marks the active chapter with aria-current="step" and follows m', () => {
    const rail = renderRail();
    const current = (): string[] =>
      within(rail)
        .getAllByRole('button')
        .filter((button) => button.getAttribute('aria-current') === 'step')
        .map((button) => button.getAttribute('aria-label') ?? '');
    expect(current()).toEqual(['Home · Singularity']);
    act(() => {
      setScrollTarget(2.6);
    });
    expect(current()).toEqual(['Projects · Cosmic turtle']);
  });

  it('re-renders only when the active chapter changes, not on every scroll', () => {
    const onRender = vi.fn();
    render(
      <MemoryRouter>
        <Profiler id="rail" onRender={onRender}>
          <ChapterRail />
        </Profiler>
      </MemoryRouter>,
    );
    onRender.mockClear();
    act(() => {
      setScrollTarget(0.2);
    });
    act(() => {
      setScrollTarget(0.4);
    });
    expect(onRender).not.toHaveBeenCalled();
    act(() => {
      setScrollTarget(0.6);
    });
    expect(onRender).toHaveBeenCalledTimes(1);
  });

  it('a click travels to the chapter, focuses its title and leaves its anchor in the URL', async () => {
    const rail = renderRail();
    const skills = document.createElement('section');
    skills.dataset.chapter = '2';
    skills.id = 'skills';
    skills.setAttribute('aria-labelledby', 'skills-title');
    skills.innerHTML = '<h2 id="skills-title" tabindex="-1">My galaxy of tools</h2>';
    const scrollIntoView = vi.fn();
    skills.scrollIntoView = scrollIntoView;
    document.body.append(skills);

    await userEvent.click(within(rail).getByRole('button', { name: 'Skills · Galaxy' }));
    expect(scrollIntoView).toHaveBeenCalled();
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { name: 'My galaxy of tools' }),
    );
    expect(window.location.hash).toBe('#skills');
  });

  it('speaks Spanish in /es', () => {
    const rail = renderRail('/es');
    expect(rail).toHaveAccessibleName('Capítulos');
    expect(
      within(rail).getByRole('button', { name: 'Proyectos · Tortuga cósmica' }),
    ).toBeInTheDocument();
  });
});

describe('splitChapterLabel', () => {
  it('splits section and scene; a label without scene keeps it all as the section', () => {
    expect(splitChapterLabel('About · Nebula')).toEqual({ section: 'About', scene: 'Nebula' });
    expect(splitChapterLabel('About')).toEqual({ section: 'About', scene: '' });
  });

  it('every chapter label, in both languages, has exactly a section and a scene', () => {
    for (const texts of Object.values(uiTexts)) {
      for (const index of CHAPTER_INDICES) {
        expect(texts[`chapter.${String(index)}` as 'chapter.0'].split(' · ')).toHaveLength(2);
      }
    }
  });
});
