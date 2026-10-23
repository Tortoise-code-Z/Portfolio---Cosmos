import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { skillGroups } from '~/content/skills';
import { localize } from '~/lib/i18n/localize/localize';

import { Skills } from './Skills';

function renderAt(path: string): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Skills />
    </MemoryRouter>,
  );
}

describe('Skills', () => {
  it.each(['en', 'es'] as const)('%s: every skill appears exactly once, in its group', (locale) => {
    renderAt(locale === 'en' ? '/' : '/es');
    for (const group of skillGroups) {
      const list = screen.getByRole('list', { name: localize(locale, group.title) });
      const items = within(list).getAllByRole('listitem');
      expect(items.map((item) => item.textContent)).toEqual(
        group.skills.map((skill) => localize(locale, skill.label)),
      );
    }
    const total = skillGroups.reduce((sum, group) => sum + group.skills.length, 0);
    const allSkills = skillGroups.flatMap((group) =>
      group.skills.map((skill) => localize(locale, skill.label)),
    );
    expect(new Set(allSkills).size).toBe(total);
  });

  it('region #skills with both lead variants in the HTML (CSS picks one)', () => {
    renderAt('/');
    const region = screen.getByRole('region', { name: 'My galaxy of tools' });
    expect(region).toHaveAttribute('id', 'skills');
    expect(within(region).getByText(/Hover a group/)).toBeInTheDocument();
    expect(within(region).getByText(/Tap a group/)).toBeInTheDocument();
  });

  it('group titles are h3 in reading order', () => {
    renderAt('/');
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(
      skillGroups.map((group) => group.title.en),
    );
  });
});
