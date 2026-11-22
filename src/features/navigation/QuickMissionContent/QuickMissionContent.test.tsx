import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { profile } from '~/content/profile';
import { projectEntries as projects } from '~/content/projects/entries';
import { skillGroups } from '~/content/skills';

import { QuickMissionContent } from './QuickMissionContent';

/** Perfil real con tres interruptores para probar lo que depende de los datos. */
const state = vi.hoisted(() => ({
  openToWork: true,
  availableNow: true,
  cvEn: null as string | null,
}));

vi.mock('~/content/profile', async (importOriginal) => {
  const original = await importOriginal<typeof import('~/content/profile')>();
  return {
    get profile() {
      return {
        ...original.profile,
        availability: {
          ...original.profile.availability,
          openToWork: state.openToWork,
          availableNow: state.availableNow,
        },
        cv: { en: state.cvEn, es: null },
      };
    },
  };
});

afterEach(() => {
  state.openToWork = true;
  state.availableNow = true;
  state.cvEn = null;
  window.getSelection()?.removeAllRanges();
  Reflect.deleteProperty(navigator, 'clipboard');
});

/** Sin portapapeles (http, navegador viejo), dicho explícitamente: no se depende de cómo venga jsdom. */
function withoutClipboard(): void {
  Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
}

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
    [
      '/',
      [
        'About',
        'Projects',
        'Experience',
        'How I work',
        'Skills',
        'Education',
        'Availability',
        'Contact',
      ],
    ],
    [
      '/es',
      [
        'Sobre mí',
        'Proyectos',
        'Experiencia',
        'Cómo trabajo',
        'Habilidades',
        'Formación',
        'Disponibilidad',
        'Contacto',
      ],
    ],
  ])('%s: every part of the journey, in reading order', (path, titles) => {
    renderContent(path);
    expect(sectionTitles()).toEqual(titles);
  });

  it('about: the whole bio (the strengths left the site in phase C)', () => {
    renderContent();
    const about = section('About');
    for (const paragraph of profile.bio.en) expect(about).toHaveTextContent(paragraph);
    expect(about).not.toHaveTextContent('Strengths');
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

  it('education: title, school, period, formatted hours and grade', () => {
    renderContent('/es');
    const items = within(section('Formación')).getAllByRole('listitem');
    expect(items).toHaveLength(profile.education.length);
    expect(items[0]).toHaveTextContent(
      'Curso Superior en Programación de Páginas Web (Full-Stack)',
    );
    expect(items[0]).toHaveTextContent('Master.D · ene 2023 – oct 2024 · 975 h · Sobresaliente');
    expect(items[1]).toHaveTextContent(/Hola Mundo · 2025 · 13 h$/);
  });

  it('experience: role, company, place, dates and the six entries of the mission log (after the projects)', () => {
    renderContent('/es');
    const experienceSection = section('Experiencia');
    expect(experienceSection).toHaveTextContent(
      'Desarrollador de software en prácticas · Studios Demanzon',
    );
    expect(experienceSection).toHaveTextContent(
      'En remoto · Tenerife, España · jul 2026 – oct 2026',
    );
    expect(within(experienceSection).getAllByRole('listitem')).toHaveLength(6);
  });

  it('how I work: the Mission control sentence and the five steps of the countdown in order, launch with the CI browsers', () => {
    renderContent('/es');
    const workflow = section('Cómo trabajo');
    expect(workflow).toHaveTextContent('Cada cambio de este sitio pasó por la misma cuenta atrás.');
    const steps = within(workflow).getAllByRole('listitem');
    expect(steps.map((step) => step.textContent)).toEqual([
      'Plan: Pasos, archivos y riesgos. Aún sin código.',
      'Luz verde: El plan se aprueba antes de construir nada.',
      'Construcción: Una rama y un PR por tarea, TypeScript estricto.',
      'Auditoría: Una revisión con mirada fresca en otra sesión; lo que corrige sale antes de la siguiente tarea.',
      'Lanzamiento: Checks en verde en Chromium, Firefox y WebKit.',
    ]);
  });

  it('availability comes from the profile, and the section goes away when not open to work', () => {
    renderContent();
    expect(section('Availability')).toHaveTextContent(
      'Open to workAvailable immediatelyRemote, hybrid, or on-siteOpen to relocationKillarney, IrelandEU citizen – full right to work in Ireland',
    );
    document.body.replaceChildren();
    state.availableNow = false;
    renderContent();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Availability' }).parentElement,
    ).not.toHaveTextContent('Available immediately');
    document.body.replaceChildren();
    state.openToWork = false;
    renderContent();
    expect(screen.queryByRole('heading', { level: 3, name: 'Availability' })).toBeNull();
  });

  it('contact: the email (mailto) with its own copy button, GitHub, LinkedIn and no CV without its PDF', () => {
    withoutClipboard();
    renderContent();
    const contact = section('Contact');
    const email = within(contact).getByRole('link', { name: profile.contact.email });
    expect(email).toHaveAttribute('href', `mailto:${profile.contact.email}`);
    expect(email).toHaveAttribute('id', 'quick-email');
    fireEvent.click(within(contact).getByRole('button', { name: 'Copy email' }));
    // Sin portapapeles: selecciona el email de este diálogo (no el del capítulo).
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
