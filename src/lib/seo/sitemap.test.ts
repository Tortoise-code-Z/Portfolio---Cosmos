import { describe, expect, it } from 'vitest';

import { ORIGIN } from './fixtures';
import { robotsTxt, sitemapXml } from './sitemap';

describe('sitemapXml', () => {
  it('solo <loc>, una URL por entrada, sin lastmod ni alternativas', () => {
    expect(sitemapXml(['https://cosmos.test/', 'https://cosmos.test/es'])).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '  <url><loc>https://cosmos.test/</loc></url>',
        '  <url><loc>https://cosmos.test/es</loc></url>',
        '</urlset>',
        '',
      ].join('\n'),
    );
  });

  it('escapa los caracteres especiales de XML', () => {
    expect(sitemapXml([`https://cosmos.test/a?b=1&c=<'">`])).toContain(
      '<loc>https://cosmos.test/a?b=1&amp;c=&lt;&apos;&quot;&gt;</loc>',
    );
  });
});

describe('robotsTxt', () => {
  it('todo indexable y el sitemap con URL absoluta', () => {
    expect(robotsTxt(ORIGIN)).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://cosmos.test/sitemap.xml\n',
    );
  });
});
