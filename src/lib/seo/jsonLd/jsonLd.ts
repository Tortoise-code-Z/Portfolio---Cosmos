// Fichas JSON-LD (schema.org) en el idioma de la página (arquitectura.md → «Rutas e idiomas»).

import type { Locale, Profile, Project, SkillGroup } from '~/content/types';
import { localize } from '~/lib/i18n/localize/localize';
import { homePath, projectPath } from '~/lib/i18n/paths/paths';

import { absoluteUrl } from '../urls/urls';

const SCHEMA_CONTEXT = 'https://schema.org';

/** `@id` fijo de la persona, el mismo en los dos idiomas: `https://…/#person`. */
export function personId(origin: string): string {
  return `${absoluteUrl(origin, '/')}#person`;
}

export interface JsonLdInput {
  readonly origin: string;
  readonly locale: Locale;
  readonly profile: Profile;
}

// `type` y no `interface`: solo un tipo literal encaja en el `LdJsonObject` (con firma de índice)
// que pide la meta de React Router.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- ver arriba
export type PersonJsonLd = {
  '@context': string;
  '@type': 'Person';
  '@id': string;
  name: string;
  alternateName: string;
  jobTitle: string;
  description: string;
  url: string;
  sameAs: string[];
  homeLocation: { '@type': 'Place'; name: string };
  knowsAbout: string[];
};

/** Home: quién es, sin email (está a la vista en la página; en la ficha solo atrae spam). */
export function personJsonLd({
  origin,
  locale,
  profile,
  skillGroups,
}: JsonLdInput & { readonly skillGroups: readonly SkillGroup[] }): PersonJsonLd {
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'Person',
    '@id': personId(origin),
    name: profile.name,
    alternateName: profile.alias,
    jobTitle: profile.role[locale],
    description: profile.headline[locale],
    url: absoluteUrl(origin, homePath(locale)),
    sameAs: [profile.contact.github, profile.contact.linkedin],
    homeLocation: {
      '@type': 'Place',
      name: `${profile.location.city}, ${profile.location.country[locale]}`,
    },
    knowsAbout: skillGroups.flatMap((group) =>
      group.skills.map((skill) => localize(locale, skill.label)),
    ),
  };
}

// `type` y no `interface`: solo un tipo literal encaja en el `LdJsonObject` (con firma de índice)
// que pide la meta de React Router.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- ver arriba
export type ProjectJsonLd = {
  '@context': string;
  '@type': 'SoftwareSourceCode';
  name: string;
  description: string;
  dateCreated: string;
  url: string;
  codeRepository: string;
  inLanguage: Locale;
  author: { '@type': 'Person'; '@id': string; name: string; url: string };
};

/**
 * Proyecto: `SoftwareSourceCode` (un `CreativeWork` con campo para el repositorio). El autor va
 * embebido: Google no sigue el `@id` a otra página.
 */
export function projectJsonLd({
  origin,
  locale,
  profile,
  project,
}: JsonLdInput & { readonly project: Project }): ProjectJsonLd {
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'SoftwareSourceCode',
    name: project.name,
    description: project.summary[locale],
    dateCreated: String(project.year),
    url: absoluteUrl(origin, projectPath(locale, project.slug)),
    codeRepository: project.links.code,
    inLanguage: locale,
    author: {
      '@type': 'Person',
      '@id': personId(origin),
      name: profile.name,
      url: absoluteUrl(origin, homePath(locale)),
    },
  };
}
