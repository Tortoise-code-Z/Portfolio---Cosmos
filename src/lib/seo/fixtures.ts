// Datos de mentira para los tests de lib/seo: lib no importa el contenido real (ADR-017) y así cada
// test controla lo que comprueba. No se usa fuera de los tests.

import type { CoverAsset, Profile, Project, SkillGroup } from '~/content/types';

export const ORIGIN = 'https://cosmos.test';

export const fakeProfile: Profile = {
  name: 'Ada Pérez',
  fullName: 'Ada Pérez López',
  alias: 'Ada_code',
  role: { en: 'Frontend Developer', es: 'Desarrolladora Frontend' },
  headline: { en: 'Builds interfaces.', es: 'Construye interfaces.' },
  bio: { en: ['Bio.'], es: ['Bio.'] },
  strengths: [{ en: 'Focus', es: 'Foco' }],
  location: { city: 'Cork', country: { en: 'Ireland', es: 'Irlanda' } },
  availability: { openToWork: true, modes: ['remote'], openToRelocation: false },
  contact: {
    email: 'ada@example.com',
    github: 'https://github.com/ada',
    linkedin: 'https://www.linkedin.com/in/ada',
  },
  cv: { en: null, es: null },
  education: [],
};

export const fakeSkillGroups: readonly SkillGroup[] = [
  {
    id: 'web',
    title: { en: 'Web', es: 'Web' },
    skills: [
      { id: 'html', label: 'HTML' },
      { id: 'vms', label: { en: 'Virtual machines', es: 'Máquinas virtuales' } },
    ],
  },
];

export function fakeProject(slug: string, name: string): Project {
  return {
    slug,
    order: 1,
    featured: true,
    name,
    tagline: { en: `${name} tagline`, es: `${name} lema` },
    year: 2025,
    role: 'frontend',
    context: 'personal',
    summary: { en: `${name} summary.`, es: `Resumen de ${name}.` },
    about: { en: ['About.'], es: ['Sobre.'] },
    features: [{ en: 'Feature', es: 'Función' }],
    stack: { core: ['React'], libraries: [], design: [], tooling: [] },
    process: { en: [], es: [] },
    highlights: [],
    notes: [],
    tryIt: null,
    cover: null,
    gallery: [],
    links: {
      code: `https://github.com/ada/${slug}`,
      demo: null,
      readme: `https://github.com/ada/${slug}#readme`,
    },
  };
}

/** Portada con su imagen para compartir: rutas con la forma de las del build (hash con mayúsculas y `_`). */
export const fakeCover: CoverAsset = {
  src: '/assets/home-Ab_1.webp',
  width: 1920,
  height: 960,
  sources: { avif: '/assets/home-Cd_2.avif 1920w', webp: '/assets/home-Ab_1.webp 1920w' },
  alt: { en: 'Beta home page', es: 'Página de inicio de Beta' },
  share: { src: '/assets/home-Ef-3.jpeg', width: 1200, height: 600 },
};

export const fakeProjects: readonly Project[] = [
  fakeProject('alpha', 'Alpha'),
  fakeProject('beta-2', 'Beta'),
];
