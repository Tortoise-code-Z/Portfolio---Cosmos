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

const rail = (page: Page): ReturnType<Page['locator']> =>
  page.getByRole('navigation', { name: 'Chapters' });

test.describe('chapter rail', () => {
  test('marks the chapter you are reading, also when you just scroll', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const current = rail(page).locator('[aria-current="step"]');
    await expect(current).toHaveAccessibleName('Home · Singularity');
    await scrollToChapter(page, 'skills');
    await expect(current).toHaveAccessibleName('Skills · Galaxy');
    await expect(current).toHaveCount(1);
  });

  test('a click travels to the chapter, focuses its title and writes its anchor in place', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const entries = await page.evaluate(() => window.history.length);
    await rail(page).getByRole('button', { name: 'Projects · Cosmic turtle' }).click();
    await expect
      .poll(async () => Math.abs((await page.locator('#projects').boundingBox())?.y ?? 99))
      .toBeLessThanOrEqual(2);
    await expect(page.getByRole('heading', { name: 'What I carry on my shell' })).toBeFocused();
    await expect(page).toHaveURL(/\/#projects$/);
    expect(await page.evaluate(() => window.history.length)).toBe(entries);
    await expect(rail(page).locator('[aria-current="step"]')).toHaveAccessibleName(
      'Projects · Cosmic turtle',
    );

    await rail(page).getByRole('button', { name: 'Home · Singularity' }).click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    await expect(page).toHaveURL(/\/$/);
  });

  test('with the keyboard: Enter on a chapter jumps there (instantly with reduced motion)', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/es', { waitUntil: 'networkidle' });
    await page
      .getByRole('navigation', { name: 'Capítulos' })
      .getByRole('button', { name: 'Contacto · Tierra' })
      .focus();
    // El último capítulo puede quedar más cerca del final que una pantalla: el scroll se para antes.
    const target = await page.evaluate(() =>
      Math.min(
        document.getElementById('contact')?.offsetTop ?? -1,
        document.documentElement.scrollHeight - window.innerHeight,
      ),
    );
    await page.keyboard.press('Enter');
    // Instantáneo: en el primer frame ya está.
    const landed = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          requestAnimationFrame(() => {
            resolve(window.scrollY);
          });
        }),
    );
    expect(Math.abs(landed - target)).toBeLessThanOrEqual(2);
    await expect(page.getByRole('heading', { name: 'Aterrizaje' })).toBeFocused();
    await expect(page).toHaveURL(/\/es#contact$/);
  });

  test('desktop shows section and scene; 390 px keeps only the dots, 44 px each', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(rail(page).getByText('Cosmic turtle')).toBeVisible();
    // Los puntos forman una columna, aunque cada texto mida distinto.
    const dotCenters = await rail(page)
      .locator('button > span:last-child')
      .evaluateAll((dots) =>
        dots.map((dot) => {
          const { left, width } = dot.getBoundingClientRect();
          return Math.round(left + width / 2);
        }),
      );
    expect(new Set(dotCenters).size).toBe(1);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(rail(page).getByText('Cosmic turtle')).toBeHidden();
    for (const button of await rail(page).getByRole('button').all()) {
      const box = await button.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('comes after the content in the tab order (top bar → chapter → rail)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const order = await page.evaluate(() => {
      const main = document.querySelector('main');
      const nav = document.querySelector('nav[aria-label="Chapters"]');
      return main !== null && nav !== null
        ? main.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING
        : 0;
    });
    expect(order).toBeTruthy();
  });
});
