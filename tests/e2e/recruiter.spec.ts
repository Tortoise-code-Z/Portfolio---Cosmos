import { expect, test, type Locator, type Page } from '@playwright/test';

import { uiTexts } from '../../src/content/texts/index.ts';
import type { Locale } from '../../src/content/types.ts';

import { collectErrors, projectBySlug } from './support/helpers.ts';

/**
 * Recorridos del recruiter (F2 · «Hecho cuando» en docs/06-roadmap/roadmap.md) con la métrica de
 * docs/00-vision/brief.md: «llega a los proyectos en ≤ 2 interacciones (acceso directo o modo misión rápida)».
 * En EN y ES, de la home al código de Chessmate:
 * - 1280 px: «Projects» de la barra pone los proyectos en pantalla con un clic; el segundo abre la ficha.
 * - 390 px, misión rápida: un toque y los proyectos están en pantalla; la ficha, tras un deslizamiento.
 * - 390 px, raíl: cae en el capítulo con la escena primero (docs/02-experiencia/capitulos/03-tortuga.md →
 *   «Móvil»); las filas, tras un deslizamiento.
 * En la ficha, el código está a un clic, en una pestaña nueva.
 *
 * Es el «Recruiter con prisa» de docs/02-experiencia/README.md hasta los proyectos, más el tramo del código del
 * «Tech lead»; el contacto del recruiter se prueba en chrome.spec.ts («Contact» de la barra) y en
 * quick-mission.spec.ts (sección Contact). El detalle de cada pieza está en chrome.spec.ts, quick-mission.spec.ts
 * y project-page.spec.ts. Los «≤ 10 s» no se miden aquí: dependen de la red (Lighthouse mide la carga de cada
 * página: docs/05-tecnico/calidad.md → «Mediciones»).
 */

const chessmate = projectBySlug('chessmate');

const DESKTOP = { width: 1280, height: 720 };
const MOBILE = { width: 390, height: 844 };
/** Un deslizamiento con el pulgar: unos tres cuartos de pantalla. */
const SWIPE = Math.round(MOBILE.height * 0.75);

const HOME: Record<Locale, string> = { en: '/', es: '/es' };
const PROJECT_PATH: Record<Locale, string> = {
  en: `/projects/${chessmate.slug}`,
  es: `/es/projects/${chessmate.slug}`,
};

/** Un deslizamiento hacia abajo con la rueda sobre el centro de la pantalla (sobre el diálogo, si lo hay). */
async function swipeDown(page: Page): Promise<void> {
  await page.mouse.move(MOBILE.width / 2, MOBILE.height / 2);
  await page.mouse.wheel(0, SWIPE);
}

/** La ficha de Chessmate en el idioma pedido: ruta exacta y `lang` (la de EN no vale si acaba en ES). */
async function onProjectPage(page: Page, locale: Locale): Promise<void> {
  await expect(page).toHaveURL((url) => url.pathname === PROJECT_PATH[locale]);
  await expect(page.locator('html')).toHaveAttribute('lang', locale);
}

/**
 * Último tramo, ya en la ficha: el nombre del proyecto y su código a un clic, que se abre en una pestaña nueva
 * (GitHub se sustituye por una respuesta local: el test no sale a internet).
 */
async function codeIsOneClickAway(page: Page, locale: Locale): Promise<void> {
  const t = uiTexts[locale];
  await onProjectPage(page, locale);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(chessmate.name);

  // Sin `.first()`: si un día hubiera dos enlaces iguales en la ficha, el test lo dice.
  const code = page
    .getByRole('main')
    .getByRole('link', { name: `${t['projects.code']} ${t['link.newTab']}`, exact: true });
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
  await onProjectPage(page, locale);
}

/** El enlace queda fuera de la pantalla al llegar y entra tras un solo deslizamiento. */
async function oneSwipeAway(page: Page, link: Locator): Promise<void> {
  await expect(link).not.toBeInViewport();
  await swipeDown(page);
  await expect(link).toBeInViewport({ ratio: 1 });
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

    test(`${String(MOBILE.width)} px: the «${t['chapter.3']}» dot of the rail lands on the chapter with the scene first; one swipe brings the first row, which opens ${chessmate.name}`, async ({
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

      // La escena primero: la primera fila (Chessmate) llega con un deslizamiento.
      const view = page.getByRole('link', { name: viewProject });
      await oneSwipeAway(page, view);

      await view.click();
      await codeIsOneClickAway(page, locale);
      expect(errors).toEqual([]);
    });

    test(`${String(MOBILE.width)} px: «${t['nav.quick']}» shows the projects in one tap; one swipe brings the link that opens ${chessmate.name}`, async ({
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
      ).toBeInViewport({ ratio: 1 });
      await expect(
        dialog.getByRole('heading', { name: chessmate.name, exact: true }),
      ).toBeInViewport({ ratio: 1 });

      // Su enlace, bajo el resumen: a un deslizamiento.
      const view = dialog.getByRole('link', { name: viewProject });
      await oneSwipeAway(page, view);

      await view.click();
      await codeIsOneClickAway(page, locale);
      expect(errors).toEqual([]);
    });
  });
}
