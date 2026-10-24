import { expect, test, type Page } from '@playwright/test';

/**
 * Sugerencia de idioma (F2 · paso 6): docs/02-experiencia/navegacion.md → «Idioma» y
 * docs/03-diseno/componentes.md → «Aviso». Sin redirección: solo se ofrece, y la respuesta se recuerda.
 */

test.describe('language suggestion with a Spanish browser', () => {
  test.use({ locale: 'es-ES' });

  const suggestion = (page: Page): ReturnType<Page['getByRole']> =>
    page.getByRole('status').filter({ hasText: 'Esta página también está en español.' });

  test('an English page offers Spanish, in Spanish, without moving the focus', async ({ page }) => {
    await page.goto('/#skills', { waitUntil: 'networkidle' });
    // La región viva no ocupa sitio: lo que se ve es el aviso de dentro.
    await expect(suggestion(page).getByText('Esta página también está en español.')).toBeVisible();
    await expect(suggestion(page)).toHaveAttribute('lang', 'es');
    await expect(page.locator('body')).toBeFocused();
    await suggestion(page).getByRole('link', { name: 'Ver en español' }).click();
    await expect(page).toHaveURL(/\/es#skills$/);
    await expect(page.getByRole('status').filter({ hasText: 'español' })).toHaveCount(0);
  });

  test('«No, gracias» hides it for good (also after a reload)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await suggestion(page).getByRole('button', { name: 'No, gracias' }).click();
    await expect(suggestion(page)).toHaveCount(0);
    await page.reload({ waitUntil: 'networkidle' });
    await expect(suggestion(page)).toHaveCount(0);
  });

  test('390 px: it fits the screen above the bottom edge', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(suggestion(page).getByRole('button', { name: 'No, gracias' })).toBeInViewport({
      ratio: 1,
    });
  });
});

test.describe('language suggestion with an English browser', () => {
  test.use({ locale: 'en-GB' });

  test('says nothing', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByText('Esta página también está en español.')).toHaveCount(0);
  });
});
