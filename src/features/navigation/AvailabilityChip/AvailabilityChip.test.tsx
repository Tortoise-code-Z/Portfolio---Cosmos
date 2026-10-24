import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AvailabilityChip } from './AvailabilityChip';

const state = vi.hoisted(() => ({ openToWork: true }));

vi.mock('~/content/profile', async (importOriginal) => {
  const original = await importOriginal<typeof import('~/content/profile')>();
  return {
    get profile() {
      return {
        ...original.profile,
        availability: { ...original.profile.availability, openToWork: state.openToWork },
      };
    },
  };
});

function renderChip(path = '/'): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AvailabilityChip />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  state.openToWork = true;
  document.body.replaceChildren();
});

describe('AvailabilityChip', () => {
  it.each([
    ['/', 'Open to work', '/#contact'],
    ['/es', 'Disponible', '/es#contact'],
  ])(
    '%s: a real link to Contact, named by its text (the dot is decorative)',
    (path, name, href) => {
      renderChip(path);
      const chip = screen.getByRole('link', { name });
      expect(chip).toHaveAttribute('href', href);
      expect(chip.querySelector('[aria-hidden="true"]')).not.toBeNull();
    },
  );

  it('does not exist when the profile is not open to work', () => {
    state.openToWork = false;
    renderChip();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('in the journey, a plain click jumps to Contact like the bar link (focus on its title)', () => {
    const chapter = document.createElement('section');
    chapter.dataset.chapter = '4';
    chapter.setAttribute('aria-labelledby', 'contact-title');
    chapter.innerHTML = '<h2 id="contact-title" tabindex="-1">Touchdown</h2>';
    const scrollIntoView = vi.fn();
    chapter.scrollIntoView = scrollIntoView;
    document.body.append(chapter);
    renderChip();

    fireEvent.click(screen.getByRole('link', { name: 'Open to work' }));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toHaveAttribute('id', 'contact-title');
    expect(window.location.hash).toBe('#contact');
  });
});
