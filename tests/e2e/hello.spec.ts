import { expect, test, type Page } from '@playwright/test';

/** Recoge los errores de consola para exigir «0 errores» (métrica del brief). */
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test.describe('pre-rendered home', () => {
  test('English home at / with lang="en"', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Víctor Pérez');
    await expect(page).toHaveTitle(/Frontend Developer/);
    expect(errors).toEqual([]);
  });

  test('Spanish home at /es with lang="es"', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto('/es');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByText('Mi código también.')).toBeVisible();
    await expect(page).toHaveTitle(/Desarrollador Frontend/);
    expect(errors).toEqual([]);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('content is readable from the pre-rendered HTML (P1)', async ({ page }) => {
    await page.goto('/es');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Víctor Pérez');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  });

  test('the dark background does not depend on JavaScript (P1)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(4, 5, 11)');
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
  });
});
