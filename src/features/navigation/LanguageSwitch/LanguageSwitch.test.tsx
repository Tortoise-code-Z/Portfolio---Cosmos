import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import { sceneStore, setScrollTarget } from '~/stores/sceneStore/sceneStore';

import { LANGUAGE_NOTICE_KEY } from '../LanguageNotice/LanguageNotice';
import { LanguageSwitch } from './LanguageSwitch';

/** Enseña la dirección del router: así se ve si un clic ha navegado. */
function Location(): ReactNode {
  const { pathname, hash } = useLocation();
  return <output>{pathname + hash}</output>;
}

function renderSwitch(path: string): HTMLElement {
  render(
    <MemoryRouter initialEntries={[path]}>
      <LanguageSwitch />
      <Location />
    </MemoryRouter>,
  );
  return screen.getByRole('group');
}

afterEach(() => {
  sceneStore.setState(sceneStore.getInitialState(), true);
  window.localStorage.clear();
});

describe('LanguageSwitch', () => {
  it('two links named in their own language; the current one has aria-current', () => {
    const group = renderSwitch('/');
    expect(group).toHaveAccessibleName('Language');
    const english = within(group).getByRole('link', { name: 'English' });
    const spanish = within(group).getByRole('link', { name: 'Español' });
    expect(english).toHaveTextContent('EN');
    expect(english).toHaveAttribute('aria-current', 'true');
    expect(spanish).toHaveTextContent('ES');
    expect(spanish).not.toHaveAttribute('aria-current');
    expect(spanish).toHaveAttribute('lang', 'es');
    expect(spanish).toHaveAttribute('hreflang', 'es');
  });

  it('at the start, each link goes to the home of its language', () => {
    const group = renderSwitch('/es');
    expect(group).toHaveAccessibleName('Idioma');
    expect(within(group).getByRole('link', { name: 'English' })).toHaveAttribute('href', '/');
    expect(within(group).getByRole('link', { name: 'Español' })).toHaveAttribute('href', '/es');
    expect(within(group).getByRole('link', { name: 'Español' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('outside the journey, each link goes to the same page in its language (pathFor)', () => {
    sceneStore.setState({ mTarget: 3, m: 3 });
    render(
      <MemoryRouter initialEntries={['/projects/chessmate']}>
        <LanguageSwitch
          pathFor={(locale) => (locale === 'es' ? '/es/projects/x' : '/projects/x')}
        />
      </MemoryRouter>,
    );
    const group = screen.getByRole('group');
    expect(within(group).getByRole('link', { name: 'English' })).toHaveAttribute(
      'href',
      '/projects/x',
    );
    expect(within(group).getByRole('link', { name: 'Español' })).toHaveAttribute(
      'href',
      '/es/projects/x',
    );
  });

  it('keeps the chapter you are reading, even if the URL has no anchor', () => {
    const group = renderSwitch('/');
    act(() => {
      setScrollTarget(3.2);
    });
    expect(within(group).getByRole('link', { name: 'Español' })).toHaveAttribute(
      'href',
      '/es#projects',
    );
    act(() => {
      setScrollTarget(0.1);
    });
    expect(within(group).getByRole('link', { name: 'Español' })).toHaveAttribute('href', '/es');
  });

  it('the current language does not navigate on a normal click (no jump, no history entry)', async () => {
    const group = renderSwitch('/');
    act(() => {
      setScrollTarget(2);
    });
    await userEvent.click(within(group).getByRole('link', { name: 'English' }));
    expect(screen.getByRole('status').textContent).toBe('/');
    await userEvent.click(within(group).getByRole('link', { name: 'Español' }));
    expect(screen.getByRole('status').textContent).toBe('/es#skills');
  });

  it('Ctrl+click on the current language is left to the browser (a new tab)', async () => {
    const group = renderSwitch('/');
    const prevented: boolean[] = [];
    const record = (event: Event): void => {
      prevented.push(event.defaultPrevented);
      event.preventDefault();
    };
    window.addEventListener('click', record);
    const user = userEvent.setup();
    await user.keyboard('{Control>}');
    await user.click(within(group).getByRole('link', { name: 'English' }));
    await user.keyboard('{/Control}');
    window.removeEventListener('click', record);
    expect(prevented).toEqual([false]);
  });

  it('choosing the other language by hand answers the language suggestion; the current one does not', async () => {
    const group = renderSwitch('/es');
    await userEvent.click(within(group).getByRole('link', { name: 'Español' }));
    expect(window.localStorage.getItem(LANGUAGE_NOTICE_KEY)).toBeNull();
    await userEvent.click(within(group).getByRole('link', { name: 'English' }));
    expect(screen.getByRole('status').textContent).toBe('/');
    expect(window.localStorage.getItem(LANGUAGE_NOTICE_KEY)).toBe('answered');
  });
});
