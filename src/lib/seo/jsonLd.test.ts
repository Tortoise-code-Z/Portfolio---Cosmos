import { describe, expect, it } from 'vitest';

import { fakeProfile, fakeProject, fakeSkillGroups, ORIGIN } from './fixtures';
import { personId, personJsonLd, projectJsonLd } from './jsonLd';

describe('personJsonLd', () => {
  it('ficha de la persona en el idioma de la página (EST-F2-3-11a)', () => {
    expect(
      personJsonLd({
        origin: ORIGIN,
        locale: 'es',
        profile: fakeProfile,
        skillGroups: fakeSkillGroups,
      }),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': 'https://cosmos.test/#person',
      name: 'Ada Pérez',
      alternateName: 'Ada_code',
      jobTitle: 'Desarrolladora Frontend',
      description: 'Construye interfaces.',
      url: 'https://cosmos.test/es',
      sameAs: ['https://github.com/ada', 'https://www.linkedin.com/in/ada'],
      homeLocation: { '@type': 'Place', name: 'Cork, Irlanda' },
      knowsAbout: ['HTML', 'Máquinas virtuales'],
    });
  });

  it('no lleva el email por ningún sitio', () => {
    const ld = personJsonLd({
      origin: ORIGIN,
      locale: 'en',
      profile: fakeProfile,
      skillGroups: fakeSkillGroups,
    });
    expect(JSON.stringify(ld)).not.toContain(fakeProfile.contact.email);
  });

  it('el @id es el mismo en los dos idiomas', () => {
    expect(personId(ORIGIN)).toBe('https://cosmos.test/#person');
  });
});

describe('projectJsonLd', () => {
  it('SoftwareSourceCode con el autor embebido (EST-F2-3-11b)', () => {
    const project = fakeProject('alpha', 'Alpha');
    expect(projectJsonLd({ origin: ORIGIN, locale: 'en', profile: fakeProfile, project })).toEqual({
      '@context': 'https://schema.org',
      '@type': 'SoftwareSourceCode',
      name: 'Alpha',
      description: 'Alpha summary.',
      dateCreated: '2025',
      url: 'https://cosmos.test/projects/alpha',
      codeRepository: 'https://github.com/ada/alpha',
      inLanguage: 'en',
      author: {
        '@type': 'Person',
        '@id': 'https://cosmos.test/#person',
        name: 'Ada Pérez',
        url: 'https://cosmos.test/',
      },
    });
  });

  it('en ES apunta a las páginas ES', () => {
    const ld = projectJsonLd({
      origin: ORIGIN,
      locale: 'es',
      profile: fakeProfile,
      project: fakeProject('alpha', 'Alpha'),
    });
    expect(ld.url).toBe('https://cosmos.test/es/projects/alpha');
    expect(ld.author.url).toBe('https://cosmos.test/es');
    expect(ld.description).toBe('Resumen de Alpha.');
    expect(ld.inLanguage).toBe('es');
  });
});
