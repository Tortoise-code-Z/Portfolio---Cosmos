import { expect, test, type Page } from '@playwright/test';

/**
 * Modo misión rápida (F2 · paso 6): docs/02-experiencia/navegacion.md → «Modo misión rápida» y
 * docs/03-diseno/componentes.md → «Modo misión rápida».
 */

const opener = (page: Page, name = 'Quick mission'): ReturnType<Page['getByRole']> =>
  page.getByRole('banner').getByRole('button', { name });

const quickDialog = (page: Page): ReturnType<Page['getByRole']> =>
  page.getByRole('dialog', { name: /Víctor Pérez/ });

const historyLength = (page: Page): Promise<number> => page.evaluate(() => window.history.length);
const scrollTop = (page: Page): Promise<number> => page.evaluate(() => window.scrollY);

test.describe('quick mission', () => {
  test('the bar button opens it full screen, with the focus on «Back to the journey» and #quick in place', async ({
    page,
  }) => {
    await page.goto('/#projects', { waitUntil: 'networkidle' });
    const before = await historyLength(page);
    await opener(page).click();

    const dialog = quickDialog(page);
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Back to the journey' })).toBeFocused();
    await expect(page).toHaveURL(/\/#quick$/);
    expect(await historyLength(page)).toBe(before);
    const box = await dialog.boundingBox();
    const viewport = page.viewportSize();
    expect(box).toMatchObject({ x: 0, y: 0, width: viewport?.width, height: viewport?.height });
  });

  test('everything is on one page: about, projects, skills, education, availability and contact', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await opener(page).click();
    await expect(quickDialog(page).getByRole('heading', { level: 3 })).toHaveText([
      'About',
      'Projects',
      'Skills',
      'Education',
      'Availability',
      'Contact',
    ]);
  });

  test('Esc closes it: the page has not moved, the old anchor is back and the focus returns to the button', async ({
    page,
  }) => {
    await page.goto('/#projects', { waitUntil: 'networkidle' });
    const top = await scrollTop(page);
    await opener(page).click();
    await expect(quickDialog(page)).toBeVisible();

    // Con el modo abierto, la página de detrás no se desplaza: ni con la rueda ni con el dedo (iOS).
    await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');
    await page.mouse.move(200, 400);
    await page.mouse.wheel(0, 1500);
    expect(await scrollTop(page)).toBe(top);

    await page.keyboard.press('Escape');
    await expect(quickDialog(page)).toBeHidden();
    await expect(page).toHaveURL(/\/#projects$/);
    await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
    await expect(opener(page)).toBeFocused();
    expect(await scrollTop(page)).toBe(top);
  });

  test('«Back to the journey» closes it as well', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await opener(page).click();
    await quickDialog(page).getByRole('button', { name: 'Back to the journey' }).click();
    await expect(quickDialog(page)).toBeHidden();
    await expect(page).toHaveURL(/\/$/);
    await expect(opener(page)).toBeFocused();
  });

  test('/es#quick opens the site with it already open, in Spanish; closing leaves /es', async ({
    page,
  }) => {
    await page.goto('/es#quick', { waitUntil: 'networkidle' });
    const dialog = page.getByRole('dialog', { name: 'Víctor Pérez · Desarrollador Frontend' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Volver al viaje' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/es$/);
    await expect(opener(page, 'Modo misión rápida')).toBeFocused();
  });

  test('Tab stays inside while it is open (the page behind is inert)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await opener(page).click();
    for (let step = 0; step < 12; step += 1) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(
        () =>
          document.activeElement === document.body ||
          document.activeElement?.closest('dialog') !== null,
      );
      expect(inside).toBe(true);
    }
  });

  test('a project link leads to its page; Back returns to the quick mission', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await opener(page).click();
    await quickDialog(page).getByRole('link', { name: 'View project Chessmate' }).click();
    await expect(page).toHaveURL(/\/projects\/chessmate$/);
    await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
    await page.goBack();
    await expect(quickDialog(page)).toBeVisible();
  });

  test('390 px: the title and every section fit the width (no sideways scroll)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/es#quick', { waitUntil: 'networkidle' });
    const dialog = quickDialog(page);
    await expect(dialog).toBeVisible();
    const overflow = await dialog.evaluate((element) => element.scrollWidth - element.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('the copy button copies the email and says so', async ({ page, browserName, context }) => {
    test.skip(browserName !== 'chromium', 'Only Chromium lets a test grant clipboard access');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/#quick', { waitUntil: 'networkidle' });
    const dialog = quickDialog(page);
    await dialog.getByRole('button', { name: 'Copy email' }).click();
    await expect(dialog.getByRole('button', { name: 'Copied' })).toBeFocused();
    await expect(dialog.getByRole('status')).toHaveText('Copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      'victorperez.brmte@passmail.com',
    );
  });
});

test.describe('copy the email in Contact', () => {
  test('if the clipboard refuses, the email is selected to copy by hand', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: () => Promise.reject(new DOMException('denied', 'NotAllowedError')) },
      });
    });
    await page.goto('/#contact', { waitUntil: 'networkidle' });
    const contact = page.getByRole('region', { name: 'Touchdown' });
    await contact.getByRole('button', { name: 'Copy email' }).click();
    await expect(contact.getByRole('button', { name: 'Select and copy it' })).toBeVisible();
    await expect(contact.getByRole('status')).toHaveText('Select and copy it');
    expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(
      'victorperez.brmte@passmail.com',
    );
    // Vuelve a «Copy» a los 1,8 s.
    await expect(contact.getByRole('button', { name: 'Copy email' })).toBeVisible({
      timeout: 4000,
    });
  });
});
