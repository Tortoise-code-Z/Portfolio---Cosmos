// Invariantes del contenido real (docs/01-contenido/modelo-de-datos.md → «Reglas que comprueban los
// tests»). La regla 6 (cada skill tiene posición en la escena) la comprueba `scene/config/constellationLayout`. Las
// funciones `find…` están probadas con casos rotos en `validate.test.ts`; lo que se comprueba aquí en línea
// (capítulos, idiomas, galerías de las fichas, qué proyectos tienen imágenes) es una lista escrita a mano a propósito.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  CHAPTER_ANCHORS,
  CHAPTER_INDICES,
  CHAPTER_STOPS,
  chapterHash,
  INTERLUDES,
  isInterludeStop,
  JOURNEY_SEGMENTS,
  stopChapter,
} from './chapters';
import { experience } from './experience';
import { SHARE_IMAGE_WIDTH } from './imageWidths';
import { profile } from './profile';
import { projects } from './projects';
import { projectEntries } from './projects/entries';
import { projectMedia } from './projects/media';
import { skillGroups } from './skills';
import {
  DEFAULT_LOCALE,
  LOCALES,
  type ImageFile,
  type Localized,
  type ResponsiveImage,
} from './types';
import { uiTexts } from './texts';
import {
  findEmailProblems,
  findEmptyListProblems,
  findIdProblems,
  findImageFileProblems,
  findImageProblems,
  findPositiveIntegerProblems,
  findProjectMediaProblems,
  findProjectOrderProblems,
  findTextProblems,
  findUiProblems,
  findUrlProblems,
} from './validate/validate';

/**
 * `public/`, donde vive el CV (`profile.cv` es su ruta en el sitio). Con `join` y no con `new URL(…,
 * import.meta.url)`: Vite reescribe ese patrón como la URL de un asset.
 */
const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public');

/** Una captura de la galería como la escribe su ficha: archivo (sin extensión), alt EN y alt ES. */
type ExpectedImage = readonly [file: string, en: string, es: string];

/**
 * Las imágenes de cada proyecto tal como las fija su ficha (docs/01-contenido/proyectos/<slug>.md →
 * «Imágenes»): el alt de la portada y la galería en orden. Copiadas a mano a propósito: si `media.ts` cambia
 * un texto, el orden o repite una captura, falla. Un proyecto con imágenes nuevo se añade aquí.
 */
const EXPECTED_MEDIA: Readonly<
  Record<string, { readonly cover: Localized; readonly gallery: readonly ExpectedImage[] }>
> = {
  chessmate: {
    cover: { en: 'Chessmate home page', es: 'Página de inicio de Chessmate' },
    gallery: [
      ['01-home', 'Home', 'Inicio'],
      ['02-courses', 'Courses', 'Cursos'],
      ['03-course-detail', 'Course detail', 'Detalle del curso'],
      ['04-dashboard', 'Dashboard', 'Dashboard'],
      ['05-classroom', 'Classroom', 'Classroom'],
      [
        '06-purchased-course-classroom',
        'Classroom for a purchased course',
        'Classroom de un curso comprado',
      ],
      ['07-login', 'Login', 'Inicio de sesión'],
      ['08-sign-up', 'Sign-up', 'Registro'],
      ['09-contact', 'Contact', 'Contacto'],
    ],
  },
  astrohub: {
    cover: { en: 'AstroHub home page', es: 'Página de inicio de AstroHub' },
    gallery: [
      ['01-home', 'Home', 'Inicio'],
      ['02-news', 'News', 'Noticias'],
      ['03-appointments', 'Appointments', 'Citas'],
      ['04-login', 'Login', 'Inicio de sesión'],
      ['05-sign-up', 'Sign-up', 'Registro'],
      ['06-profile', 'Profile', 'Perfil'],
      ['07-admin-users', 'Admin · users', 'Administración de usuarios'],
      ['08-admin-news', 'Admin · news', 'Administración de noticias'],
      ['09-admin-appointments', 'Admin · appointments', 'Administración de citas'],
      ['10-admin-edit-user', 'Editing a user', 'Edición de usuarios'],
      ['11-admin-edit-news', 'Editing a news item', 'Edición de noticias'],
      ['12-admin-edit-appointment', 'Editing an appointment', 'Edición de citas'],
    ],
  },
};

/** Archivo de una captura, de la `src` que da el sustituto de Vitest (`/assets/01-home-1920.webp`). */
function fileOf(src: string): string {
  return /^\/assets\/(.+)-\d+\.webp$/.exec(src)?.[1] ?? src;
}

describe('contenido', () => {
  it('cinco capítulos en orden; ancla en todos menos el inicio, y todas distintas', () => {
    expect(CHAPTER_INDICES).toEqual([0, 1, 2, 3, 4]);
    expect(CHAPTER_ANCHORS[0]).toBeNull();
    const anchors = CHAPTER_INDICES.slice(1).map((index) => CHAPTER_ANCHORS[index]);
    expect(anchors.every((anchor) => anchor !== null)).toBe(true);
    expect(new Set(anchors).size).toBe(anchors.length);
  });

  it('los tramos del viaje: los capítulos en orden, cada interludio con su pantalla y su cola tras su capítulo', () => {
    const chapters = JOURNEY_SEGMENTS.flatMap((segment) =>
      segment.kind === 'chapter' ? [segment.chapter] : [],
    );
    expect(chapters).toEqual(CHAPTER_INDICES);
    const screens = new Map(
      JOURNEY_SEGMENTS.flatMap((segment, index) =>
        segment.kind === 'interlude' ? [[segment.interlude, index] as const] : [],
      ),
    );
    expect([...screens.keys()]).toEqual(INTERLUDES.map((item) => item.id));
    for (const interlude of INTERLUDES) {
      const screen = screens.get(interlude.id) ?? -1;
      expect(JOURNEY_SEGMENTS[screen - 1]).toMatchObject({
        kind: 'chapter',
        chapter: interlude.after,
      });
      expect(JOURNEY_SEGMENTS[screen + 1]).toMatchObject({
        kind: 'interlude-tail',
        interlude: interlude.id,
      });
    }
  });

  it('la escena: cada tramo empieza en su forma y, si cambia, llega a la del siguiente; el último no cambia', () => {
    JOURNEY_SEGMENTS.forEach((segment, index) => {
      const next = JOURNEY_SEGMENTS[index + 1];
      if (segment.kind === 'chapter') expect(segment.base).toBe(segment.chapter);
      if (next === undefined) {
        expect(segment.morphStart).toBeNull();
      } else if (segment.morphStart === null) {
        expect(next.base).toBe(segment.base);
      } else {
        expect(segment.morphStart).toBeGreaterThanOrEqual(0);
        expect(segment.morphStart).toBeLessThan(1);
        expect(next.base).toBe(segment.base + 1);
      }
    });
  });

  it('un interludio y el capítulo de antes se quedan quietos (su pantalla y él), y «Skip» lleva al capítulo siguiente', () => {
    for (const interlude of INTERLUDES) {
      // Con un solo interludio, el tipo ya sabe que es el suyo: se compara como texto, para cuando haya más.
      const id: string = interlude.id;
      const screen = JOURNEY_SEGMENTS.find(
        (segment) => segment.kind === 'interlude' && segment.interlude === id,
      );
      const before = JOURNEY_SEGMENTS.find(
        (segment) => segment.kind === 'chapter' && segment.chapter === interlude.after,
      );
      expect(screen?.morphStart).toBeNull();
      expect(before?.morphStart).toBeNull();
      expect(interlude.next).toBe(interlude.after + 1);
    }
  });

  it('las paradas del raíl: una por capítulo y su capítulo de vuelta, y los interludios aparte', () => {
    for (const index of CHAPTER_INDICES) {
      expect(stopChapter(CHAPTER_STOPS[index])).toBe(index);
      expect(isInterludeStop(CHAPTER_STOPS[index])).toBe(false);
    }
    for (const interlude of INTERLUDES) expect(isInterludeStop(interlude.id)).toBe(true);
    expect(chapterHash(0)).toBe('');
    expect(chapterHash(2)).toBe('#skills');
  });

  it('interludios con ancla propia, distinta de la de los capítulos', () => {
    const anchors = [...Object.values(CHAPTER_ANCHORS), ...INTERLUDES.map((item) => item.anchor)];
    expect(new Set(anchors).size).toBe(anchors.length);
  });

  it('la misión: el registro son las seis viñetas del CV y cada módulo apunta a entradas que existen', () => {
    expect(experience.log).toHaveLength(6);
    const numbers = experience.log.map((_, index) => index + 1);
    const referenced = new Set(experience.modules.flatMap((module) => module.entries));
    for (const entry of referenced) expect(numbers).toContain(entry);
    // Cada entrada sale en algún módulo: el manifiesto cubre todo el registro.
    expect([...referenced].sort((a, b) => a - b)).toEqual(numbers);
    expect(
      findIdProblems(
        experience.modules.map((module) => module.id),
        'módulo',
      ),
    ).toEqual([]);
  });

  it('EN es el idioma principal y hay exactamente EN y ES', () => {
    expect(LOCALES).toEqual(['en', 'es']);
    expect(DEFAULT_LOCALE).toBe(LOCALES[0]);
  });

  it('todo texto está escrito y todo Localized tiene EN y ES (regla 1)', () => {
    expect(findTextProblems({ profile, skillGroups, projects, experience })).toEqual([]);
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

  it('el CV de cada idioma, si lo hay, es un PDF que existe en public/ (el inglés sirve para los dos)', () => {
    for (const locale of LOCALES) {
      const cv = profile.cv[locale];
      if (cv === null) continue;
      expect(cv).toMatch(/^\/[\w.-]+\.pdf$/);
      expect(readFileSync(join(PUBLIC_DIR, cv)).subarray(0, 5).toString()).toBe('%PDF-');
    }
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

  it('con galería hay portada, es su 1.ª captura, comparte a 1200 px y nada se repite (regla 5)', () => {
    expect(findProjectMediaProblems(projects, SHARE_IMAGE_WIDTH)).toEqual([]);
  });

  it('portada y galería de cada proyecto como las fija su ficha: textos, archivos y orden', () => {
    for (const project of projects) {
      const expected = EXPECTED_MEDIA[project.slug];
      expect(project.cover?.alt ?? null, project.slug).toEqual(expected?.cover ?? null);
      expect(
        project.gallery.map(({ src, alt }) => [fileOf(src), alt.en, alt.es]),
        project.slug,
      ).toEqual(expected?.gallery ?? []);
    }
  });

  it('las imágenes son de proyectos que existen', () => {
    const slugs = projectEntries.map((entry) => entry.slug);
    expect(Object.keys(projectMedia).filter((slug) => !slugs.includes(slug))).toEqual([]);
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
