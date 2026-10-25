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

/** La posición de scroll cuando ya no se mueve (el aterrizaje en el ancla, las fuentes que cargan). */
async function settledScrollTop(page: Page): Promise<number> {
  let previous = Number.NaN;
  await expect
    .poll(
      async () => {
        const now = await scrollTop(page);
        const settled = now === previous;
        previous = now;
        return settled;
      },
      { intervals: [150] },
    )
    .toBe(true);
  return previous;
}

test.describe('quick mission', () => {
  test('the bar button opens it full screen, with the focus on «Close quick mission» and #quick in place', async ({
    page,
  }) => {
    await page.goto('/#projects', { waitUntil: 'networkidle' });
    const before = await historyLength(page);
    await opener(page).click();

    const dialog = quickDialog(page);
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Close quick mission' })).toBeFocused();
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
    const top = await settledScrollTop(page);
    await opener(page).click();
    await expect(quickDialog(page)).toBeVisible();

    // Con el modo abierto, el documento no se desplaza (lo que bloquea es esto, no la rueda).
    await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');

    await page.keyboard.press('Escape');
    await expect(quickDialog(page)).toBeHidden();
    await expect(page).toHaveURL(/\/#projects$/);
    await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
    await expect(opener(page)).toBeFocused();
    expect(await scrollTop(page)).toBe(top);
  });

  test('«Close quick mission» closes it as well', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await opener(page).click();
    await quickDialog(page).getByRole('button', { name: 'Close quick mission' }).click();
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
    await expect(dialog.getByRole('button', { name: 'Cerrar la misión rápida' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/es$/);
    await expect(opener(page, 'Modo misión rápida')).toBeFocused();
  });

  test('#quick typed in the address: Esc gives back the old anchor, and Back closes it', async ({
    page,
  }) => {
    await page.goto('/#projects', { waitUntil: 'networkidle' });
    // Un cambio de ancla en el mismo documento: entrada nueva en el historial y `hashchange`.
    await page.evaluate(() => {
      window.location.hash = '#quick';
    });
    await expect(quickDialog(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(quickDialog(page)).toBeHidden();
    await expect(page).toHaveURL(/\/#projects$/);

    await page.evaluate(() => {
      window.location.hash = '#quick';
    });
    await expect(quickDialog(page)).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/#projects$/);
    await expect(quickDialog(page)).toBeHidden();
    await expect(opener(page)).toBeFocused();
  });

  test('Tab stays inside while it is open (the page behind is inert)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await opener(page).click();
    const dialog = quickDialog(page);
    await expect(dialog.getByRole('button', { name: 'Close quick mission' })).toBeFocused();
    expect(await dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
    // Fuera = cualquier elemento que no esté en el diálogo (el `body` vale: el navegador puede
    // pasar por su propia interfaz antes de volver).
    const focusInside = (): Promise<boolean> =>
      page.evaluate(() => {
        const element = document.activeElement;
        return (
          element === document.body || (element !== null && element.closest('dialog') !== null)
        );
      });

    // Desde el primero, un paso atrás: con un diálogo no modal iría al último enlace de la página.
    await page.keyboard.press('Shift+Tab');
    expect(await focusInside()).toBe(true);

    // Hacia delante, más pasos que enfocables tiene: cruza el borde del final.
    await dialog.getByRole('button', { name: 'Close quick mission' }).focus();
    const focusables = await dialog.evaluate(
      (element) => element.querySelectorAll('a[href], button').length,
    );
    for (let step = 0; step < focusables + 2; step += 1) {
      await page.keyboard.press('Tab');
      expect(await focusInside()).toBe(true);
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

  test('390 px: «Close quick mission» stays at the top while the content scrolls', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#quick', { waitUntil: 'networkidle' });
    const dialog = quickDialog(page);
    const back = dialog.getByRole('button', { name: 'Close quick mission' });
    const before = await back.boundingBox();
    await dialog.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect.poll(() => dialog.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await expect(back).toBeInViewport({ ratio: 1 });
    // Quieta, en su sitio de siempre; pegada, arriba del todo y por encima del contenido.
    expect((await back.boundingBox())?.y).toBeLessThanOrEqual(before?.y ?? 0);
    const onTop = await back.evaluate((button) => {
      const box = button.getBoundingClientRect();
      return document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2) === button;
    });
    expect(onTop).toBe(true);
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

  test('390 px with text at 200 % (/es): «Selecciónalo y cópialo» wraps and stays on screen', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: () => Promise.reject(new DOMException('denied', 'NotAllowedError')) },
      });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/es#contact', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    const contact = page.getByRole('region', { name: 'Aterrizaje' });
    await contact.getByRole('button', { name: 'Copiar el email' }).click();
    const fallback = contact.getByRole('button', { name: 'Selecciónalo y cópialo' });
    await expect(fallback).toBeVisible();
    // Entero dentro de la pantalla (las filas de Proyectos aún se salen a este tamaño: deuda de F6).
    await expect(fallback).toBeInViewport({ ratio: 1 });
  });
});

test.describe('touch targets of F2 · step 6 (at least 44 × 44 px)', () => {
  // Navegador en español: sale también la sugerencia de idioma en la página inglesa.
  test.use({ locale: 'es-ES' });

  const atLeast44 = async (locator: ReturnType<Page['getByRole']>): Promise<void> => {
    const box = await locator.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  };

  test('390 px: «Quick», both copy buttons, «Close quick mission» and the language suggestion', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#contact', { waitUntil: 'networkidle' });
    await atLeast44(opener(page));
    await atLeast44(
      page.getByRole('region', { name: 'Touchdown' }).getByRole('button', { name: 'Copy email' }),
    );
    const suggestion = page.getByRole('status').filter({ hasText: 'español' });
    await atLeast44(suggestion.getByRole('link', { name: 'Ver en español' }));
    await atLeast44(suggestion.getByRole('button', { name: 'No, gracias' }));

    await opener(page).click();
    const dialog = quickDialog(page);
    await atLeast44(dialog.getByRole('button', { name: 'Close quick mission' }));
    await atLeast44(dialog.getByRole('button', { name: 'Copy email' }));
  });

  test('1280 px: the «Open to work» chip', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await atLeast44(page.getByRole('banner').getByRole('link', { name: 'Open to work' }));
  });
});
