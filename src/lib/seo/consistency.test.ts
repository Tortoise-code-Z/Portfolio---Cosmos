// EST-F2-3-8: canónicas, hreflang, og:url y sitemap son el mismo conjunto de URL, escritas igual.

import type { MetaDescriptor } from 'react-router';
import { describe, expect, it } from 'vitest';

import { LOCALES } from '~/content/types';

import { fakeProfile, fakeProjects, fakeSkillGroups, ORIGIN } from './fixtures';
import { homeMeta, projectMeta } from './meta/meta';
import { indexablePaths, sitePages } from './pages/pages';
import { sitemapXml } from './sitemap/sitemap';
import { absoluteUrl } from './urls/urls';

function urlsIn(descriptors: readonly MetaDescriptor[]): {
  canonical: string[];
  hreflang: string[];
  ogUrl: string[];
} {
  const canonical: string[] = [];
  const hreflang: string[] = [];
  const ogUrl: string[] = [];
  for (const descriptor of descriptors) {
    if ('rel' in descriptor && descriptor.rel === 'canonical')
      canonical.push(String(descriptor.href));
    if ('rel' in descriptor && descriptor.rel === 'alternate')
      hreflang.push(String(descriptor.href));
    if ('property' in descriptor && descriptor.property === 'og:url')
      ogUrl.push(String(descriptor.content));
  }
  return { canonical, hreflang, ogUrl };
}

describe('URL absolutas coherentes', () => {
  const pages = sitePages(fakeProjects);
  const all = LOCALES.flatMap((locale) => [
    homeMeta({ origin: ORIGIN, locale, profile: fakeProfile, skillGroups: fakeSkillGroups }),
    ...fakeProjects.map((project) =>
      projectMeta({ origin: ORIGIN, locale, profile: fakeProfile, project }),
    ),
  ]).map(urlsIn);

  const sitemapUrls = [
    ...sitemapXml(indexablePaths(pages).map((path) => absoluteUrl(ORIGIN, path))).matchAll(
      /<loc>(.+?)<\/loc>/g,
    ),
  ].map((match) => match[1]);

  it('cada página: una canónica, y og:url igual a ella', () => {
    for (const urls of all) {
      expect(urls.canonical).toHaveLength(1);
      expect(urls.ogUrl).toEqual(urls.canonical);
    }
  });

  it('canónicas, hreflang y sitemap: el mismo conjunto', () => {
    const canonical = new Set(all.flatMap((urls) => urls.canonical));
    const hreflang = new Set(all.flatMap((urls) => urls.hreflang));
    expect(canonical.size).toBe(pages.length * LOCALES.length);
    expect(hreflang).toEqual(canonical);
    expect(new Set(sitemapUrls)).toEqual(canonical);
    expect(sitemapUrls).toHaveLength(canonical.size);
  });
});
