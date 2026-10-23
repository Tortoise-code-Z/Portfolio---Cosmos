// Invariantes del contenido real (docs/01-contenido/modelo-de-datos.md → «Reglas que comprueban los
// tests»). Las reglas 5 (la imagen existe) y 6 (cada skill tiene posición en la escena) llegan en
// F2.8 y F4. Cada comprobación está probada con casos rotos en `validate.test.ts`.

import { describe, expect, it } from 'vitest';

import { CHAPTER_ANCHORS, CHAPTER_INDICES, CHAPTER_MORPH_START } from './chapters';
import { profile } from './profile';
import { projects } from './projects';
import { skillGroups } from './skills';
import { DEFAULT_LOCALE, LOCALES } from './types';
import { uiTexts } from './texts';
import {
  findEmailProblems,
  findEmptyListProblems,
  findIdProblems,
  findPositiveIntegerProblems,
  findProjectOrderProblems,
  findTextProblems,
  findUiProblems,
  findUrlProblems,
} from './validate/validate';

describe('contenido', () => {
  it('cinco capítulos en orden; ancla en todos menos el inicio, y todas distintas', () => {
    expect(CHAPTER_INDICES).toEqual([0, 1, 2, 3, 4]);
    expect(CHAPTER_ANCHORS[0]).toBeNull();
    const anchors = CHAPTER_INDICES.slice(1).map((index) => CHAPTER_ANCHORS[index]);
    expect(anchors.every((anchor) => anchor !== null)).toBe(true);
    expect(new Set(anchors).size).toBe(anchors.length);
  });

  it('una ventana de morph por capítulo salvo el último, dentro de [0, 1)', () => {
    expect(CHAPTER_MORPH_START).toHaveLength(CHAPTER_INDICES.length - 1);
    for (const start of CHAPTER_MORPH_START) {
      expect(start).toBeGreaterThanOrEqual(0);
      expect(start).toBeLessThan(1);
    }
  });

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
    // Todas las URL de contacto y de cada proyecto; el email tiene su propia comprobación.
    const urls: Record<string, string | null> = {};
    for (const [key, url] of Object.entries(profile.contact)) {
      if (key !== 'email') urls[`contact.${key}`] = url;
    }
    for (const project of projects) {
      for (const [key, url] of Object.entries(project.links)) {
        urls[`${project.slug}.links.${key}`] = url;
      }
    }

    expect(Object.keys(urls).length).toBeGreaterThan(0);
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
    expect(profile.education.length).toBeGreaterThan(0);
    expect(
      findIdProblems(
        profile.education.map((item) => item.id),
        'formación',
      ),
    ).toEqual([]);
    expect(
      findPositiveIntegerProblems(
        Object.fromEntries(
          profile.education.map((item) => [`education.${item.id}.hours`, item.hours]),
        ),
      ),
    ).toEqual([]);
  });

  it('las listas que siempre se pintan tienen al menos un elemento (regla 8)', () => {
    // process y highlights pueden ir vacíos: la sección no se pinta (Cosmos hasta F6).
    const lists: Record<string, readonly unknown[]> = {
      'profile.bio.en': profile.bio.en,
      'profile.bio.es': profile.bio.es,
      'profile.strengths': profile.strengths,
      'profile.availability.modes': profile.availability.modes,
    };
    for (const project of projects) {
      lists[`${project.slug}.about.en`] = project.about.en;
      lists[`${project.slug}.about.es`] = project.about.es;
      lists[`${project.slug}.features`] = project.features;
      lists[`${project.slug}.stack.core`] = project.stack.core;
      if (project.tryIt !== null) {
        lists[`${project.slug}.tryIt.steps`] = project.tryIt.steps;
      }
    }

    expect(findEmptyListProblems(lists)).toEqual([]);
  });

  it('textos de interfaz: mismas claves y mismos huecos {x} en EN y ES (regla 7)', () => {
    expect(Object.keys(uiTexts.en).length).toBeGreaterThan(0);
    expect(findUiProblems(uiTexts)).toEqual([]);
  });
});
