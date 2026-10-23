import type { MetaDescriptor } from 'react-router';
import { describe, expect, it } from 'vitest';

import { fakeProfile, fakeProject, fakeSkillGroups, ORIGIN } from './fixtures';
import { homeMeta, notFoundMeta, projectMeta } from './meta';

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
    skillGroups: fakeSkillGroups,
  });
  const es = homeMeta({
    origin: ORIGIN,
    locale: 'es',
    profile: fakeProfile,
    skillGroups: fakeSkillGroups,
  });

  it('título y descripción del idioma', () => {
    expect(titleOf(en)).toBe('Víctor Pérez · Frontend Developer (React + TypeScript)');
    expect(titleOf(es)).toBe('Víctor Pérez · Desarrollador Frontend (React + TypeScript)');
    expect(metaContent(es, 'description')).toMatch(/^Portfolio de Víctor Pérez/);
    expect(metaContent(es, 'og:description')).toBe(metaContent(es, 'description'));
  });

  it('cada idioma es su propia canónica y og:url (EST-F2-3-8)', () => {
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

  it('Open Graph y Twitter sin imagen (EST-F2-3-5 y 10)', () => {
    expect(metaContent(en, 'og:type')).toBe('website');
    expect(metaContent(en, 'og:site_name')).toBe('Ada Pérez');
    expect(metaContent(en, 'og:locale')).toBe('en_US');
    expect(metaContent(en, 'og:locale:alternate')).toBe('es_ES');
    expect(metaContent(es, 'og:locale')).toBe('es_ES');
    expect(metaContent(es, 'og:locale:alternate')).toBe('en_US');
    expect(metaContent(en, 'twitter:card')).toBe('summary');
    expect(metaContent(en, 'og:image')).toBeUndefined();
  });

  it('lleva la ficha Person', () => {
    expect(jsonLdOf(en)).toMatchObject({ '@type': 'Person', url: 'https://cosmos.test/' });
  });
});

describe('projectMeta', () => {
  const project = fakeProject('beta-2', 'Beta');
  const es = projectMeta({ origin: ORIGIN, locale: 'es', profile: fakeProfile, project });

  it('título con el nombre, descripción = summary y tipo article (EST-F2-3-9)', () => {
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

  it('lleva la ficha SoftwareSourceCode', () => {
    expect(jsonLdOf(es)).toMatchObject({ '@type': 'SoftwareSourceCode', name: 'Beta' });
  });
});

describe('notFoundMeta', () => {
  const es = notFoundMeta({ locale: 'es', profile: fakeProfile });

  it('noindex, título de la 404, sin canónica, hreflang, og:url ni JSON-LD (EST-F2-3-12)', () => {
    expect(titleOf(es)).toBe('Perdido en el espacio · Víctor Pérez');
    expect(metaContent(es, 'robots')).toBe('noindex');
    expect(links(es, 'canonical')).toEqual([]);
    expect(links(es, 'alternate')).toEqual([]);
    expect(metaContent(es, 'og:url')).toBeUndefined();
    expect(jsonLdOf(es)).toBeUndefined();
    expect(metaContent(es, 'og:type')).toBe('website');
  });
});
