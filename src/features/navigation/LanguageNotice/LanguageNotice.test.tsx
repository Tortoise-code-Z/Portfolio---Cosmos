import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sceneStore } from '~/stores/sceneStore/sceneStore';

import { LANGUAGE_NOTICE_KEY, LanguageNotice } from './LanguageNotice';

/** Enseña la dirección del router: así se ve adónde lleva el enlace. */
function Location(): ReactNode {
  const { pathname, hash } = useLocation();
  return <span data-testid="location">{pathname + hash}</span>;
}

function renderNotice(path = '/'): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <LanguageNotice />
      <Location />
    </MemoryRouter>,
  );
}

function browserLanguages(languages: readonly string[]): void {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(languages);
}

const notice = (): HTMLElement => screen.getByRole('status');

beforeEach(() => {
  browserLanguages(['es-ES', 'es', 'en']);
});

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
  sceneStore.setState(sceneStore.getInitialState(), true);
});

describe('LanguageNotice', () => {
  it('on an English page with a Spanish browser, offers Spanish, in Spanish', () => {
    renderNotice();
    expect(notice()).toHaveAttribute('lang', 'es');
    expect(notice()).toHaveTextContent('Esta página también está en español.');
    expect(screen.getByRole('link', { name: 'Ver en español' })).toHaveAttribute('href', '/es');
    expect(screen.getByRole('button', { name: 'No, gracias' })).toBeInTheDocument();
  });

  it('the link keeps the chapter you are reading', () => {
    sceneStore.setState({ mTarget: 3, m: 3 });
    renderNotice();
    expect(screen.getByRole('link', { name: 'Ver en español' })).toHaveAttribute(
      'href',
      '/es#projects',
    );
  });

  it.each([
    ['an English browser', '/', ['en-GB', 'es']],
    ['another language first', '/', ['fr-FR', 'es']],
    ['a Spanish page', '/es', ['es-ES']],
  ] as const)('says nothing with %s (the live region stays, empty)', (_case, path, languages) => {
    browserLanguages(languages);
    renderNotice(path);
    expect(notice()).toBeEmptyDOMElement();
    expect(notice()).not.toHaveAttribute('lang');
  });

  it('«No, gracias» hides it and remembers: it does not come back on the next visit', async () => {
    renderNotice();
    await userEvent.click(screen.getByRole('button', { name: 'No, gracias' }));
    expect(notice()).toBeEmptyDOMElement();
    expect(window.localStorage.getItem(LANGUAGE_NOTICE_KEY)).not.toBeNull();

    document.body.replaceChildren();
    renderNotice();
    expect(notice()).toBeEmptyDOMElement();
  });

  it('«Ver en español» goes to the Spanish page and remembers the answer too', async () => {
    renderNotice();
    await userEvent.click(screen.getByRole('link', { name: 'Ver en español' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/es');
    expect(window.localStorage.getItem(LANGUAGE_NOTICE_KEY)).not.toBeNull();
  });

  it('without storage (private window), it still shows and hides; it just forgets', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    renderNotice();
    await userEvent.click(screen.getByRole('button', { name: 'No, gracias' }));
    expect(notice()).toBeEmptyDOMElement();
  });
});
