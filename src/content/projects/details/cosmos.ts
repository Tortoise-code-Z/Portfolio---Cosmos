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
    {
      en: 'Skill constellations that light up with the mouse, keyboard or touch',
      es: 'Constelaciones de habilidades que se encienden con el ratón, el teclado o el dedo',
    },
    {
      en: 'Two interludes as incoming transmissions: a mission log and how I work',
      es: 'Dos interludios como transmisiones entrantes: un registro de misión y cómo trabajo',
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
  process: {
    en: [
      'I started with an HTML prototype to test the idea and then documented the whole site before writing code: content, experience, design and the 3D scene, chapter by chapter. It was built in phases, each one closed with its tests and an audit, and every decision that shaped the architecture went into a decision log.',
      'The content is typed data that lives in the HTML, pre-rendered for every page. Scrolling drives a single value that both the interface and the scene read. One particle system morphs between shapes in the vertex shader; the shapes are generated in a Web Worker with a fixed seed, so the universe is the same on every visit. The scene loads after the first paint, in its own chunk, and the site is complete without it.',
      'I work with Claude Code: I plan each step, approve it, and read and understand every change before it goes in. A second AI session audits each step with fresh eyes, and its fixes ship before the next task. CI runs the unit tests, end-to-end tests in Chromium, Firefox and WebKit, and visual regression on every pull request.',
    ],
    es: [
      'Empecé con un prototipo en HTML para probar la idea y después documenté la web entera antes de escribir código: contenido, experiencia, diseño y la escena 3D, capítulo a capítulo. Se construyó por fases, cada una cerrada con sus tests y una auditoría, y cada decisión que daba forma a la arquitectura quedó en un registro de decisiones.',
      'El contenido son datos tipados que viven en el HTML, pre-renderizado en cada página. El scroll mueve un único valor que leen la interfaz y la escena. Un solo sistema de partículas pasa de una forma a otra en el shader de vértices; las formas se generan en un Web Worker con una semilla fija, así que el universo es el mismo en cada visita. La escena se carga después de la primera pintura, en su propio chunk, y la web está completa sin ella.',
      'Trabajo con Claude Code: planifico cada paso, lo apruebo y leo y entiendo cada cambio antes de que entre. Una segunda sesión de IA audita cada paso con ojos nuevos, y sus arreglos entran antes de la siguiente tarea. El CI pasa los tests unitarios, los e2e en Chromium, Firefox y WebKit y la regresión visual en cada pull request.',
    ],
  },
  highlights: [
    {
      en: '60,000 particles at a steady 60 fps on desktop, with three quality levels that step down on the fly',
      es: '60.000 partículas a 60 fps estables en escritorio, con tres niveles de calidad que bajan sobre la marcha',
    },
    {
      en: 'The whole 3D scene, Three.js included, within a 260 KB budget checked on every build',
      es: 'Toda la escena 3D, Three.js incluido, dentro de un presupuesto de 260 KB que se comprueba en cada build',
    },
    {
      en: 'Readable without WebGL or JavaScript, with still photos of the scene when WebGL is missing',
      es: 'Legible sin WebGL ni JavaScript, con fotos fijas de la escena cuando falta WebGL',
    },
    {
      en: "Mission control counts the repo's own tests and decisions when the site is built",
      es: 'Mission control cuenta los tests y las decisiones del propio repo al construir la web',
    },
  ],
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
};
