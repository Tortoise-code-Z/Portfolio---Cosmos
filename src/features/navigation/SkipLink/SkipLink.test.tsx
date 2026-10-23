import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SkipLink } from './SkipLink';

afterEach(() => {
  document.body.replaceChildren();
});

describe('SkipLink', () => {
  it('is a link to the name (works without JavaScript), in the language of the page', () => {
    render(
      <MemoryRouter initialEntries={['/es']}>
        <SkipLink />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveAttribute(
      'href',
      '#hero-title',
    );
  });

  it('goes to the start of the content with the focus on the name, without leaving an anchor', async () => {
    window.history.replaceState(null, '', '/');
    render(
      <MemoryRouter>
        <SkipLink />
      </MemoryRouter>,
    );
    const hero = document.createElement('section');
    hero.dataset.chapter = '0';
    hero.setAttribute('aria-labelledby', 'hero-title');
    hero.innerHTML = '<h1 id="hero-title" tabindex="-1">Víctor Pérez</h1>';
    const scrollIntoView = vi.fn();
    hero.scrollIntoView = scrollIntoView;
    document.body.append(hero);

    await userEvent.click(screen.getByRole('link', { name: 'Skip to content' }));
    expect(scrollIntoView).toHaveBeenCalled();
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1 }));
    expect(window.location.hash).toBe('');
  });
});
