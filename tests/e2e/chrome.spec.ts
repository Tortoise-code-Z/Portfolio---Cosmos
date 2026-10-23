import { expect, test, type Page } from '@playwright/test';

/**
 * La interfaz fija del viaje (F2 · paso 5): HUD, raíl y barra superior conectados al scroll.
 * Detalle en docs/02-experiencia/navegacion.md y scroll-y-escena.md, y docs/03-diseno/componentes.md.
 */

const hud = (page: Page): ReturnType<Page['locator']> =>
  page.locator('[aria-hidden="true"]', {
    hasText: /^t [=≈]/,
  });

/** Lleva el inicio de un capítulo a la línea de lectura (debajo de la barra fija, si la hay). */
async function scrollToChapter(page: Page, id: string): Promise<void> {
  await page.evaluate((anchor) => {
    document.getElementById(anchor)?.scrollIntoView({ block: 'start' });
  }, id);
}

test.describe('HUD', () => {
  test('starts at the singularity and follows the scroll, chapter by chapter', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(hud(page)).toHaveText(/t = 0 s · singularity\s*scale ≈ 10⁻³⁵ m/i);
    await scrollToChapter(page, 'about');
    await expect(hud(page)).toHaveText(/t ≈ 200 million years\s*scale ≈ 20 light-years/i);
    await scrollToChapter(page, 'skills');
    await expect(hud(page)).toContainText(/t ≈ 1 billion years/i);
    await scrollToChapter(page, 'projects');
    await expect(hud(page)).toContainText(/t = ∞ · mythic time/i);
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await expect(hud(page)).toContainText(/t = 0 s/i);
  });

  test('a link to a chapter (/es#contact) opens with its time, in the language of the page', async ({
    page,
  }) => {
    await page.goto('/es#contact', { waitUntil: 'networkidle' });
    await expect(hud(page)).toContainText(/t ≈ 13.800 millones de años/i);
    await expect(hud(page)).toContainText(/escala · 12.742 km de diámetro/i);
  });

  test('is decorative: out of the accessibility tree and never under the pointer', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(hud(page)).toHaveAttribute('aria-hidden', 'true');
    await expect(hud(page)).toHaveCSS('pointer-events', 'none');
  });

  for (const { width, side } of [
    { width: 1280, side: 'right' },
    { width: 800, side: 'left' },
  ] as const) {
    test(`${String(width)} px: sits at the bottom ${side}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 720 });
      await page.goto('/', { waitUntil: 'networkidle' });
      const box = await hud(page).boundingBox();
      expect(box).not.toBeNull();
      if (box === null) return;
      expect(box.y + box.height).toBeGreaterThan(720 - 80);
      if (side === 'right') expect(box.x + box.width).toBeGreaterThan(width - 80);
      else expect(box.x).toBeLessThan(80);
    });
  }

  test('390 px: hidden (each chapter eyebrow already tells the time)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(hud(page)).toBeHidden();
  });
});
