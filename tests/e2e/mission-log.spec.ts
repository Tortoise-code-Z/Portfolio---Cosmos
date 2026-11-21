import { expect, type Page } from '@playwright/test';

import { collectErrors, hud, withoutWebGL } from './support/helpers.ts';
import { test } from './support/test.ts';

/**
 * El primer interludio, el Mission log (fase C · C.2; docs/02-experiencia/capitulos/interludio-1-mission-log.md):
 * la experiencia como una transmisión entre About y Skills. Mientras se lee, la escena se queda en la nebulosa (el
 * reloj del HUD, parado) y el raíl marca su rombo; «Skip transmission» lleva a Skills; se lee sin WebGL, con
 * movimiento reducido y a 390 px.
 */

const transmission = (page: Page) => page.locator('[data-interlude="mission-log"]');
const rail = (page: Page) => page.getByRole('navigation', { name: /^(?:Chapters|Capítulos)$/ });

test.describe('the Mission log', () => {
  test('/#mission-log lands on it: its title under the bar, the rail on its diamond and the clock stopped at the nebula', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto('/#mission-log', { waitUntil: 'networkidle' });
    await expect(page.getByRole('region', { name: 'Mission 01' })).toBeInViewport();
    await expect(rail(page).locator('[aria-current="step"]')).toHaveAccessibleName(
      'Mission log · transmission',
    );
    await expect(hud(page)).toContainText('200 million years');
    // Bajando por la pantalla del interludio, el reloj sigue parado.
    await page.mouse.wheel(0, 400);
    await expect(hud(page)).toContainText('200 million years');
    expect(errors).toEqual([]);
  });

  test('the transmission takes the pointer: the stars behind it do not get it', async ({
    page,
  }) => {
    await page.goto('/#mission-log', { waitUntil: 'networkidle' });
    const inside = await page.evaluate(() => {
      const hit = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      return document.querySelector('[data-interlude="mission-log"]')?.contains(hit) ?? false;
    });
    expect(inside).toBe(true);
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
    await expect(transmission(page)).not.toHaveAttribute('data-armed');
    await expect(transmission(page).getByText('End of transmission')).toBeVisible();
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
      .toBe('inset(0px)');
  });

  test('without WebGL it reads whole, over the still photo of the nebula', async ({ page }) => {
    await withoutWebGL(page);
    await page.goto('/#mission-log', { waitUntil: 'networkidle' });
    const region = page.getByRole('region', { name: 'Mission 01' });
    await expect(
      region.getByRole('list', { name: 'Flight log' }).getByRole('listitem'),
    ).toHaveCount(6);
    await expect(
      region.getByRole('list', { name: 'Payload manifest' }).getByRole('listitem'),
    ).toHaveCount(6);
  });
});
