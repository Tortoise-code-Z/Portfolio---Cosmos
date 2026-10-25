// Fuente: docs/01-contenido/proyectos/cosmos.md. Stack desde docs/05-tecnico/stack.md;
// process y highlights quedan vacíos hasta F6 (solo se publica lo que está hecho).

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
    en: 'The site you are on. Tens of thousands of particles morph from a singularity into a nebula, a galaxy, a cosmic turtle and Earth as you scroll, built with React, TypeScript and WebGL, and still readable without any of it.',
    es: 'La web en la que estás. Decenas de miles de partículas pasan de una singularidad a una nebulosa, una galaxia, una tortuga cósmica y la Tierra mientras haces scroll. Hecha con React, TypeScript y WebGL, y legible sin nada de eso.',
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
    {
      en: 'Scroll-driven particle morphing across five scenes',
      es: 'Morph de partículas guiado por el scroll en cinco escenas',
    },
    {
      en: 'Interactive constellations and project plates',
      es: 'Constelaciones y placas de proyecto interactivas',
    },
    { en: 'Bilingual site (English / Spanish)', es: 'Web bilingüe (inglés / español)' },
    {
      en: 'Quick-mission mode with all the content on one page',
      es: 'Modo misión rápida con todo el contenido en una página',
    },
    {
      en: 'Works without WebGL and with reduced motion',
      es: 'Funciona sin WebGL y con movimiento reducido',
    },
    {
      en: 'A page per project, pre-rendered for search engines',
      es: 'Una página por proyecto, pre-renderizada para buscadores',
    },
  ],
  stack: {
    core: ['React', 'TypeScript', 'Three.js', 'React Three Fiber', 'GLSL'],
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
        en: 'The source code is public; the README explains the architecture.',
        es: 'El código es público; el README explica la arquitectura.',
      },
    },
  ],
  tryIt: null,
  links: {
    code: 'https://github.com/Tortoise-code-Z/Portfolio---Cosmos',
    demo: 'https://cosmos-portfolio-two.vercel.app',
    readme: 'https://github.com/Tortoise-code-Z/Portfolio---Cosmos#readme',
  },
};
