import { expect, type Page } from '@playwright/test';

import { collectErrors, hud, settleScene, withoutWebGL } from './support/helpers.ts';
import { test } from './support/test.ts';

/**
 * El primer interludio, el Mission log (fase C · C.2; docs/02-experiencia/capitulos/interludio-1-mission-log.md):
 * la experiencia como una transmisión entre About y Skills. Mientras se lee, la escena se queda en la nebulosa (el
 * reloj del HUD, parado) y el raíl marca su rombo; «Skip transmission» lleva a Skills; se lee sin WebGL, con
 * movimiento reducido y a 390 px.
 */

const transmission = (page: Page) => page.locator('[data-interlude="mission-log"]');
const rail = (page: Page) => page.getByRole('navigation', { name: /^(?:Chapters|Capítulos)$/ });

/** Una línea del teletipo ya escrita: el recorte se abre más allá de la caja, para no cortar su brillo. */
const WRITTEN = 'inset(-24px)';

/** El `clip-path` calculado de cada línea del teletipo (`none` sin armar, o `WRITTEN` si ya se ha escrito). */
const lineClips = (page: Page): Promise<string[]> =>
  transmission(page)
    .locator('[data-line]')
    .evaluateAll((lines) => lines.map((line) => getComputedStyle(line).clipPath));

/** Lo que se sale de su caja sin dar scroll (lo corta `overflow: hidden`): `scrollWidth` frente a `clientWidth`. */
const overflowing = (page: Page, selector: string): Promise<string[]> =>
  transmission(page)
    .locator(selector)
    .evaluateAll((elements) =>
      elements
        .filter((element) => element.scrollWidth > element.clientWidth)
        .map((element) => element.textContent.slice(0, 40)),
    );

test.describe('the Mission log', () => {
  test('/#mission-log lands on it: its title under the bar, the rail on its diamond and the clock stopped at the nebula', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto('/#mission-log', { waitUntil: 'networkidle' });
    await expect(page.getByRole('region', { name: 'Mission 01' })).toBeInViewport();
    // El título, por debajo de la barra (no tapado por ella).
    const [title, bar] = await Promise.all([
      page.getByRole('heading', { level: 2, name: 'Mission 01' }).boundingBox(),
      page.getByRole('banner').boundingBox(),
    ]);
    expect(title?.y ?? 0).toBeGreaterThanOrEqual((bar?.y ?? 0) + (bar?.height ?? 0));
    await expect(rail(page).locator('[aria-current="step"]')).toHaveAccessibleName(
      'Mission log · transmission',
    );
    // El HUD se esconde: el pie de la transmisión ya dice el reloj parado. Por debajo, sigue en la nebulosa.
    await expect(hud(page)).toHaveAttribute('data-hidden', '');
    await expect(hud(page)).toContainText('200 million years');
    await expect(transmission(page)).toContainText('t ≈ 200 million years · cosmic clock paused');
    // Bajando por la pantalla del interludio (de verdad: el scroll se ha movido), el reloj sigue parado.
    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.move(640, 360);
    await page.mouse.wheel(0, 400);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 300);
    await expect(rail(page).locator('[aria-current="step"]')).toHaveAccessibleName(
      'Mission log · transmission',
    );
    await expect(hud(page)).toContainText('200 million years');
    expect(errors).toEqual([]);
  });

  test('the transmission takes the pointer: the stars behind it do not get it; its tail lets it through', async ({
    page,
  }) => {
    await page.goto('/#mission-log', { waitUntil: 'networkidle' });
    const inside = await page.evaluate(() => {
      const hit = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      return document.querySelector('[data-interlude="mission-log"]')?.contains(hit) ?? false;
    });
    expect(inside).toBe(true);
    await expect(page.locator('[data-interlude-tail="mission-log"]')).toHaveCSS(
      'pointer-events',
      'none',
    );
  });

  for (const path of ['/', '/es']) {
    test(`${path} at 1280×720: no text of the transmission goes under the rail`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto(`${path}#mission-log`, { waitUntil: 'networkidle' });
      const railBox = await rail(page).boundingBox();
      const under = await transmission(page)
        .locator('h2, p, dd, dt, li, h3, figcaption, a')
        .evaluateAll(
          (elements, railLeft) =>
            elements
              .filter((element) => element.getBoundingClientRect().right > railLeft)
              .map((element) => element.textContent.slice(0, 40)),
          railBox?.x ?? 0,
        );
      expect(under).toEqual([]);
    });
  }

  test('switching language while reading it stays on it (not on About)', async ({ page }) => {
    await page.goto('/#mission-log', { waitUntil: 'networkidle' });
    await expect(rail(page).locator('[aria-current="step"]')).toHaveAccessibleName(
      'Mission log · transmission',
    );
    await page
      .getByRole('group', { name: 'Language' })
      .getByRole('link', { name: 'Español' })
      .click();
    await expect(page).toHaveURL(/\/es#mission-log$/);
    await expect(page.getByRole('region', { name: 'Misión 01' })).toBeInViewport();
  });

  test('after its tail the galaxy is formed: Skills arrives at its rest and the rail moves on', async ({
    page,
  }) => {
    await page.goto('/#skills', { waitUntil: 'networkidle' });
    await expect(rail(page).locator('[aria-current="step"]')).toHaveAccessibleName(
      'Skills · Galaxy',
    );
    await expect(hud(page)).toContainText('1 billion years');
  });

  test('«Skip transmission» with the keyboard goes to Skills, with the focus on its title', async ({
    page,
  }) => {
    await page.goto('/#mission-log', { waitUntil: 'networkidle' });
    const skip = transmission(page).getByRole('link', { name: 'Skip transmission' });
    await expect(skip).toHaveAttribute('href', '/#skills');
    await skip.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 2, name: 'My galaxy of tools' })).toBeFocused();
    await expect(page).toHaveURL(/#skills$/);
  });

  test('the diamond of the rail travels to it, with the focus on its title', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await rail(page).getByRole('link', { name: 'Mission log · transmission' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Mission 01' })).toBeFocused();
    await expect(page).toHaveURL(/#mission-log$/);
  });

  test('/es: in Spanish, with the reference quoted from the original letter', async ({ page }) => {
    await page.goto('/es#mission-log', { waitUntil: 'networkidle' });
    const region = page.getByRole('region', { name: 'Misión 01' });
    await expect(region).toContainText('Desarrollador de software en prácticas');
    await expect(region).toContainText('base técnica útil');
    await expect(rail(page).locator('[aria-current="step"]')).toHaveAccessibleName(
      'Bitácora · transmisión',
    );
  });

  test('390 px with text at 200 %: the title and the manifest wrap instead of being cut', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#mission-log', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    expect(await overflowing(page, 'h2, li')).toEqual([]);
  });

  test('844×390 (a phone on its side): the teletype switches on and writes every line, however tall it is', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(transmission(page)).toHaveAttribute('data-armed', '');
    // Se recorre la sección a pasos de media pantalla, hasta su final.
    const { top, bottom } = await transmission(page).evaluate((section) => {
      const box = section.getBoundingClientRect();
      return { top: box.top + window.scrollY, bottom: box.bottom + window.scrollY };
    });
    for (let y = top - 390; y <= bottom; y += 195) {
      await page.evaluate((to) => {
        window.scrollTo({ top: to, behavior: 'instant' });
      }, y);
    }
    await expect(transmission(page)).toHaveAttribute('data-on', '');
    await expect
      .poll(() =>
        transmission(page)
          .locator('[data-line]')
          .last()
          .evaluate((line) => getComputedStyle(line).clipPath),
      )
      .toBe(WRITTEN);
  });

  test('390 px: no sideways scroll, and «Skip» is a 44 px target', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#mission-log', { waitUntil: 'networkidle' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
    const box = await transmission(page)
      .getByRole('link', { name: 'Skip transmission' })
      .boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test('with reduced motion nothing is held back: every line is there, no sweep and no teletype', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#mission-log', { waitUntil: 'networkidle' });
    // Hidratada (la escena ha dicho si pinta): sin armar no es «aún no ha llegado el JavaScript».
    await settleScene(page);
    await expect(transmission(page)).not.toHaveAttribute('data-armed');
    expect(new Set(await lineClips(page))).toEqual(new Set(['none']));
    await expect(transmission(page).getByText('End of transmission')).toBeVisible();
    await expect(transmission(page).locator('[class*="cursor"]')).toHaveCSS(
      'animation-name',
      'none',
    );
  });

  test('with motion, it switches on when it comes into view and the teletype ends with every line written', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(transmission(page)).toHaveAttribute('data-armed', '');
    await expect(transmission(page)).not.toHaveAttribute('data-on');
    await transmission(page).scrollIntoViewIfNeeded();
    await expect(transmission(page)).toHaveAttribute('data-on', '');
    // Escrita la última línea, ya no la tapa nada.
    await expect
      .poll(() =>
        transmission(page)
          .locator('[data-line]')
          .last()
          .evaluate((line) => getComputedStyle(line).clipPath),
      )
      .toBe(WRITTEN);
  });

  test('without WebGL it reads whole, over the still photo of the nebula', async ({ page }) => {
    await withoutWebGL(page);
    await page.goto('/#mission-log', { waitUntil: 'networkidle' });
    const region = page.getByRole('region', { name: 'Mission 01' });
    // Entera a la vista: ninguna línea tapada, y detrás la foto de la nebulosa (el capítulo de antes).
    await expect(region.getByText('End of transmission')).toBeVisible();
    // Sin WebGL el teletipo sigue (es CSS): al acabar, ninguna línea tapada.
    await expect
      .poll(async () =>
        (await lineClips(page)).every((clip) => clip === 'none' || clip === WRITTEN),
      )
      .toBe(true);
    await expect(page.locator('[data-scene-stills] img[data-still-chapter="1"]')).toHaveAttribute(
      'data-visible',
      'true',
    );
    await expect(
      region.getByRole('list', { name: 'Flight log' }).getByRole('listitem'),
    ).toHaveCount(6);
    await expect(
      region.getByRole('list', { name: 'Payload manifest' }).getByRole('listitem'),
    ).toHaveCount(6);
  });
});
