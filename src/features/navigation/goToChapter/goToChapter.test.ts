import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { goToChapter } from './goToChapter';

/** Un capítulo en el DOM; devuelve el espía de su `scrollIntoView`. */
function addChapter(index: number, id?: string): ReturnType<typeof vi.fn> {
  const chapter = document.createElement('section');
  chapter.dataset.chapter = String(index);
  if (id !== undefined) chapter.id = id;
  const scrollIntoView = vi.fn();
  chapter.scrollIntoView = scrollIntoView;
  document.body.append(chapter);
  return scrollIntoView;
}

beforeEach(() => {
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  document.body.replaceChildren();
});

describe('goToChapter', () => {
  it('travels to the chapter and leaves its anchor in the URL', () => {
    const projects = addChapter(3, 'projects');
    expect(goToChapter(3)).toBe(true);
    expect(projects).toHaveBeenCalled();
    expect(window.location.hash).toBe('#projects');
  });

  it('the start has no anchor: the URL loses it', () => {
    window.history.replaceState(null, '', '/#contact');
    const hero = addChapter(0);
    expect(goToChapter(0)).toBe(true);
    expect(hero).toHaveBeenCalled();
    expect(window.location.hash).toBe('');
  });

  it('outside the journey there is no chapter: it says so and leaves the URL alone', () => {
    expect(goToChapter(4)).toBe(false);
    expect(window.location.pathname + window.location.hash).toBe('/');
  });
});
