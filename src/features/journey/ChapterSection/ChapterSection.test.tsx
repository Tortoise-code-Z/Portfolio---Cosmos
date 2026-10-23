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
});
