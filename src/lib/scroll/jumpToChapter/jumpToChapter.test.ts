import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { jumpToChapter } from './jumpToChapter';

function chapterWithTitle(): {
  chapter: HTMLElement;
  title: HTMLElement;
  scrollIntoView: ReturnType<typeof vi.fn>;
} {
  const chapter = document.createElement('section');
  chapter.setAttribute('aria-labelledby', 'skills-title');
  const title = document.createElement('h2');
  title.id = 'skills-title';
  title.tabIndex = -1;
  chapter.append(title);
  document.body.append(chapter);
  const scrollIntoView = vi.fn();
  chapter.scrollIntoView = scrollIntoView;
  return { chapter, title, scrollIntoView };
}

function stubReducedMotion(matches: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches })),
  );
}

beforeEach(() => {
  window.history.replaceState({ key: 'router-key' }, '', '/es?ref=cv');
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

describe('jumpToChapter', () => {
  it('scrolls smoothly to the start of the chapter and focuses its title without scrolling', () => {
    stubReducedMotion(false);
    const { chapter, title, scrollIntoView } = chapterWithTitle();
    const focus = vi.spyOn(title, 'focus');
    jumpToChapter(chapter);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(document.activeElement).toBe(title);
  });

  it('jumps instantly with reduced motion', () => {
    stubReducedMotion(true);
    const { chapter, scrollIntoView } = chapterWithTitle();
    jumpToChapter(chapter);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
  });

  it('leaves the URL alone unless asked', () => {
    const { chapter } = chapterWithTitle();
    jumpToChapter(chapter);
    expect(window.location.pathname + window.location.search + window.location.hash).toBe(
      '/es?ref=cv',
    );
  });

  it('writes the anchor in place (no new history entry) and keeps the router state', () => {
    const { chapter } = chapterWithTitle();
    const length = window.history.length;
    jumpToChapter(chapter, { hash: '#skills' });
    expect(window.location.pathname + window.location.search + window.location.hash).toBe(
      '/es?ref=cv#skills',
    );
    expect(window.history.length).toBe(length);
    expect(window.history.state).toEqual({ key: 'router-key' });

    jumpToChapter(chapter, { hash: '' });
    expect(window.location.hash).toBe('');
    expect(window.location.search).toBe('?ref=cv');
  });

  it('still scrolls when the chapter has no title to focus', () => {
    const chapter = document.createElement('section');
    const scrollIntoView = vi.fn();
    chapter.scrollIntoView = scrollIntoView;
    expect(() => {
      jumpToChapter(chapter);
    }).not.toThrow();
    expect(scrollIntoView).toHaveBeenCalled();
  });
});
