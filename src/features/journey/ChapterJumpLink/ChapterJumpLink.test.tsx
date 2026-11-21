import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChapterJumpLink } from './ChapterJumpLink';

function renderLink(path = '/es'): HTMLElement {
  render(
    <MemoryRouter initialEntries={[path]}>
      <ChapterJumpLink chapter={4} className="x">
        Contacto ↓
      </ChapterJumpLink>
    </MemoryRouter>,
  );
  return screen.getByRole('link', { name: 'Contacto ↓' });
}

/** El capítulo de Contacto en la página, con su título. */
function addContact(): ReturnType<typeof vi.fn> {
  const contact = document.createElement('section');
  contact.dataset.chapter = '4';
  contact.setAttribute('aria-labelledby', 'contact-title');
  contact.innerHTML = '<h2 id="contact-title" tabindex="-1">Contacto</h2>';
  const scrollIntoView = vi.fn();
  contact.scrollIntoView = scrollIntoView;
  document.body.append(contact);
  return scrollIntoView;
}

afterEach(() => {
  document.body.replaceChildren();
  window.history.replaceState(null, '', '/');
});

describe('ChapterJumpLink', () => {
  it('is a real link to the chapter in the current language, with its class', () => {
    expect(renderLink('/es')).toHaveAttribute('href', '/es#contact');
    document.body.replaceChildren();
    const link = renderLink('/');
    expect(link).toHaveAttribute('href', '/#contact');
    expect(link).toHaveClass('x');
  });

  it('a plain click jumps to the chapter with the focus on its title and its anchor in the URL', async () => {
    const link = renderLink();
    const scrollIntoView = addContact();
    await userEvent.click(link);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Contacto' }));
    expect(window.location.hash).toBe('#contact');
  });

  it('with Ctrl/Cmd (another tab) the link is left alone: no jump here', () => {
    const link = renderLink();
    const scrollIntoView = addContact();
    const notCancelled = link.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }),
    );
    expect(notCancelled).toBe(true);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('without the chapter on the page (outside the journey) the router navigates instead', async () => {
    const link = renderLink();
    await userEvent.click(link);
    expect(window.location.hash).not.toBe('#contact');
  });
});
