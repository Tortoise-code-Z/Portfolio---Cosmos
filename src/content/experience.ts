// Fuente: el CV (docs/01-contenido/experiencia.md), suavizado para la web: lo que hizo Víctor, nunca qué es ni cómo
// está construido el producto de la empresa (nota de ADR-034; decisión de Víctor en la fase C). Lo pinta el Mission log (docs/02-experiencia/capitulos/
// interludio-1-mission-log.md) y la misión rápida.

import type { Experience } from './types';

export const experience: Experience = {
  id: 'studios-demanzon',
  company: 'Studios Demanzon',
  role: { en: 'Software Developer Intern', es: 'Desarrollador de software en prácticas' },
  location: { en: 'Remote · Tenerife, Spain', es: 'En remoto · Tenerife, España' },
  period: { en: 'Jul 2026 – Oct 2026', es: 'jul 2026 – oct 2026' },
  status: { en: 'Mission complete', es: 'Misión cumplida' },
  // Lo que hizo Víctor, no qué es el producto: la web es pública (decisión de Víctor, fase C).
  summary: {
    en: 'Three months of remote work across the front end, a desktop app and backend services.',
    es: 'Tres meses en remoto entre el frontend, una app de escritorio y servicios backend.',
  },
  modules: [
    {
      id: 'next-react-ts',
      name: 'Next.js · React · TypeScript',
      purpose: { en: 'Web and desktop interfaces', es: 'Interfaces web y de escritorio' },
      entries: [1, 2, 4],
    },
    {
      id: 'electron',
      name: 'Electron',
      purpose: { en: 'The desktop app', es: 'La app de escritorio' },
      entries: [1, 2, 4],
    },
    {
      id: 'state-rendering',
      name: { en: 'State and rendering', es: 'Estado y renderizado' },
      purpose: { en: 'Bugs found and fixed', es: 'Bugs encontrados y arreglados' },
      entries: [2, 3],
    },
    {
      id: 'n8n',
      name: 'n8n',
      purpose: { en: 'Translation workflows', es: 'Flujos de traducción' },
      entries: [5],
    },
    {
      id: 'nestjs',
      name: 'NestJS',
      purpose: {
        en: 'Backend services and business logic',
        es: 'Servicios backend y lógica de negocio',
      },
      entries: [6],
    },
    {
      id: 'docker',
      name: 'Docker',
      purpose: { en: 'Container images and volumes', es: 'Imágenes de contenedores y volúmenes' },
      entries: [6],
    },
  ],
  // Las viñetas del CV, suavizadas para la web (decisión de Víctor, fase C): lo que hizo, sin decir qué es el producto.
  log: [
    {
      tag: { en: 'BUILT', es: 'CREADO' },
      text: {
        en: 'Built and maintained Next.js, React and TypeScript interfaces for a web platform and an Electron desktop app.',
        es: 'Construí y mantuve interfaces con Next.js, React y TypeScript para una plataforma web y una app de escritorio en Electron.',
      },
    },
    {
      tag: { en: 'ADDED', es: 'AÑADIDO' },
      text: {
        en: 'Added a history view and multi-select actions, kept in sync across every part of the app.',
        es: 'Añadí un historial y acciones con selección múltiple, sincronizados en todas las partes de la app.',
      },
    },
    {
      tag: { en: 'FIXED', es: 'ARREGLADO' },
      text: {
        en: 'Fixed state and rendering bugs: buttons not updating their state, changes that only showed after a page reload, and a broken progress bar.',
        es: 'Arreglé bugs de estado y de renderizado: botones que no actualizaban su estado, cambios que solo se veían al recargar la página y una barra de progreso que no funcionaba.',
      },
    },
    {
      tag: { en: 'ADDED', es: 'AÑADIDO' },
      text: {
        en: 'Added offline access through email-based sign-in, and confirmation modals for destructive actions.',
        es: 'Añadí acceso sin conexión con inicio de sesión por email, y modales de confirmación para las acciones destructivas.',
      },
    },
    {
      tag: { en: 'AUTO', es: 'AUTO' },
      text: {
        en: 'Used n8n to translate the interface into English and keep its content available in every supported language.',
        es: 'Usé n8n para traducir la interfaz al inglés y tener su contenido disponible en todos los idiomas.',
      },
    },
    {
      tag: { en: 'BACKEND', es: 'BACKEND' },
      text: {
        en: 'Implemented backend services and business logic in NestJS, and wrote Dockerfiles to build the container images and set up their volumes.',
        es: 'Implementé servicios backend y lógica de negocio en NestJS, y escribí Dockerfiles para construir las imágenes de los contenedores y configurar sus volúmenes.',
      },
    },
  ],
  reference: {
    quote: {
      en: '…this experience gives him a useful technical foundation to continue growing professionally in the technology sector.',
      es: '…esta experiencia constituye una base técnica útil para continuar creciendo profesionalmente en el sector tecnológico.',
    },
    author: 'Ángel González',
    title: { en: 'CTO, Studios Demanzon', es: 'CTO de Studios Demanzon' },
  },
};
