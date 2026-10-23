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
    ['/', 'en', 'A star born from curiosity', 'Strengths', 'Hard-working'],
    ['/es', 'es', 'Una estrella que nace de la curiosidad', 'Fortalezas', 'Trabajador'],
  ] as const)('%s: region #about, bio and strengths', (path, locale, title, label, strength) => {
    renderAt(path);
    const region = screen.getByRole('region', { name: title });
    expect(region).toHaveAttribute('id', 'about');
    for (const paragraph of profile.bio[locale]) {
      expect(within(region).getByText(paragraph)).toBeInTheDocument();
    }
    const strengths = within(region).getByRole('list', { name: label });
    expect(within(strengths).getAllByRole('listitem')).toHaveLength(profile.strengths.length);
    expect(within(strengths).getByText(strength)).toBeInTheDocument();
  });

  it('the title is an h2 under the page h1', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'A star born from curiosity',
    );
  });
});
