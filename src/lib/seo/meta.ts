// `meta` de cada página (docs/05-tecnico/arquitectura.md → «Rutas e idiomas»): título, descripción,
// canónica, hreflang, Open Graph, tarjeta de Twitter y JSON-LD. Funciones puras: las rutas les pasan
// el origen y los datos (ADR-017).

import type { MetaDescriptor } from 'react-router';

import { LOCALES, type Locale, type Profile, type Project, type SkillGroup } from '~/content/types';
import { homePath, projectPath } from '~/lib/i18n/paths';
import { translate } from '~/lib/i18n/translate';

import { personJsonLd, projectJsonLd } from './jsonLd';
import { byLocale } from './pages';
import { absoluteUrl } from './urls';

/** Open Graph exige región (EST-F2-3-5). */
export const OG_LOCALE: Readonly<Record<Locale, string>> = { en: 'en_US', es: 'es_ES' };

interface PageText {
  readonly title: string;
  readonly description?: string;
}

/** Título, descripción y la parte de Open Graph y Twitter común a todas las páginas. */
function baseMeta(
  locale: Locale,
  siteName: string,
  text: PageText,
  ogType: string,
): MetaDescriptor[] {
  const descriptors: MetaDescriptor[] = [
    { title: text.title },
    { property: 'og:title', content: text.title },
    { property: 'og:type', content: ogType },
    { property: 'og:site_name', content: siteName },
    { property: 'og:locale', content: OG_LOCALE[locale] },
    ...LOCALES.filter((other) => other !== locale).map((other): MetaDescriptor => ({
      property: 'og:locale:alternate',
      content: OG_LOCALE[other],
    })),
    // `summary` mientras no haya imagen para compartir; con ella, `summary_large_image` (EST-F2-3-10).
    { name: 'twitter:card', content: 'summary' },
  ];
  if (text.description !== undefined) {
    descriptors.push(
      { name: 'description', content: text.description },
      { property: 'og:description', content: text.description },
    );
  }
  return descriptors;
}

/** Canónica propia del idioma, `og:url` igual y una alternativa por idioma más `x-default` (EN). */
function linkMeta(
  origin: string,
  locale: Locale,
  paths: Readonly<Record<Locale, string>>,
): MetaDescriptor[] {
  const canonical = absoluteUrl(origin, paths[locale]);
  return [
    { tagName: 'link', rel: 'canonical', href: canonical },
    { property: 'og:url', content: canonical },
    ...LOCALES.map((other): MetaDescriptor => ({
      tagName: 'link',
      rel: 'alternate',
      hrefLang: other,
      href: absoluteUrl(origin, paths[other]),
    })),
    {
      tagName: 'link',
      rel: 'alternate',
      hrefLang: 'x-default',
      href: absoluteUrl(origin, paths.en),
    },
  ];
}

interface MetaInput {
  readonly origin: string;
  readonly locale: Locale;
  readonly profile: Profile;
}

export function homeMeta({
  origin,
  locale,
  profile,
  skillGroups,
}: MetaInput & { readonly skillGroups: readonly SkillGroup[] }): MetaDescriptor[] {
  const text = {
    title: translate(locale, 'meta.title'),
    description: translate(locale, 'meta.description'),
  };
  return [
    ...baseMeta(locale, profile.name, text, 'website'),
    ...linkMeta(origin, locale, byLocale(homePath)),
    { 'script:ld+json': personJsonLd({ origin, locale, profile, skillGroups }) },
  ];
}

/** Descripción = `summary` tal cual (EST-F2-3-9). */
export function projectMeta({
  origin,
  locale,
  profile,
  project,
}: MetaInput & { readonly project: Project }): MetaDescriptor[] {
  const text = {
    title: translate(locale, 'meta.project.title', { project: project.name }),
    description: project.summary[locale],
  };
  return [
    ...baseMeta(locale, profile.name, text, 'article'),
    ...linkMeta(
      origin,
      locale,
      byLocale((each) => projectPath(each, project.slug)),
    ),
    { 'script:ld+json': projectJsonLd({ origin, locale, profile, project }) },
  ];
}

/** 404: `noindex`, sin canónica ni hreflang (EST-F2-3-12). */
export function notFoundMeta({ locale, profile }: Omit<MetaInput, 'origin'>): MetaDescriptor[] {
  return [
    ...baseMeta(
      locale,
      profile.name,
      { title: translate(locale, 'meta.notFound.title') },
      'website',
    ),
    { name: 'robots', content: 'noindex' },
  ];
}
