import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChapterPanel } from './ChapterPanel';

describe('ChapterPanel', () => {
  it('wraps its content and is narrow by default', () => {
    render(
      <ChapterPanel>
        <p>Text</p>
      </ChapterPanel>,
    );
    expect(screen.getByText('Text').parentElement).not.toHaveAttribute('data-wide');
  });

  it('marks the wide variant (contact)', () => {
    render(
      <ChapterPanel wide>
        <p>Text</p>
      </ChapterPanel>,
    );
    expect(screen.getByText('Text').parentElement).toHaveAttribute('data-wide');
  });
});
