import { expect, test, type Page } from '@playwright/test';
import { loadEnv } from 'vite';

import { projects } from '../../src/content/projects/index.ts';
import { parseSiteUrl } from '../../src/lib/env/siteUrl/siteUrl.ts';
import { indexablePaths, sitePages } from '../../src/lib/seo/pages/pages.ts';
import { absoluteUrl } from '../../src/lib/seo/urls/urls.ts';

/**
 * SEO sobre el HTML real del build (EST-F2-3): cada página indexable con su canónica, hreflang,
 * Open Graph y JSON-LD; sitemap y robots; y las 404 de cada idioma. El origen es el mismo con el
 * que se hizo el build.
 */
// `loadEnv` lee el `.env` y también las variables del proceso (el CI las define ahí).
const ORIGIN = parseSiteUrl(loadEnv('production', process.cwd(), 'VITE_').VITE_SITE_URL);
const PAGES = sitePages(projects);
const INDEXABLE = indexablePaths(PAGES).map((path) => absoluteUrl(ORIGIN, path));

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

async function head(page: Page) {
  return page.evaluate(() => {
    const attr = (selector: string, name: string): string[] =>
      [...document.querySelectorAll(selector)].map((element) => element.getAttribute(name) ?? '');
    return {
      title: document.title,
      lang: document.documentElement.lang,
      canonical: attr('link[rel="canonical"]', 'href'),
      alternates: [...document.querySelectorAll('link[rel="alternate"]')].map((element) => [
        element.getAttribute('hreflang') ?? '',
        element.getAttribute('href') ?? '',
      ]),
      ogUrl: attr('meta[property="og:url"]', 'content'),
      ogLocale: attr('meta[property="og:locale"]', 'content'),
      ogType: attr('meta[property="og:type"]', 'content'),
      ogImage: attr('meta[property="og:image"]', 'content'),
      robots: attr('meta[name="robots"]', 'content'),
      description: attr('meta[name="description"]', 'content'),
      jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map(
        (element) => element.textContent,
      ),
    };
  });
}

test.describe('páginas indexables', () => {
  for (const sitePage of PAGES) {
    for (const locale of ['en', 'es'] as const) {
      const path = sitePage.paths[locale];

      test(`${path}: canónica, hreflang, Open Graph y JSON-LD`, async ({ page }) => {
        const errors = collectConsoleErrors(page);
        await page.goto(path);
        const meta = await head(page);
        const canonical = absoluteUrl(ORIGIN, path);

        expect(meta.lang).toBe(locale);
        expect(meta.title).not.toBe('');
        expect(meta.description).toHaveLength(1);
        expect(meta.canonical).toEqual([canonical]);
        expect(meta.ogUrl).toEqual([canonical]);
        expect(meta.alternates).toEqual([
          ['en', absoluteUrl(ORIGIN, sitePage.paths.en)],
          ['es', absoluteUrl(ORIGIN, sitePage.paths.es)],
          ['x-default', absoluteUrl(ORIGIN, sitePage.paths.en)],
        ]);
        expect(meta.ogLocale).toEqual([locale === 'en' ? 'en_US' : 'es_ES']);
        expect(meta.ogType).toEqual([sitePage.kind === 'home' ? 'website' : 'article']);
        expect(meta.ogImage).toEqual([]);
        expect(meta.robots).toEqual([]);

        expect(meta.jsonLd).toHaveLength(1);
        const jsonLd: unknown = JSON.parse(meta.jsonLd[0] ?? '');
        expect(jsonLd).toMatchObject(
          sitePage.kind === 'home'
            ? { '@type': 'Person', url: canonical }
            : { '@type': 'SoftwareSourceCode', url: canonical, inLanguage: locale },
        );
        expect(errors).toEqual([]);
      });
    }
  }
});

test.describe('sitemap y robots', () => {
  test('sitemap.xml: exactamente las URL indexables, iguales a las canónicas', async ({
    request,
  }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.ok()).toBe(true);
    const locs = [...(await response.text()).matchAll(/<loc>(.+?)<\/loc>/g)].map(
      (match) => match[1],
    );
    expect(locs).toEqual(INDEXABLE);
  });

  test('robots.txt apunta al sitemap con URL absoluta', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.ok()).toBe(true);
    expect(await response.text()).toContain(`Sitemap: ${absoluteUrl(ORIGIN, '/sitemap.xml')}`);
  });
});

test.describe('404 por idioma (sin redirecciones)', () => {
  for (const [path, locale, title] of [
    ['/projects/no-existe', 'en', 'Lost in space'],
    ['/projects/Chessmate', 'en', 'Lost in space'],
    ['/projects', 'en', 'Lost in space'],
    ['/en/x', 'en', 'Lost in space'],
    ['/loquesea', 'en', 'Lost in space'],
    ['/es/loquesea', 'es', 'Perdido en el espacio'],
    ['/es/projects', 'es', 'Perdido en el espacio'],
    ['/es/projects/no-existe', 'es', 'Perdido en el espacio'],
  ] as const) {
    test(`${path} → 404 ${locale}, noindex, sin canónica`, async ({ page }) => {
      const errors = collectConsoleErrors(page);
      await page.goto(path);
      // Tras hidratar y cargar el módulo de la ruta que casa el cliente: un solo <h1> (viva S5 #1).
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
      await expect(page).toHaveURL(path);
      const meta = await head(page);
      expect(meta.lang).toBe(locale);
      expect(meta.robots).toEqual(['noindex']);
      expect(meta.canonical).toEqual([]);
      expect(meta.alternates).toEqual([]);
      expect(meta.jsonLd).toEqual([]);
      expect(errors).toEqual([]);
    });
  }

  test('desde la 404, «Volver al inicio» lleva a la home del idioma', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto('/es/loquesea');
    await page.getByRole('link', { name: 'Volver al inicio' }).click();
    await expect(page).toHaveURL('/es');
    await expect(page.getByText('Mi código también.')).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('página de proyecto', () => {
  test('se lee sin JavaScript (P1)', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/es/projects/chessmate');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Chessmate');
    await expect(
      page.getByText('Una academia de ajedrez online con cursos interactivos.'),
    ).toBeVisible();
    await context.close();
  });

  test('la vuelta al caparazón navega a la home sin errores', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto('/projects/astrohub');
    await page.getByRole('link', { name: 'Back to the shell' }).click();
    await expect(page).toHaveURL('/#projects');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Víctor Pérez');
    expect(errors).toEqual([]);
  });
});
