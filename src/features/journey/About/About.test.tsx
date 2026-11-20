import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { profile } from '~/content/profile';

import { About } from './About';

function renderAt(path: string): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <About />
    </MemoryRouter>,
  );
}

describe('About', () => {
  it.each([
    ['/', 'en', 'A star born from curiosity'],
    ['/es', 'es', 'Una estrella que nace de la curiosidad'],
  ] as const)(
    '%s: region #about with the whole bio, and no strengths (phase C)',
    (path, locale, title) => {
      renderAt(path);
      const region = screen.getByRole('region', { name: title });
      expect(region).toHaveAttribute('id', 'about');
      for (const paragraph of profile.bio[locale]) {
        expect(within(region).getByText(paragraph)).toBeInTheDocument();
      }
      expect(within(region).queryByRole('list')).toBeNull();
    },
  );

  it('the title is an h2 under the page h1, focusable by script only (the hero jumps here)', () => {
    renderAt('/');
    const title = screen.getByRole('heading', { level: 2 });
    expect(title).toHaveTextContent('A star born from curiosity');
    expect(title).toHaveAttribute('tabindex', '-1');
  });
});
