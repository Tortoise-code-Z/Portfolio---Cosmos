// Fuente: docs/01-contenido/proyectos/chessmate.md.

import type { Project } from '../types';
import { DEMO_USER_LABEL, RESPONSIVE_DESIGN } from './labels';

export const chessmate: Project = {
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
  about: {
    en: [
      'Chessmate is a modern web platform for learning chess online through interactive courses.',
      'I designed it from scratch in Figma and built it with React and TypeScript, simulating a complete backend on the client.',
    ],
    es: [
      'Chessmate es una plataforma web moderna para aprender ajedrez online mediante cursos interactivos.',
      'La diseñé desde cero en Figma y la desarrollé con React y TypeScript, simulando un backend completo desde el cliente.',
    ],
  },
  features: [
    { en: 'Sign-up and login', es: 'Registro y login' },
    { en: 'Course search and filters', es: 'Filtro y búsqueda de cursos' },
    { en: 'Course purchases', es: 'Compra de cursos' },
    { en: 'Personal dashboard', es: 'Dashboard personalizado' },
    { en: 'Virtual classrooms', es: 'Classrooms virtuales' },
    { en: 'Progress tracking', es: 'Seguimiento de progreso' },
  ],
  stack: {
    core: ['React', 'TypeScript'],
    libraries: [
      'React Query',
      'Zustand',
      'React Router',
      'React Hook Form',
      'Zod (+ resolvers)',
      'Embla Carousel',
      'React Player',
    ],
    design: ['CSS Modules', 'Figma', RESPONSIVE_DESIGN],
    tooling: ['Vite', 'Git', 'npm'],
  },
  process: {
    en: [
      'Chessmate was designed and built from scratch to simulate a real online learning platform, entirely on the client side with no backend. The goal was to rebuild an earlier version of the project with everything I had learned about design and code since.',
      'I planned the architecture in Figma, defining reusable components for each section (Home, Courses, Dashboard, Classroom…). In code, I used Zustand for global state and React Query to handle data simulated in localStorage, mimicking calls to a real API. That made purchases, progress and authentication work without a server, with dynamic feedback for errors and invalid routes.',
      'Private routes use React Router, and forms are validated with React Hook Form and Zod. On the visual side, CSS Modules, Embla Carousel and React Player kept the design smooth and performant, with Vite handling the build.',
    ],
    es: [
      'Chessmate se diseñó y desarrolló desde cero para simular una plataforma real de aprendizaje online, completamente del lado del cliente y sin backend. El objetivo era rehacer una versión anterior del proyecto con todo lo que había aprendido desde entonces de diseño y código.',
      'Planifiqué la arquitectura en Figma, con componentes reutilizables para cada sección (Home, Courses, Dashboard, Classroom…). En el código usé Zustand para el estado global y React Query para manejar los datos simulados en localStorage, imitando llamadas a una API real. Así funcionan compras, progreso y autenticación sin servidor, con feedback dinámico ante errores y rutas inválidas.',
      'Las rutas privadas usan React Router y los formularios se validan con React Hook Form y Zod. En lo visual, CSS Modules, Embla Carousel y React Player mantuvieron un diseño fluido y con buen rendimiento, con Vite para el build.',
    ],
  },
  highlights: [
    {
      en: 'Validation and visual feedback for error cases',
      es: 'Validación y feedback visual ante posibles errores',
    },
    { en: 'Protected routes', es: 'Protección de rutas' },
    {
      en: 'Real-time sync between components',
      es: 'Sincronización en tiempo real entre componentes',
    },
    {
      en: 'Performance tuned with React Query caching',
      es: 'Optimización de rendimiento con React Query',
    },
  ],
  notes: [
    {
      kind: 'info',
      text: {
        en: 'The GitHub Pages demo uses a hash router because GitHub Pages only serves static files. Locally, the browser router gives clean URLs and real deep links (/dashboard, /course/:id, /classroom).',
        es: 'La demo de GitHub Pages usa un router con hash porque GitHub Pages solo sirve archivos estáticos. En local, el router del navegador da URLs limpias y enlaces directos reales (/dashboard, /course/:id, /classroom).',
      },
    },
  ],
  tryIt: {
    intro: {
      en: 'Log in, buy a couple of courses and explore the dashboard. The README explains how to force error states from the browser console to see the feedback system in action.',
      es: 'Inicia sesión, compra un par de cursos y explora el panel. El README explica cómo forzar errores desde la consola del navegador para ver el sistema de feedback en acción.',
    },
    steps: [
      {
        en: 'Log in with the demo account (or sign up).',
        es: 'Inicia sesión con la cuenta de demostración (o regístrate).',
      },
      {
        en: 'Go to Courses → All courses and buy the first two.',
        es: 'Ve a Cursos → Todos los cursos y compra los dos primeros.',
      },
      {
        en: 'Open the dashboard and a classroom to see your progress.',
        es: 'Abre el panel y un classroom para ver tu progreso.',
      },
    ],
    // Cuenta de demo pública del proyecto de ejemplo (modelo-de-datos.md → «Credenciales de demo»).
    credentials: [{ label: DEMO_USER_LABEL, user: 'admin', password: '1234' }],
  },
  cover: null,
  gallery: [],
  links: {
    code: 'https://github.com/Tortoise-code-Z/Chessmate-react',
    demo: 'https://tortoise-code-z.github.io/Chessmate-react/',
    readme: 'https://github.com/Tortoise-code-Z/Chessmate-react#readme',
  },
};
