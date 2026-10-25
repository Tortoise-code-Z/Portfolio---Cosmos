// Invariantes del contenido real (docs/01-contenido/modelo-de-datos.md → «Reglas que comprueban los
// tests»). La regla 6 (cada skill tiene posición en la escena) llega en F4. Cada comprobación está
// probada con casos rotos en `validate.test.ts`.

import { describe, expect, it } from 'vitest';

import { CHAPTER_ANCHORS, CHAPTER_INDICES, CHAPTER_MORPH_START } from './chapters';
import { profile } from './profile';
import { projects } from './projects';
import { projectEntries } from './projects/entries';
import { projectMedia } from './projects/media';
import { skillGroups } from './skills';
import { DEFAULT_LOCALE, LOCALES, type ImageFile, type ResponsiveImage } from './types';
import { uiTexts } from './texts';
import {
  findEmailProblems,
  findEmptyListProblems,
  findIdProblems,
  findImageFileProblems,
  findImageProblems,
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

  it('imágenes: medidas y variantes de cada portada, galería e imagen para compartir (regla 5)', () => {
    const images: Record<string, ResponsiveImage> = {};
    const shares: Record<string, ImageFile> = {};
    for (const project of projects) {
      if (project.cover !== null) {
        images[`${project.slug}.cover`] = project.cover;
        shares[`${project.slug}.cover.share`] = project.cover.share;
      }
      project.gallery.forEach((image, index) => {
        images[`${project.slug}.gallery[${String(index)}]`] = image;
      });
    }
    // Chessmate (portada + 9) y AstroHub (portada + 12): que el recorrido no pase en vacío.
    expect(Object.keys(images)).toHaveLength(23);
    expect(findImageProblems(images)).toEqual([]);
    expect(findImageFileProblems(shares)).toEqual([]);
  });

  it('la portada es la primera captura de la galería y su imagen para compartir mide 1200 px', () => {
    for (const project of projects) {
      if (project.cover === null) continue;
      expect(project.cover.src).toBe(project.gallery[0]?.src);
      expect(project.cover.share.width).toBe(1200);
    }
  });

  it('las imágenes son de proyectos que existen y se unen a sus textos en el mismo orden', () => {
    const slugs = projectEntries.map((entry) => entry.slug);
    expect(Object.keys(projectMedia).filter((slug) => !slugs.includes(slug))).toEqual([]);
    expect(projects.map((project) => project.slug)).toEqual(slugs);
    expect(projects.filter((project) => project.cover !== null).map(({ slug }) => slug)).toEqual([
      'chessmate',
      'astrohub',
    ]);
    // Sin entrada en media.ts (Cosmos, hasta F6): sin portada ni galería, sin romper nada.
    expect(projects.find(({ slug }) => slug === 'cosmos')).toMatchObject({
      cover: null,
      gallery: [],
    });
  });

  it('textos de interfaz: mismas claves y mismos huecos {x} en EN y ES (regla 7)', () => {
    expect(Object.keys(uiTexts.en).length).toBeGreaterThan(0);
    expect(findUiProblems(uiTexts)).toEqual([]);
  });
});
