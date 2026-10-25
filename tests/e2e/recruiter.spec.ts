import { expect, test, type Page } from '@playwright/test';

import { projectEntries } from '../../src/content/projects/entries.ts';
import { uiTexts } from '../../src/content/texts/index.ts';
import type { Locale, ProjectEntry } from '../../src/content/types.ts';

/**
 * Recorridos del recruiter (F2 · «Hecho cuando» en docs/06-roadmap/roadmap.md): el «Recruiter con prisa» de
 * docs/02-experiencia/README.md y la métrica de docs/00-vision/brief.md, «llega a los proyectos en ≤ 2
 * interacciones (acceso directo o modo misión rápida)». Cada recorrido va de punta a punta, en EN y ES: un clic
 * y los proyectos están en pantalla; el segundo abre Chessmate; su código está a un clic más, en una pestaña
 * nueva. En escritorio, el acceso directo es «Projects» de la barra; a 390 px, la misión rápida (la barra no
 * tiene «Projects» y el raíl cae en el capítulo con la escena primero: docs/02-experiencia/capitulos/
 * 03-tortuga.md → «Móvil»; las filas quedan a un deslizamiento). El detalle de cada pieza (saltos, misión
 * rápida, ficha) está en chrome.spec.ts, quick-mission.spec.ts y project-page.spec.ts. Los «≤ 10 s» dependen
 * de la red: los mide Lighthouse.
 */

const PROJECT = 'chessmate';

function projectBySlug(slug: string): ProjectEntry {
  const entry = projectEntries.find((candidate) => candidate.slug === slug);
  if (entry === undefined) throw new Error(`No existe el proyecto «${slug}» en el contenido`);
  return entry;
}

const chessmate = projectBySlug(PROJECT);

const DESKTOP = { width: 1280, height: 720 };
const MOBILE = { width: 390, height: 844 };

const HOME: Record<Locale, string> = { en: '/', es: '/es' };
const PROJECT_PAGE: Record<Locale, RegExp> = {
  en: new RegExp(`/projects/${PROJECT}$`),
  es: new RegExp(`/es/projects/${PROJECT}$`),
};

/** Se apunta cualquier error de la página o de la consola durante el recorrido. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

/**
 * Último tramo, ya en la ficha: el nombre del proyecto y su código a un clic, que se abre en una pestaña nueva
 * (GitHub se sustituye por una respuesta local: el test no sale a internet).
 */
async function codeIsOneClickAway(page: Page, locale: Locale): Promise<void> {
  const t = uiTexts[locale];
  await expect(page).toHaveURL(PROJECT_PAGE[locale]);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(chessmate.name);

  const code = page
    .getByRole('main')
    .getByRole('link', { name: `${t['projects.code']} ${t['link.newTab']}` })
    .first();
  await expect(code).toBeInViewport();
  await expect(code).toHaveAttribute('href', chessmate.links.code);
  await expect(code).toHaveAttribute('rel', 'noopener noreferrer');

  await page
    .context()
    .route(`${chessmate.links.code}**`, (route) =>
      route.fulfill({ contentType: 'text/html', body: '<title>code</title>' }),
    );
  const [tab] = await Promise.all([page.context().waitForEvent('page'), code.click()]);
  await expect(tab).toHaveURL(chessmate.links.code);
  // La ficha sigue abierta detrás: el recruiter no pierde el sitio.
  await expect(page).toHaveURL(PROJECT_PAGE[locale]);
}

for (const locale of ['en', 'es'] as const) {
  const t = uiTexts[locale];
  const viewProject = `${t['projects.open']} ${chessmate.name}`;

  test.describe(`recruiter in a hurry (${locale})`, () => {
    test(`${String(DESKTOP.width)} px: «${t['nav.projects']}» in the bar shows the projects in one click; the second opens ${chessmate.name}, with its code one click away`, async ({
      page,
    }) => {
      const errors = collectErrors(page);
      await page.setViewportSize(DESKTOP);
      await page.goto(HOME[locale], { waitUntil: 'networkidle' });

      // 1.ª interacción: los proyectos, en pantalla.
      await page
        .getByRole('banner')
        .getByRole('link', { name: t['nav.projects'], exact: true })
        .click();
      await expect(page.getByRole('heading', { name: t['projects.title'] })).toBeInViewport();
      const view = page.getByRole('link', { name: viewProject });
      await expect(view).toBeInViewport();

      // 2.ª: la ficha.
      await view.click();
      await codeIsOneClickAway(page, locale);
      expect(errors).toEqual([]);
    });

    test(`${String(MOBILE.width)} px: the «${t['chapter.3']}» dot of the rail lands on the chapter (scene first, then the rows); its first row opens ${chessmate.name}`, async ({
      page,
    }) => {
      const errors = collectErrors(page);
      await page.setViewportSize(MOBILE);
      await page.goto(HOME[locale], { waitUntil: 'networkidle' });

      await page
        .getByRole('navigation', { name: t['rail.label'] })
        .getByRole('link', { name: t['chapter.3'] })
        .click();
      const title = page.getByRole('heading', { name: t['projects.title'] });
      await expect(title).toBeFocused();
      await expect(title).toBeInViewport();

      // Las filas, a un deslizamiento (el clic de Playwright lleva el enlace a la vista, como el dedo).
      await page.getByRole('link', { name: viewProject }).click();
      await codeIsOneClickAway(page, locale);
      expect(errors).toEqual([]);
    });

    test(`${String(MOBILE.width)} px: «${t['nav.quick']}» shows the projects in one tap; a project link opens ${chessmate.name}`, async ({
      page,
    }) => {
      const errors = collectErrors(page);
      await page.setViewportSize(MOBILE);
      await page.goto(HOME[locale], { waitUntil: 'networkidle' });

      await page.getByRole('banner').getByRole('button', { name: t['nav.quick'] }).click();
      const dialog = page.getByRole('dialog', { name: /Víctor Pérez/ });
      // Los proyectos empiezan en la primera pantalla: el título de la sección y el nombre del primero.
      await expect(
        dialog.getByRole('heading', { name: t['quick.projects'], exact: true }),
      ).toBeInViewport({
        ratio: 1,
      });
      await expect(
        dialog.getByRole('heading', { name: chessmate.name, exact: true }),
      ).toBeInViewport({
        ratio: 1,
      });

      await dialog.getByRole('link', { name: viewProject }).click();
      await codeIsOneClickAway(page, locale);
      expect(errors).toEqual([]);
    });
  });
}
