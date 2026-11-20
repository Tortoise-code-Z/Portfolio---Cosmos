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
      'I first wrote code in 2019, in a scientific computing module with Python during my first year of Physics. I came back to it on my own in 2022, and curiosity turned into a career: in 2024 I finished a 975-hour full-stack web programming course with a Distinction.',
      'In 2026 I completed a three-month remote internship at Studios Demanzon, building React and Next.js interfaces for a B2B game launcher and working with NestJS, Docker and Electron.',
      'I work on both sides, but the front end is where I feel most at home: turning designs into precise interfaces with React and TypeScript. I use AI (Claude) every day to move faster, and I read and understand every change before it goes in.',
    ],
    es: [
      'Escribí mi primer código en 2019, en una asignatura de computación científica con Python durante mi primer año de Física. Lo retomé por mi cuenta en 2022 y la curiosidad se convirtió en profesión: en 2024 terminé un curso de programación web full-stack de 975 horas con Sobresaliente.',
      'En 2026 hice tres meses de prácticas en remoto en Studios Demanzon: interfaces con React y Next.js para un lanzador de juegos B2B, y trabajo con NestJS, Docker y Electron.',
      'Trabajo en los dos lados, pero donde más cómodo me siento es en el frontend: convertir diseños en interfaces precisas con React y TypeScript. Uso IA (Claude) a diario para ir más rápido, y leo y entiendo cada cambio antes de que entre.',
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
    email: 'victorperez@tortoisecode.dev',
    github: 'https://github.com/Tortoise-code-Z',
    linkedin: 'https://www.linkedin.com/in/v%C3%ADctor-p%C3%A9rez-developer',
  },
  // El PDF es el CV en inglés, para los dos idiomas: una copia del CV maestro, que vive fuera del repo. Cada vez que
  // cambie el CV, se vuelve a copiar aquí (docs/01-contenido/assets.md → «CV en PDF»).
  cv: { en: '/Victor_Perez_CV.pdf', es: '/Victor_Perez_CV.pdf' },
  education: [
    {
      id: 'masterd-fullstack',
      title: {
        en: 'Advanced Course in Web Programming (Full-Stack)',
        es: 'Curso Superior en Programación de Páginas Web (Full-Stack)',
      },
      school: 'Master.D',
      period: { en: 'Jan 2023 – Oct 2024', es: 'ene 2023 – oct 2024' },
      hours: 975,
      grade: { en: 'Distinction', es: 'Sobresaliente' },
      status: 'completed',
      skills: ['HTML', 'CSS', 'JavaScript', 'AJAX', 'PHP', 'MySQL', 'Apache'],
    },
    {
      id: 'holamundo-react-ts',
      title: { en: 'React + TypeScript Course', es: 'Curso de React + TypeScript' },
      school: 'Hola Mundo',
      period: { en: '2025', es: '2025' },
      hours: 13,
      status: 'completed',
      skills: ['React', 'TypeScript'],
    },
  ],
};
