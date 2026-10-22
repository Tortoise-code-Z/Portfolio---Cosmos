// Fuente: docs/01-contenido/habilidades.md. Una constelación por grupo; el orden es el de lectura.

import type { SkillGroup } from './types';

export const skillGroups: readonly SkillGroup[] = [
  {
    id: 'web',
    title: { en: 'Web development', es: 'Desarrollo web' },
    skills: [
      { id: 'html', label: 'HTML' },
      { id: 'css', label: 'CSS' },
      { id: 'javascript', label: 'JavaScript' },
      { id: 'typescript', label: 'TypeScript' },
      { id: 'php', label: 'PHP' },
      { id: 'mysql', label: 'MySQL' },
      { id: 'apache', label: 'Apache' },
    ],
  },
  {
    id: 'libraries',
    title: { en: 'Libraries & frameworks', es: 'Librerías y frameworks' },
    skills: [
      { id: 'react-ts', label: 'React + TypeScript' },
      { id: 'react-query', label: 'React Query' },
      { id: 'zustand', label: 'Zustand' },
      { id: 'react-router', label: 'React Router' },
      { id: 'react-hook-form', label: 'React Hook Form' },
      { id: 'zod', label: 'Zod' },
      { id: 'css-modules', label: 'CSS Modules' },
      { id: 'r3f', label: 'Three.js / React Three Fiber' },
      { id: 'tailwind', label: 'Tailwind' },
      { id: 'bootstrap', label: 'Bootstrap' },
    ],
  },
  {
    id: 'tools',
    title: { en: 'Tools & workflow', es: 'Herramientas y flujo de trabajo' },
    skills: [
      { id: 'git', label: 'Git' },
      { id: 'github', label: 'GitHub' },
      { id: 'vite', label: 'Vite' },
      { id: 'vitest', label: 'Vitest' },
      { id: 'playwright', label: 'Playwright' },
      { id: 'docker', label: 'Docker' },
      { id: 'figma', label: 'Figma' },
      { id: 'vms', label: { en: 'Virtual machines', es: 'Máquinas virtuales' } },
    ],
  },
  {
    id: 'ai',
    title: { en: 'AI-assisted development', es: 'Desarrollo con IA' },
    skills: [
      { id: 'ai-pair', label: { en: 'AI pair programming', es: 'Programación en pareja con IA' } },
      {
        id: 'ai-agents',
        label: { en: 'Agentic coding workflows', es: 'Flujos de desarrollo con agentes' },
      },
      {
        id: 'ai-prompting',
        label: { en: 'Prompt & context engineering', es: 'Ingeniería de prompts y contexto' },
      },
      {
        id: 'ai-review',
        label: {
          en: 'AI-assisted code review & testing',
          es: 'Revisión de código y tests con IA',
        },
      },
      { id: 'claude', label: 'Claude' },
      { id: 'chatgpt', label: 'ChatGPT' },
    ],
  },
];
