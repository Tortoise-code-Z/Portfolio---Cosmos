// Fuente: docs/01-contenido/proyectos/cosmos.md. Stack desde docs/05-tecnico/stack.md. La tarjeta del
// proyecto; el detalle de su página, en `details/cosmos.ts` (ADR-036).

import type { ProjectEntry } from '../types';

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
    en: 'The site you are on. Tens of thousands of particles morph from a singularity into a nebula, a galaxy, a cosmic turtle and Earth as you scroll. Built with React, TypeScript and WebGL, and still readable without any of it.',
    es: 'La web en la que estás. Decenas de miles de partículas pasan de una singularidad a una nebulosa, una galaxia, una tortuga cósmica y la Tierra mientras haces scroll. Hecha con React, TypeScript y WebGL, y legible sin nada de eso.',
  },
  stack: {
    core: ['React', 'TypeScript', 'Three.js', 'React Three Fiber', 'GLSL'],
  },
  links: {
    code: 'https://github.com/Tortoise-code-Z/Portfolio---Cosmos',
    demo: 'https://tortoisecode.dev',
    readme: 'https://github.com/Tortoise-code-Z/Portfolio---Cosmos#readme',
  },
};
