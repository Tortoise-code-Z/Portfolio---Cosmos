import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ChapterIndex } from '~/content/chapters';

import { ChapterSection } from './ChapterSection';

describe('ChapterSection', () => {
  it.each([
    [1, 'about'],
    [2, 'skills'],
    [3, 'projects'],
    [4, 'contact'],
  ] as const)('chapter %i is a region named by its title, anchored at #%s', (index, anchor) => {
    render(
      <ChapterSection index={index} labelledBy="t">
        <h2 id="t">Title</h2>
      </ChapterSection>,
    );
    const region = screen.getByRole('region', { name: 'Title' });
    expect(region).toHaveAttribute('id', anchor);
    expect(region).toHaveAttribute('data-chapter', String(index));
  });

  it('the start (chapter 0) has no anchor', () => {
    const index: ChapterIndex = 0;
    render(
      <ChapterSection index={index} labelledBy="name">
        <h1 id="name">Name</h1>
      </ChapterSection>,
    );
    expect(screen.getByRole('region', { name: 'Name' })).not.toHaveAttribute('id');
  });

  it('the journey lets the mouse through to the scene labels: main and the chapters do not take it, their direct children and any other child of main do (CSS)', () => {
    const css = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'ChapterSection.module.css'),
      'utf8',
    );
    expect(css).toMatch(/\n:global\(main\):has\(> \.chapter\) \{\n {2}pointer-events: none;/);
    expect(css).toMatch(
      /\n:where\(:global\(main\)\) > :where\(:not\(\.chapter\)\),\n:where\(\.chapter\) > :where\(\*\) \{\n {2}pointer-events: auto;/,
    );
    // Sin prop ni marca: la regla vale para todos los capítulos.
    render(
      <ChapterSection index={2} labelledBy="a">
        <h2 id="a">Any</h2>
      </ChapterSection>,
    );
    expect(screen.getByRole('region', { name: 'Any' })).not.toHaveAttribute('data-pass-through');
  });
});
