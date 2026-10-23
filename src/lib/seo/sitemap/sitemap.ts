// sitemap.xml y robots.txt, generados en el build. Imports relativos: los carga
// `react-router.config.ts`.

import { absoluteUrl } from '../urls/urls';

function escapeXml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

/** Solo `<loc>`: sin `lastmod` (sería la fecha del build) ni alternativas (el hreflang va en cada HTML). */
export function sitemapXml(urls: readonly string[]): string {
  const entries = urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');
}

/** Todo indexable y el sitemap con URL absoluta (cambia con el dominio: por eso no es estático). */
export function robotsTxt(origin: string): string {
  return [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${absoluteUrl(origin, '/sitemap.xml')}`,
    '',
  ].join('\n');
}
