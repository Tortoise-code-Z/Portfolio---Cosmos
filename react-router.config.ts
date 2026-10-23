import { copyFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { Config } from '@react-router/dev/config';
import { loadEnv } from 'vite';

// Rutas relativas a propósito: al cargar esta config no existe el alias `~/` (viva S4 #38).
import { projects } from './src/content/projects/index.ts';
import { parseSiteUrl } from './src/lib/env/siteUrl/siteUrl.ts';
import { indexablePaths, prerenderPaths, sitePages } from './src/lib/seo/pages/pages.ts';
import { robotsTxt, sitemapXml } from './src/lib/seo/sitemap/sitemap.ts';
import { absoluteUrl } from './src/lib/seo/urls/urls.ts';

/** La lista única de páginas: de ella salen el prerender y el sitemap (y el hreflang de cada página). */
const pages = sitePages(projects);

/**
 * Sitio estático pre-renderizado (ADR-001): HTML completo por ruta e idioma en el build, sin
 * servidor en producción. Al acabar, se escriben `sitemap.xml`, `robots.txt` y `404.html`.
 */
export default {
  appDirectory: 'src',
  ssr: false,
  prerender: prerenderPaths(pages),
  async buildEnd({ reactRouterConfig, viteConfig }) {
    const origin = parseSiteUrl(loadEnv(viteConfig.mode, viteConfig.root, 'VITE_').VITE_SITE_URL);
    const clientDir = join(reactRouterConfig.buildDirectory, 'client');
    const urls = indexablePaths(pages).map((path) => absoluteUrl(origin, path));

    await writeFile(join(clientDir, 'sitemap.xml'), sitemapXml(urls));
    await writeFile(join(clientDir, 'robots.txt'), robotsTxt(origin));
    // Vercel sirve `404.html` (EN) para cualquier ruta sin archivo. Que `/es/*` reciba la ES
    // (`es/404/index.html`) se configura en F7 (EST-F2-3-12).
    await copyFile(join(clientDir, '404', 'index.html'), join(clientDir, '404.html'));
  },
} satisfies Config;
