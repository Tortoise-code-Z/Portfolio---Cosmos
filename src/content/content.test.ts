// Invariantes del contenido real (docs/01-contenido/modelo-de-datos.md → «Reglas que comprueban los
// tests»). La regla 6 (cada skill tiene posición en la escena) la comprueba `scene/config/constellationLayout`. Las
// funciones `find…` están probadas con casos rotos en `validate.test.ts`; lo que se comprueba aquí en línea
// (capítulos, idiomas, galerías de las fichas, qué proyectos tienen imágenes) es una lista escrita a mano a propósito.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  CHAPTER_ANCHORS,
  CHAPTER_INDICES,
  CHAPTER_STOPS,
  chapterHash,
  EPILOGUE,
  INTERLUDE,
  INTERLUDES,
  isInterludeStop,
  isTransmissionStop,
  JOURNEY_SEGMENTS,
  stopChapter,
} from './chapters';
import { experience } from './experience';
import { SHARE_IMAGE_WIDTH } from './imageWidths';
import { profile } from './profile';
import { siteShare } from './shareImage';
import { assembleProjects, projectDetails, projects } from './projects';
import { cosmos } from './projects/cosmos';
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
import { AUDIT_LOOP, browserName, LAUNCH_SEQUENCE } from './workflow';
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

/**
 * El CV que se revisó contra el sitio (public/Victor_Perez_CV.pdf, al cerrar la fase C) y lo que dice, tal cual. Al copiar
 * un CV nuevo, su huella cambia y el test pide revisar esta tabla contra él (y el sitio, si algo cambió).
 */
const CV_PDF_SHA256 = '824d8c63b5846e39c65d30cdb67aa63b44ea6d314eea3b46e8b243839b3ef9da';
const CV_FACTS = {
  email: 'victorperez@tortoisecode.dev',
  github: 'https://github.com/Tortoise-code-Z',
  linkedin: 'https://www.linkedin.com/in/v%C3%ADctor-p%C3%A9rez-developer',
  city: 'Killarney',
  workPermit: 'EU citizen – full right to work in Ireland',
  availableNow: true,
  modes: ['remote', 'hybrid', 'onsite'],
  relocation: true,
  role: 'Software Developer Intern',
  company: 'Studios Demanzon',
  where: 'Remote · Tenerife, Spain',
  when: 'Jul 2026 – Oct 2026',
  course: 'Advanced Course in Web Programming (Full-Stack)',
  school: 'Master.D',
  courseWhen: 'Jan 2023 – Oct 2024',
  courseHours: 975,
  grade: 'Distinction',
  reactCourse: 'React + TypeScript Course',
  reactSchool: 'Hola Mundo',
  reactWhen: '2025',
  reactHours: 13,
  languages: ['Spanish', 'English'],
} as const;

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
  it('seis capítulos en orden (el último, el epílogo); ancla en todos menos el inicio, y todas distintas', () => {
    expect(CHAPTER_INDICES).toEqual([0, 1, 2, 3, 4, 5]);
    expect(EPILOGUE).toBe(CHAPTER_INDICES.at(-1));
    expect(CHAPTER_ANCHORS[0]).toBeNull();
    const anchors = CHAPTER_INDICES.slice(1).map((index) => CHAPTER_ANCHORS[index]);
    expect(anchors.every((anchor) => anchor !== null)).toBe(true);
    expect(new Set(anchors).size).toBe(anchors.length);
  });

  it('los tramos del viaje: los capítulos en orden, cada interludio con su pantalla y su cola tras su capítulo (con los huecos de su nave alrededor de la pantalla, si la trae)', () => {
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
      const gap = interlude.ship ? 1 : 0;
      if (interlude.ship) {
        expect(JOURNEY_SEGMENTS[screen - 1]).toMatchObject({
          kind: 'interlude-arrival',
          interlude: interlude.id,
        });
        expect(JOURNEY_SEGMENTS[screen + 1]).toMatchObject({
          kind: 'interlude-exit',
          interlude: interlude.id,
        });
      }
      expect(JOURNEY_SEGMENTS[screen - 1 - gap]).toMatchObject({
        kind: 'chapter',
        chapter: interlude.after,
      });
      expect(JOURNEY_SEGMENTS[screen + 1 + gap]).toMatchObject({
        kind: 'interlude-tail',
        interlude: interlude.id,
      });
    }
    // Un interludio sin nave no tiene huecos.
    const gaps = JOURNEY_SEGMENTS.flatMap((segment) =>
      segment.kind === 'interlude-arrival' || segment.kind === 'interlude-exit'
        ? [segment.interlude]
        : [],
    );
    expect(gaps).toEqual(
      INTERLUDES.filter((item) => item.ship).flatMap((item) => [item.id, item.id]),
    );
  });

  it('los huecos de una nave dejan quieta la m del capítulo de antes (la cámara no se mueve: la forma va aparte)', () => {
    for (const segment of JOURNEY_SEGMENTS) {
      if (segment.kind !== 'interlude-arrival' && segment.kind !== 'interlude-exit') continue;
      expect(segment.base).toBe(INTERLUDE[segment.interlude].after);
      expect(segment.morphStart).toBeNull();
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

  it('la llegada del epílogo (ADR-039): justo antes de leerlo, desde la forma de antes y desde la Tierra', () => {
    const arrivals = JOURNEY_SEGMENTS.flatMap((segment, index) =>
      segment.kind === 'arrival' ? [{ segment, index }] : [],
    );
    expect(arrivals).toHaveLength(1);
    const [{ segment, index }] = arrivals as [
      { segment: (typeof JOURNEY_SEGMENTS)[number]; index: number },
    ];
    expect(segment).toMatchObject({ chapter: EPILOGUE, base: EPILOGUE - 1, morphStart: 0 });
    expect(JOURNEY_SEGMENTS[index + 1]).toMatchObject({ kind: 'chapter', chapter: EPILOGUE });
    // Contacto ya no cambia: la Tierra pasa al retrato en la llegada.
    expect(JOURNEY_SEGMENTS[index - 1]).toMatchObject({
      kind: 'chapter',
      chapter: EPILOGUE - 1,
      morphStart: null,
    });
  });

  it('un interludio y el capítulo de antes se quedan quietos (su pantalla y él), y «Skip» lleva al capítulo siguiente', () => {
    for (const interlude of INTERLUDES) {
      const { id } = interlude;
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
    // Se leen como transmisión (el HUD se esconde): los interludios y el epílogo, ningún otro capítulo.
    expect(
      [
        ...CHAPTER_INDICES.map((index) => CHAPTER_STOPS[index]),
        ...INTERLUDES.map(({ id }) => id),
      ].filter(isTransmissionStop),
    ).toEqual([CHAPTER_STOPS[EPILOGUE], ...INTERLUDES.map(({ id }) => id)]);
    expect(chapterHash(0)).toBe('');
    expect(chapterHash(EPILOGUE)).toBe('#crew-file');
    expect(chapterHash(2)).toBe('#skills');
  });

  it('interludios con ancla propia, distinta de la de los capítulos', () => {
    const anchors = [...Object.values(CHAPTER_ANCHORS), ...INTERLUDES.map((item) => item.anchor)];
    expect(new Set(anchors).size).toBe(anchors.length);
  });

  it('la misión: el registro tiene seis entradas (una por viñeta del CV) y el manifiesto las cubre todas', () => {
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

  it('la imagen para compartir del sitio: 1200×630 por idioma (Open Graph) y un alt con lo que se lee en ella', () => {
    const host = new URL(cosmos.links.demo ?? '').host;
    for (const locale of LOCALES) {
      expect(siteShare.share[locale]).toMatchObject({ width: 1200, height: 630 });
      expect(siteShare.alt[locale]).toContain(profile.name);
      expect(siteShare.alt[locale]).toContain(uiTexts[locale]['hero.kicker']);
      expect(siteShare.alt[locale]).toContain(host);
    }
  });

  it('los iconos de public/ (`npm run og`) miden lo que dicen el manifest y `apple-touch-icon`', () => {
    const pngSize = (file: string): string => {
      const bytes = readFileSync(join(PUBLIC_DIR, file));
      expect(bytes.toString('latin1', 12, 16), file).toBe('IHDR');
      return `${String(bytes.readUInt32BE(16))}x${String(bytes.readUInt32BE(20))}`;
    };
    expect(pngSize('apple-touch-icon.png')).toBe('180x180');
    const manifest = JSON.parse(readFileSync(join(PUBLIC_DIR, 'manifest.webmanifest'), 'utf8')) as {
      readonly name: string;
      readonly icons: readonly {
        readonly src: string;
        readonly sizes: string;
        readonly type: string;
      }[];
    };
    expect(manifest.name).toContain(profile.name);
    const pngs = manifest.icons.filter((icon) => icon.type === 'image/png');
    expect(pngs.map((icon) => icon.sizes)).toEqual(['192x192', '512x512']);
    for (const icon of pngs) expect(pngSize(icon.src.slice(1))).toBe(icon.sizes);
  });

  it('el favicon es XML válido: si no, el navegador no lo lee como imagen y la pestaña sale sin icono', () => {
    // Un comentario con dos guiones seguidos (p. ej. citando `--color-void`) basta para romperlo.
    const svg = readFileSync(join(PUBLIC_DIR, 'favicon.svg'), 'utf8');
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
    expect(doc.documentElement.tagName).toBe('svg');
  });

  /** Un color de `tokens.css` (`--color-<name>`, en hex de 6 cifras). */
  const tokenColor = (name: string): string | undefined =>
    new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6});`).exec(
      readFileSync(join(PUBLIC_DIR, '..', 'src', 'styles', 'tokens.css'), 'utf8'),
    )?.[1];

  it('el favicon solo pinta con colores de los tokens (vacío, estrella, aurora), blanco o nada, y las líneas al 75 %', () => {
    const allowed = [
      tokenColor('void'),
      tokenColor('star'),
      tokenColor('aurora'),
      '#ffffff',
      'none',
    ];
    expect(allowed).not.toContain(undefined);
    const doc = new DOMParser().parseFromString(
      readFileSync(join(PUBLIC_DIR, 'favicon.svg'), 'utf8'),
      'image/svg+xml',
    );
    // Sin hojas ni `style` (colores que el recorrido no vería); cada fill, stroke y stop-color, de la lista.
    expect(doc.getElementsByTagName('style')).toHaveLength(0);
    const painted = [...doc.getElementsByTagName('*')].flatMap((element) => {
      expect(element.hasAttribute('style'), element.tagName).toBe(false);
      return ['fill', 'stroke', 'stop-color'].flatMap((attribute) => {
        const value = element.getAttribute(attribute);
        return value === null ? [] : [value.toLowerCase()];
      });
    });
    expect(painted.length).toBeGreaterThan(0);
    expect(painted.filter((color) => !allowed.includes(color))).toEqual([]);
    const lines = [...doc.getElementsByTagName('g')].find(
      (group) => group.getAttribute('stroke') !== null,
    );
    expect(lines?.getAttribute('stroke-opacity')).toBe('0.75');
  });

  it('el color del espacio de la cabecera y el manifest es el token (`--color-void`)', () => {
    const void_ = tokenColor('void');
    const manifest = JSON.parse(readFileSync(join(PUBLIC_DIR, 'manifest.webmanifest'), 'utf8')) as {
      readonly theme_color: string;
      readonly background_color: string;
    };
    expect(manifest.theme_color).toBe(void_);
    expect(manifest.background_color).toBe(void_);
    const root = readFileSync(join(PUBLIC_DIR, '..', 'src', 'root.tsx'), 'utf8');
    expect(/<meta name="theme-color" content="(#[0-9a-f]{6})"/.exec(root)?.[1]).toBe(void_);
  });

  // El sitio no contradice el CV (fase C): los datos que repite, comparados con lo que dice el PDF revisado. Si el PDF
  // cambia (un CV nuevo copiado a public/), falla la huella: se revisa CV_FACTS contra el PDF nuevo y se pone su hash.
  it('el sitio dice lo mismo que el CV en los datos que repite, y el PDF es el que se revisó (sha256)', () => {
    const pdf = readFileSync(join(PUBLIC_DIR, profile.cv.en ?? ''));
    expect(
      createHash('sha256').update(pdf).digest('hex'),
      'CV nuevo: revisa CV_FACTS contra el PDF y actualiza CV_PDF_SHA256',
    ).toBe(CV_PDF_SHA256);
    const [course, reactCourse] = profile.education;
    expect({
      email: profile.contact.email,
      github: profile.contact.github,
      linkedin: profile.contact.linkedin,
      city: profile.location.city,
      workPermit: profile.availability.workPermit.en,
      availableNow: profile.availability.availableNow,
      modes: profile.availability.modes,
      relocation: profile.availability.openToRelocation,
      role: experience.role.en,
      company: experience.company,
      where: experience.location.en,
      when: experience.period.en,
      course: course?.title.en,
      school: course?.school,
      courseWhen: course?.period.en,
      courseHours: course?.hours,
      grade: course?.grade?.en,
      reactCourse: reactCourse?.title.en,
      reactSchool: reactCourse?.school,
      reactWhen: reactCourse?.period.en,
      reactHours: reactCourse?.hours,
      languages: profile.languages.map((language) => language.en),
    }).toEqual(CV_FACTS);
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
    // process y highlights pueden ir vacíos: la sección no se pinta (hoy ninguna ficha los deja vacíos).
    const lists: Record<string, readonly unknown[]> = {
      'profile.bio.en': profile.bio.en,
      'profile.bio.es': profile.bio.es,
      'profile.availability.modes': profile.availability.modes,
      'profile.languages': profile.languages,
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

  it('cada proyecto tiene su detalle y cada detalle es de un proyecto (ADR-036); el stack se junta entero', () => {
    const slugs = projectEntries.map((entry) => entry.slug).sort();
    expect(Object.keys(projectDetails).sort()).toEqual(slugs);
    for (const project of projects) {
      const entry = projectEntries.find(({ slug }) => slug === project.slug);
      const detail = projectDetails[project.slug];
      expect(project.stack).toEqual({ ...entry?.stack, ...detail?.stack });
      expect(Object.keys(project.stack).sort()).toEqual(['core', 'design', 'libraries', 'tooling']);
      expect(project.about).toBe(detail?.about);
    }
    // Un proyecto sin detalle no llega a pintarse a medias: el build falla con su nombre, aunque falte solo uno.
    expect(() =>
      assembleProjects(projectEntries, { ...projectDetails, cosmos: undefined }, projectMedia),
    ).toThrow('«cosmos»');
  });

  it('la metaDescription de una ficha, si la hay, cabe en lo que enseñan los buscadores (≤ 160)', () => {
    const withMeta = projects.filter(({ metaDescription }) => metaDescription !== undefined);
    expect(withMeta.map(({ slug }) => slug)).toEqual(['cosmos']);
    for (const { metaDescription } of withMeta) {
      for (const locale of LOCALES) {
        expect(metaDescription?.[locale].length).toBeLessThanOrEqual(160);
      }
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

  it('la secuencia de Mission control: T-4 a T-0 sin huecos, primero lo de antes del código y el bucle hacia atrás', () => {
    expect(LAUNCH_SEQUENCE.map((step) => step.countdown)).toEqual([4, 3, 2, 1, 0]);
    expect(new Set(LAUNCH_SEQUENCE.map((step) => step.id)).size).toBe(LAUNCH_SEQUENCE.length);
    // Los pasos de antes del código van seguidos y al principio: la cota del esquema los abarca de una vez.
    const beforeCode = LAUNCH_SEQUENCE.map((step) => step.beforeCode);
    expect(beforeCode).toEqual([...beforeCode].sort((a, b) => Number(b) - Number(a)));
    const index = (id: string): number => LAUNCH_SEQUENCE.findIndex((step) => step.id === id);
    expect(index(AUDIT_LOOP.to)).toBeGreaterThanOrEqual(0);
    expect(index(AUDIT_LOOP.from)).toBeGreaterThan(index(AUDIT_LOOP.to));
  });

  it('el nombre de los navegadores del CI: los conocidos con su marca, uno nuevo tal cual', () => {
    expect(['chromium', 'firefox', 'webkit'].map(browserName)).toEqual([
      'Chromium',
      'Firefox',
      'WebKit',
    ]);
    expect(browserName('edge')).toBe('edge');
  });
});
