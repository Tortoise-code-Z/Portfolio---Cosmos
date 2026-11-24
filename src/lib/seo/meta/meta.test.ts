import type { MetaDescriptor } from 'react-router';
import { describe, expect, it } from 'vitest';

import {
  fakeCover,
  fakeProfile,
  fakeProject,
  fakeSiteShare,
  fakeSkillGroups,
  ORIGIN,
} from '../fixtures';
import { coverShareImage, homeMeta, notFoundMeta, projectMeta, siteShareImage } from './meta';

/** Valor de una etiqueta `meta` por `property` o `name`. */
function metaContent(descriptors: readonly MetaDescriptor[], key: string): string | undefined {
  const found = descriptors.find(
    (descriptor) =>
      ('property' in descriptor && descriptor.property === key) ||
      ('name' in descriptor && descriptor.name === key),
  );
  return found !== undefined && 'content' in found ? String(found.content) : undefined;
}

function links(descriptors: readonly MetaDescriptor[], rel: string): Record<string, unknown>[] {
  return descriptors.filter(
    (descriptor): descriptor is Record<string, unknown> =>
      'tagName' in descriptor &&
      descriptor.tagName === 'link' &&
      'rel' in descriptor &&
      descriptor.rel === rel,
  );
}

function titleOf(descriptors: readonly MetaDescriptor[]): unknown {
  for (const descriptor of descriptors) if ('title' in descriptor) return descriptor.title;
  return undefined;
}

function jsonLdOf(descriptors: readonly MetaDescriptor[]): unknown {
  for (const descriptor of descriptors) {
    if ('script:ld+json' in descriptor) return descriptor['script:ld+json'];
  }
  return undefined;
}

describe('homeMeta', () => {
  const en = homeMeta({
    origin: ORIGIN,
    locale: 'en',
    profile: fakeProfile,
    siteShare: fakeSiteShare,
    skillGroups: fakeSkillGroups,
  });
  const es = homeMeta({
    origin: ORIGIN,
    locale: 'es',
    profile: fakeProfile,
    siteShare: fakeSiteShare,
    skillGroups: fakeSkillGroups,
  });

  it('título y descripción del idioma', () => {
    expect(titleOf(en)).toBe('Víctor Pérez · Frontend Developer (React + TypeScript)');
    expect(titleOf(es)).toBe('Víctor Pérez · Desarrollador Frontend (React + TypeScript)');
    expect(metaContent(es, 'description')).toMatch(/^Portfolio de Víctor Pérez/);
    expect(metaContent(es, 'og:description')).toBe(metaContent(es, 'description'));
  });

  it('cada idioma es su propia canónica y og:url', () => {
    expect(links(en, 'canonical')).toEqual([
      { tagName: 'link', rel: 'canonical', href: 'https://cosmos.test/' },
    ]);
    expect(links(es, 'canonical')).toEqual([
      { tagName: 'link', rel: 'canonical', href: 'https://cosmos.test/es' },
    ]);
    expect(metaContent(es, 'og:url')).toBe('https://cosmos.test/es');
  });

  it('hreflang en, es y x-default (= EN) en los dos idiomas', () => {
    const expected = [
      { tagName: 'link', rel: 'alternate', hrefLang: 'en', href: 'https://cosmos.test/' },
      { tagName: 'link', rel: 'alternate', hrefLang: 'es', href: 'https://cosmos.test/es' },
      { tagName: 'link', rel: 'alternate', hrefLang: 'x-default', href: 'https://cosmos.test/' },
    ];
    expect(links(en, 'alternate')).toEqual(expected);
    expect(links(es, 'alternate')).toEqual(expected);
  });

  it('Open Graph y Twitter', () => {
    expect(metaContent(en, 'og:type')).toBe('website');
    expect(metaContent(en, 'og:site_name')).toBe('Ada Pérez');
    expect(metaContent(en, 'og:locale')).toBe('en_US');
    expect(metaContent(en, 'og:locale:alternate')).toBe('es_ES');
    expect(metaContent(es, 'og:locale')).toBe('es_ES');
    expect(metaContent(es, 'og:locale:alternate')).toBe('en_US');
  });

  it('la imagen para compartir del sitio en su idioma: URL absoluta, 1200×630, alt y tarjeta grande', () => {
    expect(metaContent(en, 'og:image')).toBe('https://cosmos.test/assets/og-en-Gh_4.jpeg');
    expect(metaContent(es, 'og:image')).toBe('https://cosmos.test/assets/og-es-Ij-5.jpeg');
    expect(metaContent(en, 'og:image:width')).toBe('1200');
    expect(metaContent(en, 'og:image:height')).toBe('630');
    expect(metaContent(en, 'og:image:alt')).toBe('Ada Pérez next to a turtle');
    expect(metaContent(es, 'og:image:alt')).toBe('Ada Pérez junto a una tortuga');
    expect(metaContent(en, 'twitter:card')).toBe('summary_large_image');
  });

  it('lleva la ficha Person', () => {
    expect(jsonLdOf(en)).toMatchObject({ '@type': 'Person', url: 'https://cosmos.test/' });
  });
});

describe('projectMeta', () => {
  const project = fakeProject('beta-2', 'Beta');
  const es = projectMeta({
    origin: ORIGIN,
    locale: 'es',
    profile: fakeProfile,
    project,
    siteShare: fakeSiteShare,
  });

  it('título con el nombre, descripción = summary y tipo article', () => {
    expect(titleOf(es)).toBe('Beta · Víctor Pérez');
    expect(metaContent(es, 'description')).toBe('Resumen de Beta.');
    expect(metaContent(es, 'og:type')).toBe('article');
  });

  it('canónica y alternativas del proyecto', () => {
    expect(links(es, 'canonical')[0]?.href).toBe('https://cosmos.test/es/projects/beta-2');
    expect(links(es, 'alternate').map((link) => [link.hrefLang, link.href])).toEqual([
      ['en', 'https://cosmos.test/projects/beta-2'],
      ['es', 'https://cosmos.test/es/projects/beta-2'],
      ['x-default', 'https://cosmos.test/projects/beta-2'],
    ]);
  });

  it('con metaDescription, la descripción es esa y no el summary (también en Open Graph); el JSON-LD sigue con el summary', () => {
    const withMeta = { ...project, metaDescription: { en: 'Short Beta.', es: 'Beta corta.' } };
    const en = projectMeta({
      origin: ORIGIN,
      locale: 'en',
      profile: fakeProfile,
      project: withMeta,
      siteShare: fakeSiteShare,
    });
    const esMeta = projectMeta({
      origin: ORIGIN,
      locale: 'es',
      profile: fakeProfile,
      project: withMeta,
      siteShare: fakeSiteShare,
    });
    expect(metaContent(en, 'description')).toBe('Short Beta.');
    expect(metaContent(en, 'og:description')).toBe('Short Beta.');
    expect(metaContent(esMeta, 'description')).toBe('Beta corta.');
    expect(metaContent(esMeta, 'og:description')).toBe('Beta corta.');
    // Los buscadores leen el JSON-LD entero: ahí no hace falta acortar (pagina-proyecto.md → SEO).
    expect(jsonLdOf(en)).toMatchObject({ description: project.summary.en });
    expect(jsonLdOf(esMeta)).toMatchObject({ description: project.summary.es });
  });

  it('lleva la ficha SoftwareSourceCode', () => {
    expect(jsonLdOf(es)).toMatchObject({ '@type': 'SoftwareSourceCode', name: 'Beta' });
  });

  it('sin portada: la imagen del sitio en su idioma y tarjeta grande', () => {
    expect(metaContent(es, 'og:image')).toBe('https://cosmos.test/assets/og-es-Ij-5.jpeg');
    expect(metaContent(es, 'og:image:height')).toBe('630');
    expect(metaContent(es, 'og:image:alt')).toBe('Ada Pérez junto a una tortuga');
    expect(metaContent(es, 'twitter:card')).toBe('summary_large_image');
  });

  it('con portada: su JPEG para compartir con URL absoluta, medidas y alt del idioma', () => {
    const withCover = { ...project, cover: fakeCover };
    const en = projectMeta({
      origin: ORIGIN,
      locale: 'en',
      profile: fakeProfile,
      project: withCover,
      siteShare: fakeSiteShare,
    });
    const esCover = projectMeta({
      origin: ORIGIN,
      locale: 'es',
      profile: fakeProfile,
      project: withCover,
      siteShare: fakeSiteShare,
    });
    expect(metaContent(en, 'og:image')).toBe('https://cosmos.test/assets/home-Ef-3.jpeg');
    expect(metaContent(en, 'og:image:width')).toBe('1200');
    expect(metaContent(en, 'og:image:height')).toBe('600');
    expect(metaContent(en, 'og:image:alt')).toBe('Beta home page');
    expect(metaContent(esCover, 'og:image:alt')).toBe('Página de inicio de Beta');
    expect(metaContent(en, 'twitter:card')).toBe('summary_large_image');
    // Una sola imagen: ni la portada WebP, ni sus variantes, ni la del sitio.
    expect(
      en.filter((descriptor) => 'property' in descriptor && descriptor.property === 'og:image'),
    ).toHaveLength(1);
  });
});

describe('coverShareImage', () => {
  it('usa `share` (no la portada WebP) y el alt de la portada', () => {
    expect(coverShareImage(ORIGIN, 'es', fakeCover)).toEqual({
      url: 'https://cosmos.test/assets/home-Ef-3.jpeg',
      width: 1200,
      height: 600,
      alt: 'Página de inicio de Beta',
    });
  });
});

describe('siteShareImage', () => {
  it('el JPEG del idioma con sus medidas y su alt', () => {
    expect(siteShareImage(ORIGIN, 'en', fakeSiteShare)).toEqual({
      url: 'https://cosmos.test/assets/og-en-Gh_4.jpeg',
      width: 1200,
      height: 630,
      alt: 'Ada Pérez next to a turtle',
    });
  });
});

describe('notFoundMeta', () => {
  const es = notFoundMeta({ locale: 'es', profile: fakeProfile });

  it('noindex, título de la 404, sin canónica, hreflang, og:url ni JSON-LD', () => {
    expect(titleOf(es)).toBe('Perdido en el espacio · Víctor Pérez');
    expect(metaContent(es, 'robots')).toBe('noindex');
    expect(links(es, 'canonical')).toEqual([]);
    expect(links(es, 'alternate')).toEqual([]);
    expect(metaContent(es, 'og:url')).toBeUndefined();
    expect(jsonLdOf(es)).toBeUndefined();
    expect(metaContent(es, 'og:type')).toBe('website');
  });

  it('sin imagen para compartir (página sin dirección propia)', () => {
    expect(metaContent(es, 'og:image')).toBeUndefined();
    expect(metaContent(es, 'twitter:card')).toBe('summary');
  });
});
