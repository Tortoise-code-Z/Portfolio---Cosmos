// Fuente: docs/01-contenido/proyectos/astrohub.md. La tarjeta del proyecto; el detalle de su página, en
// `details/astrohub.ts` (ADR-036).

import type { ProjectEntry } from '../types';

export const astrohub: ProjectEntry = {
  slug: 'astrohub',
  order: 2,
  featured: false,
  name: 'AstroHub',
  tagline: {
    en: 'A full web app about the universe, from database to interface.',
    es: 'Una aplicación web completa sobre el universo, de la base de datos a la interfaz.',
  },
  year: 2024,
  role: 'fullstack',
  context: 'course',
  summary: {
    en: 'My final project for the full-stack web programming course: a space-themed web app with users, roles, news and astronomy appointments, built with HTML, CSS, JavaScript, PHP and MySQL.',
    es: 'Mi proyecto final del curso de programación web full-stack: una web temática del espacio con usuarios, roles, noticias y citas astronómicas, hecha con HTML, CSS, JavaScript, PHP y MySQL.',
  },
  stack: {
    core: ['HTML', 'CSS', 'JavaScript', 'PHP', 'MySQL'],
  },
  links: {
    code: 'https://github.com/Tortoise-code-Z/Astrohub',
    demo: null,
    readme: 'https://github.com/Tortoise-code-Z/Astrohub#readme',
  },
};
