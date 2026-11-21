import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MouseEvent } from 'react';

import {
  chapterHref,
  goToChapter,
  interludeHref,
  onInterludeLinkClick,
  stopHref,
} from './goToChapter';

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

describe('chapterHref', () => {
  it('is the home of the language plus the anchor; the start has none', () => {
    expect(chapterHref('en', 3)).toBe('/#projects');
    expect(chapterHref('es', 4)).toBe('/es#contact');
    expect(chapterHref('es', 0)).toBe('/es');
    expect(chapterHref('en', 0)).toBe('/');
  });
});

describe('interludeHref and stopHref', () => {
  it('an interlude is the home of the language plus its own anchor', () => {
    expect(interludeHref('en', 'mission-log')).toBe('/#mission-log');
    expect(interludeHref('es', 'mission-log')).toBe('/es#mission-log');
  });

  it('a stop of the rail keeps where you are: a chapter or the interlude you are reading', () => {
    expect(stopHref('es', 'chapter-2')).toBe('/es#skills');
    expect(stopHref('en', 'chapter-0')).toBe('/');
    expect(stopHref('es', 'mission-log')).toBe('/es#mission-log');
  });
});

describe('onInterludeLinkClick', () => {
  /** Un clic simulado y el espía de su `preventDefault`. */
  const click = (
    init: Partial<MouseEvent> = {},
  ): { event: MouseEvent; prevented: ReturnType<typeof vi.fn> } => {
    const prevented = vi.fn();
    const event = {
      button: 0,
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault: prevented,
      ...init,
    } as unknown as MouseEvent;
    return { event, prevented };
  };

  it('jumps to its screen, with the focus on its title, and leaves its anchor', () => {
    const screen = document.createElement('section');
    screen.dataset.interlude = 'mission-log';
    screen.setAttribute('aria-labelledby', 'mission-log-title');
    screen.innerHTML = '<h2 id="mission-log-title" tabindex="-1">Mission 01</h2>';
    const scrollIntoView = vi.fn();
    screen.scrollIntoView = scrollIntoView;
    document.body.append(screen);
    const { event, prevented } = click();
    onInterludeLinkClick('mission-log')(event);
    expect(prevented).toHaveBeenCalled();
    expect(scrollIntoView).toHaveBeenCalled();
    expect(document.activeElement?.id).toBe('mission-log-title');
    expect(window.location.hash).toBe('#mission-log');
  });

  it('with Ctrl/Cmd, or outside the journey, the link does its own thing', () => {
    const withCtrl = click({ ctrlKey: true });
    onInterludeLinkClick('mission-log')(withCtrl.event);
    expect(withCtrl.prevented).not.toHaveBeenCalled();
    const outside = click();
    onInterludeLinkClick('mission-log')(outside.event);
    expect(outside.prevented).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('');
  });
});
