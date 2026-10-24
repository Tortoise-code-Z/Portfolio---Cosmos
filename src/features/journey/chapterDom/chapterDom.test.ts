import { afterEach, describe, expect, it } from 'vitest';

import { CHAPTER_SELECTOR, findChapter } from './chapterDom';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('chapterDom', () => {
  it('findChapter finds a chapter by its index, the start included', () => {
    document.body.innerHTML =
      '<section data-chapter="0"></section><section data-chapter="3" id="projects"></section>';
    expect(findChapter(0)).toBe(document.querySelector('[data-chapter="0"]'));
    expect(findChapter(3)?.id).toBe('projects');
  });

  it('findChapter returns null outside the journey', () => {
    document.body.innerHTML = '<main><h1>Project</h1></main>';
    expect(findChapter(2)).toBeNull();
  });

  it('CHAPTER_SELECTOR matches every chapter and nothing else', () => {
    document.body.innerHTML =
      '<section data-chapter="0"></section><section data-chapter="1"></section><section></section>';
    expect(document.querySelectorAll(CHAPTER_SELECTOR)).toHaveLength(2);
  });
});
