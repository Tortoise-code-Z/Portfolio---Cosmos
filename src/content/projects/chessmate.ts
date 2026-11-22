// Fuente: docs/01-contenido/proyectos/chessmate.md. La tarjeta del proyecto; el detalle de su página, en
// `details/chessmate.ts` (ADR-036).

import type { ProjectEntry } from '../types';

export const chessmate: ProjectEntry = {
  slug: 'chessmate',
  order: 1,
  featured: true,
  name: 'Chessmate',
  tagline: {
    en: 'An online chess academy with interactive courses.',
    es: 'Una academia de ajedrez online con cursos interactivos.',
  },
  year: 2025,
  role: 'frontend',
  context: 'personal',
  summary: {
    en: 'A chess-learning platform designed in Figma and built with React and TypeScript. It simulates a full backend in the browser: sign-up, course purchases, a personal dashboard and progress tracking.',
    es: 'Una plataforma para aprender ajedrez diseñada en Figma y construida con React y TypeScript. Simula un backend completo en el navegador: registro, compra de cursos, panel personal y seguimiento del progreso.',
  },
  stack: {
    core: ['React', 'TypeScript'],
  },
  links: {
    code: 'https://github.com/Tortoise-code-Z/Chessmate-react',
    demo: 'https://tortoise-code-z.github.io/Chessmate-react/',
    readme: 'https://github.com/Tortoise-code-Z/Chessmate-react#readme',
  },
};
