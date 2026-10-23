import { act, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import { sceneStore, setScrollTarget } from '~/stores/sceneStore/sceneStore';

import { LanguageSwitch } from './LanguageSwitch';

function renderSwitch(path: string): HTMLElement {
  render(
    <MemoryRouter initialEntries={[path]}>
      <LanguageSwitch />
    </MemoryRouter>,
  );
  return screen.getByRole('group');
}

afterEach(() => {
  sceneStore.setState(sceneStore.getInitialState(), true);
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
});
