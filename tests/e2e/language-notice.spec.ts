import { expect, type Page } from '@playwright/test';

import { test } from './support/test.ts';

/**
 * Sugerencia de idioma (F2 · paso 6): docs/02-experiencia/navegacion.md → «Idioma» y
 * docs/03-diseno/componentes.md → «Aviso». Sin redirección: solo se ofrece, y la respuesta se recuerda.
 */

/**
 * La página ya ha hidratado: el botón «Quick mission» abre y cierra su modo. Antes de eso el aviso aún no
 * puede salir (aparece al hidratar): sin esta espera, comprobar que no está no probaría nada.
 */
async function hydrated(page: Page): Promise<void> {
  const opener = page
    .getByRole('banner')
    .getByRole('button', { name: /Quick mission|Modo misión rápida/ });
  await opener.click();
  await expect(page.getByRole('dialog', { name: /Víctor Pérez/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: /Víctor Pérez/ })).toBeHidden();
}

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
    // Contestado: de vuelta en una página en inglés, no vuelve a salir.
    await page.goto('/#skills', { waitUntil: 'networkidle' });
    await hydrated(page);
    await expect(suggestion(page)).toHaveCount(0);
  });

  test('«No, gracias» hides it for good (also after a reload)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await suggestion(page).getByRole('button', { name: 'No, gracias' }).click();
    await expect(suggestion(page)).toHaveCount(0);
    await page.reload({ waitUntil: 'networkidle' });
    await hydrated(page);
    await expect(suggestion(page)).toHaveCount(0);
  });

  // Mientras se ve, el aviso tapa el borde de abajo: el hueco que el navegador deja al llevar el foco
  // (`scroll-padding-block-end`) crece con su altura (WCAG 2.4.11; design-system.md → «Foco»).
  for (const path of ['/', '/projects/chessmate']) {
    test(`390 px (${path}): with Tab, nothing focused ends up behind it`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path, { waitUntil: 'networkidle' });
      await expect(suggestion(page).getByRole('button', { name: 'No, gracias' })).toBeVisible();
      const covered: string[] = [];
      let reachedNotice = false;
      for (let tab = 0; tab < 200 && !reachedNotice; tab += 1) {
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(async () => {
          // Dos frames: el scroll del navegador al enfocar y, si hace falta, el de Notice.tsx.
          await new Promise((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(resolve));
          });
          const element = document.activeElement;
          const box = document.querySelector('[role="status"] > div')?.getBoundingClientRect();
          if (element === null || element === document.body || box === undefined) return null;
          if (element.closest('[role="status"]') !== null) return 'notice';
          const root = getComputedStyle(document.documentElement);
          const ring =
            Number.parseFloat(root.getPropertyValue('--focus-offset')) +
            Number.parseFloat(root.getPropertyValue('--focus-width'));
          const rect = element.getBoundingClientRect();
          const overlaps =
            rect.bottom + ring > box.top &&
            rect.top - ring < box.bottom &&
            rect.right + ring > box.left &&
            rect.left - ring < box.right;
          return overlaps ? element.textContent.trim() || element.tagName : '';
        });
        if (focused === 'notice') reachedNotice = true;
        else if (focused !== null && focused !== '') covered.push(focused);
      }
      expect(reachedNotice).toBe(true);
      expect(covered).toEqual([]);
    });
  }

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
    await hydrated(page);
    await expect(page.getByText('Esta página también está en español.')).toHaveCount(0);
  });
});
