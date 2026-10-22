// Fuente: docs/01-contenido/perfil.md.

import type { Profile } from './types';

export const profile: Profile = {
  name: 'Víctor Pérez',
  fullName: 'Víctor David Pérez Alarcón',
  alias: 'Tortoise_code',
  role: { en: 'Frontend Developer', es: 'Desarrollador Frontend' },
  headline: {
    en: 'Frontend developer building fast, precise and memorable interfaces with React and TypeScript.',
    es: 'Desarrollador frontend que construye interfaces rápidas, precisas y memorables con React y TypeScript.',
  },
  bio: {
    en: [
      'I started coding on my own in 2022. What began as pure curiosity became my profession after an intensive 948-hour Full-Stack program.',
      'I work on both sides of development, but my passion is the front end: turning complex designs into precise interfaces, always focused on the experience of the people who use them.',
      'React and TypeScript are my everyday tools: component architecture, global state, data fetching, forms with validation and testing. I also work with AI every day as part of my development workflow, using it to move faster without lowering the bar on quality.',
    ],
    es: [
      'Empecé a programar por mi cuenta en 2022. Lo que era pura curiosidad por el código se convirtió en mi profesión tras una formación Fullstack intensiva de 948 horas.',
      'Domino los dos lados del desarrollo, pero mi pasión es el frontend: convertir diseños complejos en interfaces precisas, centrado siempre en la experiencia de quien usa la web.',
      'React y TypeScript son mis herramientas del día a día: arquitectura de componentes, estado global, gestión de datos, formularios con validación y testing. Además trabajo a diario con IA como parte de mi flujo de desarrollo, para ir más rápido sin bajar el listón de calidad.',
    ],
  },
  strengths: [
    { en: 'Hard-working', es: 'Trabajador' },
    { en: 'Communication', es: 'Comunicación' },
    { en: 'Perseverance', es: 'Perseverancia' },
  ],
  location: { city: 'Killarney', country: { en: 'Ireland', es: 'Irlanda' } },
  availability: {
    openToWork: true,
    modes: ['remote', 'hybrid', 'onsite'],
    openToRelocation: true,
  },
  contact: {
    email: 'victorperez.brmte@passmail.com',
    github: 'https://github.com/Tortoise-code-Z',
    linkedin: 'https://www.linkedin.com/in/v%C3%ADctor-p%C3%A9rez-developer',
  },
  cv: { en: null, es: null },
  education: [
    {
      id: 'masterd-fullstack',
      title: { en: 'Full-Stack Development Program', es: 'Curso de programación Fullstack' },
      school: 'MasterD',
      period: '2023/24',
      hours: 948,
      status: 'completed',
      skills: ['HTML', 'CSS', 'JavaScript', 'PHP', 'MySQL', 'Apache', 'Git'],
    },
    {
      id: 'holamundo-react-ts',
      title: { en: 'React + TypeScript Course', es: 'Curso de React + TypeScript' },
      school: 'Hola Mundo',
      period: '2025',
      hours: 13,
      status: 'completed',
      skills: ['React', 'TypeScript'],
    },
  ],
};
