// Fuente: docs/01-contenido/proyectos/cosmos.md. Stack desde docs/05-tecnico/stack.md.
// Solo se publica lo que está hecho: la escena 3D (resumen, funcionalidades y stack) vuelve a la ficha en F3–F4,
// y process, highlights y la nota del README esperan a F6 (roadmap).

import type { ProjectEntry } from '../types';
import { RESPONSIVE_DESIGN } from './labels';

export const cosmos: ProjectEntry = {
  slug: 'cosmos',
  order: 3,
  featured: false,
  name: 'Cosmos',
  tagline: {
    en: 'This portfolio: a scroll journey from the Big Bang to Earth.',
    es: 'Este portfolio: un viaje por scroll del Big Bang a la Tierra.',
  },
  year: 2026,
  role: 'frontend',
  context: 'personal',
  summary: {
    en: 'The site you are on: a scroll journey through the history of the universe, from the Big Bang to Earth. Built with React and TypeScript, pre-rendered, bilingual and readable without JavaScript.',
    es: 'La web en la que estás: un viaje por scroll a través de la historia del universo, del Big Bang a la Tierra. Hecha con React y TypeScript, pre-renderizada, bilingüe y legible sin JavaScript.',
  },
  about: {
    en: [
      'Cosmos is my personal portfolio, designed as a story: scrolling moves time forward from the Big Bang to the present day, and each stage of the universe is a section of the site.',
      'The goal was a site that is visually striking and still easy to follow: all the content lives in the HTML, and a quick-mission mode shows everything on one page.',
    ],
    es: [
      'Cosmos es mi portfolio personal, pensado como una historia: el scroll hace avanzar el tiempo desde el Big Bang hasta hoy, y cada etapa del universo es una sección de la web.',
      'El objetivo era una web visualmente brutal y a la vez fácil de seguir: todo el contenido vive en el HTML, y un modo misión rápida lo muestra todo en una página.',
    ],
  },
  features: [
    { en: 'Bilingual site (English / Spanish)', es: 'Web bilingüe (inglés / español)' },
    {
      en: 'Quick-mission mode with all the content on one page',
      es: 'Modo misión rápida con todo el contenido en una página',
    },
    {
      en: 'Readable without JavaScript and with reduced motion',
      es: 'Legible sin JavaScript y con movimiento reducido',
    },
    {
      en: 'A page per project, pre-rendered for search engines',
      es: 'Una página por proyecto, pre-renderizada para buscadores',
    },
  ],
  stack: {
    core: ['React', 'TypeScript'],
    libraries: ['React Router', 'Zustand'],
    design: ['CSS Modules', RESPONSIVE_DESIGN],
    tooling: [
      'Vite',
      'Vitest',
      'Playwright',
      'ESLint',
      'Prettier',
      'GitHub Actions',
      'Vercel',
      'Git',
      'npm',
    ],
  },
  process: { en: [], es: [] },
  highlights: [],
  notes: [
    {
      kind: 'info',
      text: {
        en: 'The source code is public on GitHub.',
        es: 'El código es público en GitHub.',
      },
    },
  ],
  tryIt: null,
  links: {
    code: 'https://github.com/Tortoise-code-Z/Portfolio---Cosmos',
    demo: 'https://tortoisecode.dev',
    readme: 'https://github.com/Tortoise-code-Z/Portfolio---Cosmos#readme',
  },
};
