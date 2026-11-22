// Fuente: docs/01-contenido/proyectos/cosmos.md. El detalle de la ficha: solo lo importa
// `projects/index.ts`, que solo cargan la página de proyecto y los tests (ADR-036).

import type { ProjectDetail } from '../../types';
import { RESPONSIVE_DESIGN } from '../labels';

export const cosmos: ProjectDetail = {
  // El `summary` pasa de 220 caracteres y los buscadores cortan hacia 155–160: la ficha lleva la suya (≤ 160).
  metaDescription: {
    en: 'Cosmos, the portfolio you are on: a scroll journey from the Big Bang to Earth in WebGL particles, built with React and TypeScript and readable without WebGL.',
    es: 'Cosmos, el portfolio en el que estás: un viaje por scroll del Big Bang a la Tierra en partículas WebGL, hecho con React y TypeScript y legible sin WebGL.',
  },
  about: {
    en: [
      'Cosmos is my personal portfolio, designed as a story: scrolling moves time forward from the Big Bang to the present day, and each stage of the universe is a section of the site.',
      'The goal was a site that is visually striking and still easy to follow: all the content lives in the HTML, and a quick-mission mode shows everything on one page.',
      'I built it with an AI-assisted workflow (Claude), which I used to learn Three.js and shaders as I went.',
    ],
    es: [
      'Cosmos es mi portfolio personal, pensado como una historia: el scroll hace avanzar el tiempo desde el Big Bang hasta hoy, y cada etapa del universo es una sección de la web.',
      'El objetivo era una web visualmente brutal y a la vez fácil de seguir: todo el contenido vive en el HTML, y un modo misión rápida lo muestra todo en una página.',
      'La he hecho con un flujo de trabajo asistido por IA (Claude), con el que he aprendido Three.js y shaders sobre la marcha.',
    ],
  },
  features: [
    {
      en: 'Scroll-driven particle morphing across five scenes',
      es: 'Morph de partículas guiado por el scroll en cinco escenas',
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
};
