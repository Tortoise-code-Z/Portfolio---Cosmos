import { expect, type Page } from '@playwright/test';

import { profile } from '../../src/content/profile.ts';
import { collectErrors, hud, settleScene, withoutWebGL } from './support/helpers.ts';
import { test } from './support/test.ts';

/**
 * El epílogo, Crew file (fase C · C.6a; docs/02-experiencia/capitulos/05-crew-file.md): el último capítulo, en el
 * canal verde, bajo Contacto. La ficha, «Download CV» y el email; el raíl marca su parada y el HUD se esconde (el pie
 * dice el reloj). Hasta C.6b la escena se queda en la Tierra. Se lee sin WebGL, con movimiento reducido, a 390 px,
 * con la letra al 200 % y con el raíl entero en un móvil apaisado.
 */

const crewFile = (page: Page) => page.locator('[data-chapter="5"]');
const rail = (page: Page) => page.getByRole('navigation', { name: /^(?:Chapters|Capítulos)$/ });

test.describe('Crew file', () => {
  test('/#crew-file lands on it: its title under the bar, the rail on its stop and the HUD hidden', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto('/#crew-file', { waitUntil: 'networkidle' });
    await expect(page.getByRole('region', { name: 'Crew file' })).toBeInViewport();
    const [title, bar] = await Promise.all([
      page.getByRole('heading', { level: 2, name: 'Crew file' }).boundingBox(),
      page.getByRole('banner').boundingBox(),
    ]);
    expect(title?.y ?? 0).toBeGreaterThanOrEqual((bar?.y ?? 0) + (bar?.height ?? 0));
    await expect(rail(page).locator('[aria-current="step"]')).toHaveAccessibleName(
      'Crew file · Epilogue',
    );
    await expect(hud(page)).toHaveAttribute('data-hidden', '');
    await expect(crewFile(page)).toContainText('End of journey · 13.8 billion years + now');
    expect(errors).toEqual([]);
  });

  test('the rail stop travels to it, with the focus on its title', async ({ page }) => {
    await page.goto('/#contact', { waitUntil: 'networkidle' });
    await rail(page).getByRole('link', { name: 'Crew file · Epilogue' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Crew file' })).toBeFocused();
    await expect(page).toHaveURL(/#crew-file$/);
  });

  test('it is the end of the page: nothing scrolls past its footer', async ({ page }) => {
    await page.goto('/#crew-file', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    const [section, end] = await Promise.all([
      crewFile(page).boundingBox(),
      page.evaluate(() => window.innerHeight),
    ]);
    expect(Math.round((section?.y ?? 0) + (section?.height ?? 0))).toBeLessThanOrEqual(end);
    await expect(
      crewFile(page).getByRole('link', { name: /^This site is open source/ }),
    ).toBeVisible();
  });

  test('«Download CV» and the email work in both languages', async ({ page }) => {
    for (const path of ['/', '/es']) {
      await page.goto(`${path}#crew-file`, { waitUntil: 'networkidle' });
      const cv = crewFile(page).getByRole('link', { name: /^(?:Download CV|Descargar CV)/ });
      await expect(cv).toHaveAttribute('href', profile.cv.en ?? '');
      const response = await page.request.get(profile.cv.en ?? '');
      expect(response.ok()).toBe(true);
      expect(response.headers()['content-type']).toContain('pdf');
      await expect(
        crewFile(page).getByRole('link', { name: profile.contact.email }),
      ).toHaveAttribute('href', `mailto:${profile.contact.email}`);
    }
  });

  test('390 px: no sideways scroll, and «Download CV» right after the title, before the file', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#crew-file', { waitUntil: 'networkidle' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
    const [cv, file] = await Promise.all([
      crewFile(page)
        .getByRole('link', { name: /^Download CV/ })
        .boundingBox(),
      crewFile(page).locator('dl').boundingBox(),
    ]);
    expect(cv?.height).toBeGreaterThanOrEqual(44);
    expect(cv?.y ?? 0).toBeLessThan(file?.y ?? 0);
  });

  for (const width of [360, 390]) {
    for (const path of ['/', '/es']) {
      test(`${path} at ${String(width)} px with text at 200 %: nothing of the Crew file is cut`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(`${path}#crew-file`, { waitUntil: 'networkidle' });
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '200%';
        });
        const cut = await crewFile(page)
          .locator('h2, li, dd, dt, p, a')
          .evaluateAll((elements) =>
            elements
              .filter((element) => element.scrollWidth > element.clientWidth)
              .map((element) => element.textContent.slice(0, 40)),
          );
        expect(cut).toEqual([]);
        // La sección entera, no la página: a 200 % las filas de Proyectos ya se salen (deuda de F6, STATE.md).
        const section = await crewFile(page).evaluate((element) => ({
          scroll: element.scrollWidth,
          client: element.clientWidth,
        }));
        expect(section.scroll).toBeLessThanOrEqual(section.client);
      });
    }
  }

  for (const { width, height } of [
    { width: 844, height: 390 },
    { width: 800, height: 360 },
  ]) {
    test(`${String(width)}×${String(height)} (a phone on its side): the whole rail fits under the bar, eight stops of at least 24 px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/#crew-file', { waitUntil: 'networkidle' });
      const links = rail(page).getByRole('link');
      await expect(links).toHaveCount(8);
      const boxes = await links.evaluateAll((elements) =>
        elements.map((element) => {
          const { top, bottom, height: size } = element.getBoundingClientRect();
          return { top, bottom, size };
        }),
      );
      const bar = await page.getByRole('banner').boundingBox();
      expect(boxes[0]?.top ?? 0).toBeGreaterThanOrEqual(
        Math.floor((bar?.y ?? 0) + (bar?.height ?? 0)),
      );
      expect(boxes.at(-1)?.bottom ?? Infinity).toBeLessThanOrEqual(height + 0.5);
      for (const box of boxes) expect(box.size).toBeGreaterThanOrEqual(24);
    });
  }

  test('with reduced motion nothing is held back: every line is there and no teletype', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#crew-file', { waitUntil: 'networkidle' });
    await settleScene(page);
    await expect(crewFile(page)).not.toHaveAttribute('data-armed');
    const clips = await crewFile(page)
      .locator('[data-line]')
      .evaluateAll((lines) => lines.map((line) => getComputedStyle(line).clipPath));
    expect(new Set(clips)).toEqual(new Set(['none']));
  });

  test('without WebGL it reads whole, over the still photo of the portrait', async ({ page }) => {
    await withoutWebGL(page);
    await page.goto('/#crew-file', { waitUntil: 'networkidle' });
    const region = page.getByRole('region', { name: 'Crew file' });
    await expect(region.getByRole('term').first()).toHaveText('Role');
    await expect(page.locator('[data-scene-stills] img[data-still-chapter="5"]')).toHaveAttribute(
      'data-visible',
      'true',
    );
  });

  test('Contact no longer carries the education nor the site footer', async ({ page }) => {
    await page.goto('/#contact', { waitUntil: 'networkidle' });
    const contact = page.getByRole('region', { name: 'Touchdown' });
    await expect(contact.getByText('Master.D')).toHaveCount(0);
    await expect(contact.getByRole('link', { name: /^This site is open source/ })).toHaveCount(0);
  });
});
