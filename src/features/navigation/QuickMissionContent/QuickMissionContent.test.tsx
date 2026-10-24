import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { profile } from '~/content/profile';
import { projects } from '~/content/projects';
import { skillGroups } from '~/content/skills';

import { QuickMissionContent } from './QuickMissionContent';

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
});

function renderContent(path = '/'): HTMLElement {
  const { container } = render(
    <MemoryRouter initialEntries={[path]}>
      <QuickMissionContent />
    </MemoryRouter>,
  );
  return container;
}

const sectionTitles = (): string[] =>
  screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);

/** La sección que abre un título (`h3`). */
function section(name: string): HTMLElement {
  const heading = screen.getByRole('heading', { level: 3, name });
  const parent = heading.closest('section');
  if (parent === null) throw new Error(`No section for «${name}»`);
  return parent;
}

describe('QuickMissionContent', () => {
  it.each([
    ['/', ['About', 'Projects', 'Skills', 'Education', 'Availability', 'Contact']],
    ['/es', ['Sobre mí', 'Proyectos', 'Habilidades', 'Formación', 'Disponibilidad', 'Contacto']],
  ])('%s: every part of the journey, in reading order', (path, titles) => {
    renderContent(path);
    expect(sectionTitles()).toEqual(titles);
  });

  it('about: the whole bio and the strengths', () => {
    renderContent();
    const about = section('About');
    for (const paragraph of profile.bio.en) expect(about).toHaveTextContent(paragraph);
    expect(about).toHaveTextContent('Strengths: Hard-working · Communication · Perseverance');
  });

  it('projects: in reading order, each with year, metadata, summary and its three links', () => {
    renderContent();
    const list = section('Projects');
    const ordered = [...projects].sort((a, b) => a.order - b.order);
    expect(
      within(list)
        .getAllByRole('heading', { level: 4 })
        .map((heading) => heading.textContent),
    ).toEqual(ordered.map((project) => project.name));

    const chessmate = within(list).getByRole('heading', { level: 4, name: 'Chessmate' });
    const item = chessmate.closest('li');
    if (item === null) throw new Error('No item for Chessmate');
    expect(item).toHaveTextContent('2025');
    expect(item).toHaveTextContent('Featured · Front end · Personal project · React · TypeScript');
    expect(within(item).getByRole('link', { name: 'View project Chessmate' })).toHaveAttribute(
      'href',
      '/projects/chessmate',
    );
    expect(within(item).getByRole('link', { name: /^Live demo Chessmate/ })).toHaveAttribute(
      'target',
      '_blank',
    );
    expect(within(item).getByRole('link', { name: /^Code Chessmate/ })).toBeInTheDocument();
  });

  it('a project without a demo shows no demo link', () => {
    renderContent();
    const astrohub = screen.getByRole('heading', { level: 4, name: 'AstroHub' }).closest('li');
    if (astrohub === null) throw new Error('No item for AstroHub');
    expect(within(astrohub).queryByRole('link', { name: /Live demo/ })).toBeNull();
  });

  it('skills: one line per group with all its skills', () => {
    renderContent('/es');
    const items = within(section('Habilidades')).getAllByRole('listitem');
    expect(items).toHaveLength(skillGroups.length);
    const [first] = skillGroups;
    if (first === undefined) throw new Error('No skill groups');
    expect(items[0]).toHaveTextContent(
      `${first.title.es}: ${first.skills.map((skill) => (typeof skill.label === 'string' ? skill.label : skill.label.es)).join(', ')}`,
    );
  });

  it('education: title, school, period and formatted hours', () => {
    renderContent('/es');
    const items = within(section('Formación')).getAllByRole('listitem');
    expect(items).toHaveLength(profile.education.length);
    expect(items[0]).toHaveTextContent('Curso de programación Fullstack');
    expect(items[0]).toHaveTextContent('MasterD · 2023/24 · 948 h');
  });

  it('availability comes from the profile, and the section goes away when not open to work', () => {
    renderContent();
    expect(section('Availability')).toHaveTextContent(
      'Open to workRemote, hybrid, or on-siteOpen to relocationKillarney, Ireland',
    );
    document.body.replaceChildren();
    state.openToWork = false;
    renderContent();
    expect(screen.queryByRole('heading', { level: 3, name: 'Availability' })).toBeNull();
  });

  it('contact: the email (mailto) with its own copy button, GitHub, LinkedIn and no CV without its PDF', () => {
    renderContent();
    const contact = section('Contact');
    const email = within(contact).getByRole('link', { name: profile.contact.email });
    expect(email).toHaveAttribute('href', `mailto:${profile.contact.email}`);
    expect(email).toHaveAttribute('id', 'quick-email');
    fireEvent.click(within(contact).getByRole('button', { name: 'Copy email' }));
    // Sin portapapeles en jsdom: selecciona el email de este diálogo (no el del capítulo).
    expect(window.getSelection()?.toString()).toBe(profile.contact.email);
    expect(within(contact).getByRole('link', { name: /^GitHub/ })).toBeInTheDocument();
    expect(within(contact).getByRole('link', { name: /^LinkedIn/ })).toBeInTheDocument();
    expect(within(contact).queryByRole('link', { name: /CV/ })).toBeNull();
  });

  it('contact: the CV of the language when its PDF exists', () => {
    state.cvEn = '/cv/victor-perez-en.pdf';
    renderContent();
    expect(within(section('Contact')).getByRole('link', { name: /Download CV/ })).toHaveAttribute(
      'href',
      '/cv/victor-perez-en.pdf',
    );
  });
});
