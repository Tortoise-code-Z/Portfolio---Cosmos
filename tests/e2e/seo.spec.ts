import { expect, type Page } from '@playwright/test';

import { test } from './support/test.ts';
import { loadEnv } from 'vite';

import { SHARE_IMAGE_WIDTH } from '../../src/content/imageWidths.ts';
import { profile } from '../../src/content/profile.ts';
import { projectEntries } from '../../src/content/projects/entries.ts';
import { uiTexts } from '../../src/content/texts/index.ts';
import type { Locale } from '../../src/content/types.ts';
import { parseSiteUrl } from '../../src/lib/env/siteUrl/siteUrl.ts';
import { indexablePaths, sitePages } from '../../src/lib/seo/pages/pages.ts';
import { absoluteUrl } from '../../src/lib/seo/urls/urls.ts';

import { collectErrors, projectBySlug } from './support/helpers.ts';

/**
 * SEO sobre el HTML real del build: cada página indexable con su canónica, hreflang,
 * Open Graph y JSON-LD; sitemap y robots; y las 404 de cada idioma. El origen es el mismo con el
 * que se hizo el build.
 */
// `loadEnv` lee el `.env` y también las variables del proceso (el CI las define ahí).
const ORIGIN = parseSiteUrl(loadEnv('production', process.cwd(), 'VITE_').VITE_SITE_URL);
const PAGES = sitePages(projectEntries);

/**
 * Proyectos con portada y, por tanto, con `og:image` (content/projects/media.ts). Escrito a mano: los e2e
 * cargan el contenido sin Vite y no pueden importar las imágenes.
 */
const WITH_COVER: ReadonlySet<string> = new Set(['chessmate', 'astrohub']);
const INDEXABLE = indexablePaths(PAGES).map((path) => absoluteUrl(ORIGIN, path));
const OG_LOCALE: Readonly<Record<Locale, string>> = { en: 'en_US', es: 'es_ES' };

/** Título, descripción y nombre del JSON-LD que tiene que llevar cada página, sacados del contenido. */
function expectedText(
  sitePage: (typeof PAGES)[number],
  locale: Locale,
): { title: string; description: string; name: string } {
  const texts = uiTexts[locale];
  if (sitePage.kind === 'home') {
    return {
      title: texts['meta.title'],
      description: texts['meta.description'],
      name: profile.name,
    };
  }
  const project = projectBySlug(sitePage.slug);
  return {
    title: texts['meta.project.title'].replace('{project}', project.name),
    description: project.summary[locale],
    name: project.name,
  };
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
        const errors = collectErrors(page);
        await page.goto(path);
        // Tras hidratar: un error o una etiqueta duplicada al hidratar también tiene que salir aquí.
        await page.waitForLoadState('networkidle');
        const meta = await head(page);
        const canonical = absoluteUrl(ORIGIN, path);
        const text = expectedText(sitePage, locale);

        expect(meta.lang).toBe(locale);
        expect(meta.title).toBe(text.title);
        expect(meta.description).toEqual([text.description]);
        expect(meta.canonical).toEqual([canonical]);
        expect(meta.ogUrl).toEqual([canonical]);
        expect(meta.alternates).toEqual([
          ['en', absoluteUrl(ORIGIN, sitePage.paths.en)],
          ['es', absoluteUrl(ORIGIN, sitePage.paths.es)],
          ['x-default', absoluteUrl(ORIGIN, sitePage.paths.en)],
        ]);
        expect(meta.ogLocale).toEqual([OG_LOCALE[locale]]);
        expect(meta.ogType).toEqual([sitePage.kind === 'home' ? 'website' : 'article']);
        expect(meta.ogImage).toHaveLength(
          sitePage.kind === 'project' && WITH_COVER.has(sitePage.slug) ? 1 : 0,
        );
        expect(meta.robots).toEqual([]);

        expect(meta.jsonLd).toHaveLength(1);
        const jsonLd: unknown = JSON.parse(meta.jsonLd[0] ?? '');
        expect(jsonLd).toMatchObject(
          sitePage.kind === 'home'
            ? { '@type': 'Person', name: text.name, url: canonical }
            : {
                '@type': 'SoftwareSourceCode',
                name: text.name,
                url: canonical,
                inLanguage: locale,
              },
        );
        expect(errors).toEqual([]);
      });
    }
  }
});

test.describe('imagen para compartir de las fichas', () => {
  test('la lista de proyectos con portada solo nombra proyectos que existen', () => {
    test.skip(test.info().project.name !== 'chromium', 'Solo lee el contenido: basta una vez');
    const slugs = projectEntries.map(({ slug }) => slug);
    expect([...WITH_COVER].filter((slug) => !slugs.includes(slug))).toEqual([]);
  });

  for (const sitePage of PAGES) {
    if (sitePage.kind !== 'project') continue;
    for (const locale of ['en', 'es'] as const) {
      const path = sitePage.paths[locale];
      const hasCover = WITH_COVER.has(sitePage.slug);

      test(`${path}: ${hasCover ? 'og:image = su portada en JPEG de 1200 px' : 'sin portada ni og:image'}`, async ({
        page,
      }) => {
        await page.goto(path, { waitUntil: 'networkidle' });
        const content = (selector: string): Promise<string[]> =>
          page
            .locator(selector)
            .evaluateAll((elements) =>
              elements.map((element) => element.getAttribute('content') ?? ''),
            );
        // La lista escrita a mano coincide con la página: portada (la imagen con prioridad) solo en esas.
        const coverImage = page.getByRole('main').locator('img[fetchpriority="high"]');
        await expect(coverImage).toHaveCount(hasCover ? 1 : 0);
        const card = await content('meta[name="twitter:card"]');
        const image = await content('meta[property="og:image"]');
        if (!hasCover) {
          expect(image).toEqual([]);
          expect(card).toEqual(['summary']);
          return;
        }

        expect(card).toEqual(['summary_large_image']);
        expect(image).toHaveLength(1);
        const url = new URL(image[0] ?? '');
        expect(url.origin).toBe(new URL(ORIGIN).origin);
        expect(url.pathname).toMatch(/^\/assets\/[\w-]+\.jpeg$/);
        expect(await content('meta[property="og:image:alt"]')).toEqual([
          (await coverImage.getAttribute('alt')) ?? '',
        ]);
        // El archivo existe en el sitio y mide lo que dicen sus etiquetas.
        const response = await page.request.get(url.pathname);
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toBe('image/jpeg');
        const size = await page.evaluate(async (src) => {
          const probe = new Image();
          probe.src = src;
          await probe.decode();
          return [String(probe.naturalWidth), String(probe.naturalHeight)];
        }, url.pathname);
        expect([
          ...(await content('meta[property="og:image:width"]')),
          ...(await content('meta[property="og:image:height"]')),
        ]).toEqual(size);
        expect(size[0]).toBe(String(SHARE_IMAGE_WIDTH));
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
    ['/PROJECTS/chessmate', 'en', 'Lost in space'],
    ['/Es/projects/chessmate', 'en', 'Lost in space'],
    ['/ES', 'en', 'Lost in space'],
    ['/projects', 'en', 'Lost in space'],
    ['/en', 'en', 'Lost in space'],
    ['/en/x', 'en', 'Lost in space'],
    ['/loquesea', 'en', 'Lost in space'],
    ['/es/loquesea', 'es', 'Perdido en el espacio'],
    ['/es/projects', 'es', 'Perdido en el espacio'],
    ['/es/projects/no-existe', 'es', 'Perdido en el espacio'],
    ['/es/PROJECTS/chessmate', 'es', 'Perdido en el espacio'],
  ] as const) {
    test(`${path} → 404 ${locale}, noindex, sin canónica`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto(path);
      // Tras hidratar y cargar el módulo de la ruta que casa el cliente: un solo <h1>.
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
      // Una sola región de aviso (la de la escena, en `Layout`): ni huérfana del HTML ni repetida.
      await expect(page.getByRole('status')).toHaveCount(1);
      await expect(page).toHaveURL(path);
      const meta = await head(page);
      expect(meta.lang).toBe(locale);
      expect(meta.title).toBe(uiTexts[locale]['meta.notFound.title']);
      expect(meta.ogLocale).toEqual([OG_LOCALE[locale]]);
      expect(meta.robots).toEqual(['noindex']);
      expect(meta.canonical).toEqual([]);
      expect(meta.alternates).toEqual([]);
      expect(meta.jsonLd).toEqual([]);
      expect(errors).toEqual([]);
    });
  }

  test('la 404 hidratada enlaza una sola hoja de estilos, la misma que el HTML servido', async ({
    page,
  }) => {
    // El HTML tal cual lo manda el servidor, sin pasar por el navegador (ni por la hidratación).
    const html = await (await page.request.get('/projects/no-existe')).text();
    const served = [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*>/g)].map(
      ([tag]) => /\bhref="([^"]+)"/.exec(tag)?.[1] ?? null,
    );
    await page.goto('/projects/no-existe', { waitUntil: 'networkidle' });
    // La ruta que casa el cliente (proyecto) ya ha cargado su módulo y pinta la 404 de `features/errors`.
    const hydrated = await page.evaluate(() =>
      [...document.querySelectorAll('link[rel="stylesheet"]')].map((link) =>
        link.getAttribute('href'),
      ),
    );
    expect(served).toHaveLength(1);
    expect(hydrated).toEqual(served);
  });

  test('desde la 404, «Volver al inicio» lleva a la home del idioma', async ({ page }) => {
    const errors = collectErrors(page);
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
    const errors = collectErrors(page);
    await page.goto('/projects/astrohub');
    await page.getByRole('link', { name: 'Back to the shell' }).click();
    await expect(page).toHaveURL('/#projects');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Víctor Pérez');
    expect(errors).toEqual([]);
  });
});
