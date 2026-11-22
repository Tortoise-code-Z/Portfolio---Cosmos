import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CHAPTER_ANCHORS, EPILOGUE } from '~/content/chapters';
import { profile } from '~/content/profile';
import { SITE_REPOSITORY } from '~/content/site';

import { CrewFile } from './CrewFile';

/** Perfil real con interruptores para lo que depende de los datos. */
const state: { availableNow: boolean; cvEn: string | null } = vi.hoisted(() => ({
  availableNow: true,
  cvEn: '/cv.pdf',
}));

vi.mock('~/content/profile', async (importOriginal) => {
  const original = await importOriginal<typeof import('~/content/profile')>();
  return {
    get profile() {
      return {
        ...original.profile,
        availability: { ...original.profile.availability, availableNow: state.availableNow },
        cv: { en: state.cvEn, es: state.cvEn },
      };
    },
  };
});

afterEach(() => {
  state.availableNow = true;
  state.cvEn = '/cv.pdf';
});

function renderAt(path: string): HTMLElement {
  render(
    <MemoryRouter initialEntries={[path]}>
      <CrewFile />
    </MemoryRouter>,
  );
  return screen.getByRole('region', {
    name: path === '/' ? 'Crew file' : 'Ficha de tripulación',
  });
}

/** La ficha como pares término → valor (la lista de definiciones real). */
function record(region: HTMLElement): [string, string][] {
  const terms = within(region).getAllByRole('term');
  return terms.map((term) => [term.textContent, term.nextElementSibling?.textContent ?? '']);
}

describe('CrewFile', () => {
  it('is the epilogue chapter, with its anchor, in the green channel, and closes the channels instead of skipping', () => {
    const region = renderAt('/');
    expect(region).toHaveAttribute('id', CHAPTER_ANCHORS[EPILOGUE]);
    expect(region).toHaveAttribute('data-chapter', String(EPILOGUE));
    expect(region).not.toHaveAttribute('data-interlude');
    expect(region).toHaveTextContent('Channel 03 · green');
    expect(region).toHaveTextContent('All channels closed');
    expect(within(region).queryByRole('link', { name: /Skip transmission/ })).toBeNull();
    expect(region).toHaveTextContent('End of journey · 13.8 billion years + now');
    // Sin cola: es el último tramo del viaje.
    expect(document.querySelector('[data-interlude-tail]')).toBeNull();
  });

  it('the file is a real definition list: role, base, right to work, availability, languages and training', () => {
    expect(record(renderAt('/'))).toEqual([
      ['Role', 'Frontend Developer · React + TypeScript'],
      ['Base', 'Killarney, Ireland'],
      ['Right to work', profile.availability.workPermit.en],
      ['Availability', 'Available immediately · Remote, hybrid, or on-site · Open to relocation'],
      ['Languages', 'Spanish · English'],
      [
        'Training',
        'Advanced Course in Web Programming (Full-Stack)Master.D · 975 h · DistinctionReact + TypeScript CourseHola Mundo · 13 h',
      ],
    ]);
  });

  it('in Spanish, with the hours in its format; without «available now», that part goes and nothing else', () => {
    state.availableNow = false;
    const file = record(renderAt('/es'));
    expect(file.map(([term]) => term)).toEqual([
      'Puesto',
      'Base',
      'Permiso de trabajo',
      'Disponibilidad',
      'Idiomas',
      'Formación',
    ]);
    expect(file[3]?.[1]).toBe('Remoto, híbrido o presencial · Abierto a reubicarme');
    expect(file[4]?.[1]).toBe('Español · Inglés');
    expect(file[5]?.[1]).toContain('Master.D · 975 h · Sobresaliente');
  });

  it('«Download CV» comes right after the title, and only when the PDF exists', () => {
    const region = renderAt('/');
    const cv = within(region).getByRole('link', { name: /^Download CV \(PDF\)/ });
    expect(cv).toHaveAttribute('href', '/cv.pdf');
    const [firstLink] = within(region).getAllByRole('link');
    expect(firstLink).toBe(cv);
  });

  it('the visor of the portrait: decorative, between the lead and «Download CV» (in the gap of the column on a phone)', () => {
    const region = renderAt('/');
    const visor = region.querySelector('[data-crew-visor]');
    expect(visor).toHaveAttribute('aria-hidden', 'true');
    expect(visor).toHaveTextContent('Identity verified');
    const lead = within(region).getByText(/^The one who built this journey/);
    const cv = within(region).getByRole('link', { name: /^Download CV/ });
    expect(
      lead.compareDocumentPosition(visor as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      (visor as Node).compareDocumentPosition(cv) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // La transmisión va abierta: sin velo sobre la escena, el retrato se ve.
    expect(region.className).toMatch(/open/);
  });

  it('without a CV, no download link', () => {
    state.cvEn = null;
    expect(within(renderAt('/')).queryByRole('link', { name: /^Download CV/ })).toBeNull();
  });

  it('the email as a mailto link with its copy button', () => {
    const region = renderAt('/');
    expect(within(region).getByRole('link', { name: profile.contact.email })).toHaveAttribute(
      'href',
      `mailto:${profile.contact.email}`,
    );
    expect(within(region).getByRole('button', { name: /^Copy/ })).toBeInTheDocument();
  });

  it('closes the site: its signature with the current year and the link to its source', () => {
    const region = renderAt('/');
    expect(
      within(region).getByText(
        `Víctor Pérez · Frontend Developer · ${String(new Date().getFullYear())}`,
      ),
    ).toBeInTheDocument();
    const source = within(region).getByRole('link', { name: /^This site is open source/ });
    expect(source).toHaveAttribute('href', SITE_REPOSITORY);
    expect(source).toHaveAttribute('target', '_blank');
  });
});
