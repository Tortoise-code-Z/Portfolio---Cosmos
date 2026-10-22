// Invariantes del contenido real (docs/01-contenido/modelo-de-datos.md → «Reglas que comprueban los
// tests»). Las reglas 5 (la imagen existe) y 6 (cada skill tiene posición en la escena) llegan en
// F2.8 y F4. Cada comprobación está probada con casos rotos en `validate.test.ts`.

import { describe, expect, it } from 'vitest';

import { profile } from './profile';
import { projects } from './projects';
import { skillGroups } from './skills';
import { DEFAULT_LOCALE, LOCALES } from './types';
import { uiTexts } from './texts';
import {
  findEmailProblems,
  findIdProblems,
  findProjectOrderProblems,
  findTextProblems,
  findUiProblems,
  findUrlProblems,
} from './validate';

describe('contenido', () => {
  it('EN es el idioma principal y hay exactamente EN y ES', () => {
    expect(LOCALES).toEqual(['en', 'es']);
    expect(DEFAULT_LOCALE).toBe(LOCALES[0]);
  });

  it('todo texto está escrito y todo Localized tiene EN y ES (regla 1)', () => {
    expect(findTextProblems({ profile, skillGroups, projects })).toEqual([]);
  });

  it('slugs únicos y con formato (regla 2)', () => {
    expect(
      findIdProblems(
        projects.map((project) => project.slug),
        'slug',
      ),
    ).toEqual([]);
  });

  it('proyectos en orden de lectura, consecutivos desde 1 y un solo featured (regla 3)', () => {
    expect(projects.length).toBeGreaterThan(0);
    expect(findProjectOrderProblems(projects)).toEqual([]);
  });

  it('enlaces de proyectos y contacto con https:// (regla 4) y email válido', () => {
    const urls: Record<string, string | null> = {
      'contact.github': profile.contact.github,
      'contact.linkedin': profile.contact.linkedin,
    };
    for (const project of projects) {
      for (const [key, url] of Object.entries(project.links)) {
        urls[`${project.slug}.links.${key}`] = url;
      }
    }

    expect(Object.keys(urls)).toHaveLength(2 + projects.length * 3);
    expect(findUrlProblems(urls)).toEqual([]);
    expect(findEmailProblems(profile.contact.email, 'contact.email')).toEqual([]);
  });

  it('ids de skills únicos entre todos los grupos y con formato (regla 6, parte de contenido)', () => {
    const skillIds = skillGroups.flatMap((group) => group.skills.map((skill) => skill.id));
    expect(findIdProblems(skillIds, 'skill')).toEqual([]);
  });

  it('las cuatro constelaciones, cada una con estrellas', () => {
    expect(skillGroups.map((group) => group.id)).toEqual(['web', 'libraries', 'tools', 'ai']);
    for (const group of skillGroups) expect(group.skills.length).toBeGreaterThan(0);
  });

  it('formación con ids únicos y horas enteras positivas', () => {
    expect(
      findIdProblems(
        profile.education.map((item) => item.id),
        'formación',
      ),
    ).toEqual([]);
    for (const item of profile.education) {
      expect(Number.isInteger(item.hours) && item.hours > 0).toBe(true);
    }
  });

  it('textos de interfaz: mismas claves y mismos huecos {x} en EN y ES (regla 7)', () => {
    expect(Object.keys(uiTexts.en).length).toBeGreaterThan(0);
    expect(findUiProblems(uiTexts)).toEqual([]);
  });
});
