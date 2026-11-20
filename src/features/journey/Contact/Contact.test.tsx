import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { profile } from '~/content/profile';
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
  window.getSelection()?.removeAllRanges();
  Reflect.deleteProperty(navigator, 'clipboard');
});

/** Sin portapapeles (http, navegador viejo), dicho explícitamente: no se depende de cómo venga jsdom. */
function withoutClipboard(): void {
  Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
}

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
    const email = within(region).getByRole('link', { name: 'victorperez@tortoisecode.dev' });
    expect(email).toHaveAttribute('href', 'mailto:victorperez@tortoisecode.dev');
  });

  it.each([
    ['/', 'Copy email'],
    ['/es', 'Copiar el email'],
  ])(
    '%s: a copy button next to the email, which it selects when there is no clipboard',
    (path, name) => {
      withoutClipboard();
      const region = renderAt(path);
      const button = within(region).getByRole('button', { name });
      const email = within(region).getByRole('link', { name: profile.contact.email });
      expect(email.parentElement).toBe(button.parentElement);
      // Sin portapapeles: el botón cae en «selecciónalo», sobre el email de este capítulo.
      fireEvent.click(button);
      expect(window.getSelection()?.toString()).toBe(profile.contact.email);
      expect(email).toHaveAttribute('id', 'contact-email');
    },
  );

  it.each([
    [
      '/',
      'Open to work',
      'Available immediately',
      'Remote, hybrid, or on-site',
      'Open to relocation',
      'Killarney, Ireland',
      'EU citizen – full right to work in Ireland',
    ],
    [
      '/es',
      'Disponible',
      'Disponible de inmediato',
      'Remoto, híbrido o presencial',
      'Abierto a reubicarme',
      'Killarney, Irlanda',
      'Ciudadano de la UE, con permiso de trabajo en Irlanda',
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

  it('a CV of another language does not show: /es has no link while only the English one exists', () => {
    state.cvEn = '/cv/victor-perez-en.pdf';
    expect(within(renderAt('/es')).queryByRole('link', { name: /CV/ })).toBeNull();
  });

  it('with a CV for the language, a download link to it', () => {
    state.cvEn = '/cv/victor-perez-en.pdf';
    const cv = within(renderAt('/')).getByRole('link', { name: 'Download CV (PDF)' });
    expect(cv).toHaveAttribute('href', '/cv/victor-perez-en.pdf');
    expect(cv).toHaveAttribute('download');
  });

  it.each([
    [/^GitHub/, profile.contact.github],
    [/^LinkedIn/, profile.contact.linkedin],
    [/^This site is open source/, SITE_REPOSITORY],
  ])('%s points to its profile and opens in a new tab', (name, href) => {
    const link = within(renderAt('/')).getByRole('link', { name });
    expect(link).toHaveAttribute('href', href);
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('education: one orbit per course with period, formatted hours and grade in the language', () => {
    const region = renderAt('/es');
    const orbits = within(region).getByRole('list', { name: 'Órbitas completadas · formación' });
    const items = within(orbits).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent(
      'Curso Superior en Programación de Páginas Web (Full-Stack)',
    );
    expect(items[0]).toHaveTextContent('ene 2023 – oct 2024 · 975 h · Sobresaliente');
    expect(items[0]).toHaveTextContent('Master.D · HTML, CSS');
  });

  it('education in English: the period and grade as the CV says them; no grade, no separator', () => {
    const orbits = within(renderAt('/')).getByRole('list', {
      name: 'Completed orbits · education',
    });
    const items = within(orbits).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Jan 2023 – Oct 2024 · 975 h · Distinction');
    expect(items[1]).toHaveTextContent(/2025 · 13 hHola Mundo/);
  });

  it('footer signature with the current year', () => {
    renderAt('/');
    expect(
      screen.getByText(`Víctor Pérez · Frontend Developer · ${String(new Date().getFullYear())}`),
    ).toBeInTheDocument();
  });
});
