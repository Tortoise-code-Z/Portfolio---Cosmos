import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SITE_REPOSITORY } from '~/content/site';

import { Contact } from './Contact';

/** Perfil real con dos interruptores para probar lo que depende de los datos. */
const state = vi.hoisted(() => ({ openToWork: true, cvEn: null as string | null }));

vi.mock('~/content/profile', async (importOriginal) => {
  const original = await importOriginal<typeof import('~/content/profile')>();
  return {
    get profile() {
      return {
        ...original.profile,
        availability: { ...original.profile.availability, openToWork: state.openToWork },
        cv: { en: state.cvEn, es: null },
      };
    },
  };
});

afterEach(() => {
  state.openToWork = true;
  state.cvEn = null;
});

function renderAt(path: string): HTMLElement {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Contact />
    </MemoryRouter>,
  );
  return screen.getByRole('region', { name: path === '/' ? 'Touchdown' : 'Aterrizaje' });
}

describe('Contact', () => {
  it('region #contact with the email as a mailto link', () => {
    const region = renderAt('/');
    expect(region).toHaveAttribute('id', 'contact');
    const email = within(region).getByRole('link', { name: 'victorperez.brmte@passmail.com' });
    expect(email).toHaveAttribute('href', 'mailto:victorperez.brmte@passmail.com');
  });

  it.each([
    ['/', 'Open to work', 'Remote, hybrid, or on-site', 'Open to relocation', 'Killarney, Ireland'],
    [
      '/es',
      'Disponible',
      'Remoto, híbrido o presencial',
      'Abierto a reubicarme',
      'Killarney, Irlanda',
    ],
  ])('%s: availability comes from the profile', (path, ...lines) => {
    const region = renderAt(path);
    const list = region.querySelector('[data-availability]');
    expect([...(list?.children ?? [])].map((item) => item.textContent)).toEqual(lines);
  });

  it('openToWork false hides the availability', () => {
    state.openToWork = false;
    const region = renderAt('/');
    expect(region.querySelector('[data-availability]')).toBeNull();
    expect(within(region).queryByText('Open to work')).toBeNull();
  });

  it('the CV link only appears when the PDF of the language exists', () => {
    expect(within(renderAt('/')).queryByRole('link', { name: /Download CV/ })).toBeNull();
  });

  it('with a CV for the language, a download link to it', () => {
    state.cvEn = '/cv/victor-perez-en.pdf';
    const cv = within(renderAt('/')).getByRole('link', { name: 'Download CV (PDF)' });
    expect(cv).toHaveAttribute('href', '/cv/victor-perez-en.pdf');
    expect(cv).toHaveAttribute('download');
  });

  it('GitHub, LinkedIn and the repo open in a new tab', () => {
    const region = renderAt('/');
    expect(within(region).getByRole('link', { name: /^GitHub/ })).toHaveAttribute(
      'target',
      '_blank',
    );
    expect(within(region).getByRole('link', { name: /^LinkedIn/ })).toHaveAttribute(
      'target',
      '_blank',
    );
    expect(within(region).getByRole('link', { name: /^This site is open source/ })).toHaveAttribute(
      'href',
      SITE_REPOSITORY,
    );
  });

  it('education: one orbit per course with period and formatted hours', () => {
    const region = renderAt('/es');
    const orbits = within(region).getByRole('list', { name: 'Órbitas completadas · formación' });
    const items = within(orbits).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Curso de programación Fullstack');
    expect(items[0]).toHaveTextContent('2023/24 · 948 h');
    expect(items[0]).toHaveTextContent('MasterD · HTML, CSS');
  });

  it('footer signature with the current year', () => {
    renderAt('/');
    expect(
      screen.getByText(`Víctor Pérez · Frontend Developer · ${String(new Date().getFullYear())}`),
    ).toBeInTheDocument();
  });
});
