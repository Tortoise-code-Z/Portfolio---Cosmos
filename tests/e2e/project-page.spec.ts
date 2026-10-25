import { expect, test, type Page } from '@playwright/test';

/**
 * Página de proyecto (F2 · paso 7): docs/02-experiencia/pagina-proyecto.md y navegacion.md → «Volver
 * desde una página de proyecto». La galería sigue vacía hasta F2.8: el visor lo prueban sus tests
 * unitarios.
 */

const bar = (page: Page): ReturnType<Page['getByRole']> => page.getByRole('banner');

/** Alto que tapa la barra fija arriba (`scroll-padding-block-start`). */
const barHeight = (page: Page): Promise<number> =>
  page.evaluate(() =>
    Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingBlockStart),
  );

/**
 * El capítulo `#id` empieza justo bajo la barra o, si la página ya no da más de sí (Contacto, al final),
 * la página está abajo del todo y el capítulo se ve. Si la página no se moviera, no pasa.
 */
async function landedUnderBar(page: Page, id: string): Promise<boolean> {
  const box = await page.locator(`#${id}`).boundingBox();
  if (box === null) return false;
  if (Math.abs(box.y - (await barHeight(page))) <= 2) return true;
  return page.evaluate(
    (top) =>
      window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1 &&
      top < window.innerHeight,
    box.y,
  );
}

/** Área táctil mínima (44 × 44 px). */
async function atLeast44(locator: ReturnType<Page['getByRole']>): Promise<void> {
  const box = await locator.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
}

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

test.describe('project page', () => {
  test('every section with data, in order, and one h1', async ({ page }) => {
    await page.goto('/projects/chessmate', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Chessmate');
    await expect(page.getByRole('main').getByRole('heading', { level: 2 })).toHaveText([
      'About the project',
      'Key features',
      'Tech stack',
      'Development process',
      'Notes',
      'Try it',
      'Gallery',
    ]);
  });

  test('«Back to the shell» lands on the projects chapter with the focus on that row', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors = collectErrors(page);
    await page.goto('/projects/astrohub', { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: 'Back to the shell' }).click();
    await expect(page).toHaveURL(/\/#projects$/);
    const view = page.getByRole('link', { name: 'View project AstroHub' });
    await expect(view).toBeFocused();
    await expect(view).toBeInViewport();
    // La fila se resalta como «hot» (borde ámbar), igual que con el puntero o el Tab.
    const row = page.locator('[data-project="astrohub"]');
    await expect(row).toHaveCSS('border-inline-start-color', 'rgb(255, 196, 107)');
    expect(errors).toEqual([]);
  });

  test('the browser Back button restores the journey where it was, with the focus on that row', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#projects', { waitUntil: 'networkidle' });
    const view = page.getByRole('link', { name: 'View project Cosmos' });
    await view.scrollIntoViewIfNeeded();
    // Fuera del punto del ancla: un Atrás que volviera a aterrizar en #projects no pasaría.
    await page.evaluate(() => {
      window.scrollBy(0, 120);
    });
    const scrollY = (): Promise<number> => page.evaluate(() => window.scrollY);
    let settled = -1;
    await expect
      .poll(async () => {
        const now = await scrollY();
        const still = now === settled;
        settled = now;
        return still;
      })
      .toBe(true);
    const before = await scrollY();
    await expect(view).toBeInViewport();
    await view.click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cosmos');

    await page.goBack();
    await expect(page.getByRole('link', { name: 'View project Cosmos' })).toBeFocused();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(before);
  });

  test('the bar is there: Contact goes to the journey and lands below the bar', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/projects/chessmate', { waitUntil: 'networkidle' });
    await bar(page).getByRole('link', { name: 'Contact' }).click();
    await expect(page).toHaveURL(/\/#contact$/);
    await expect.poll(() => landedUnderBar(page, 'contact')).toBe(true);
  });

  test('390 px: «Back to the shell» from the last project scrolls its row into view', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/projects/cosmos', { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: 'Back to the shell' }).click();
    await expect(page).toHaveURL(/\/#projects$/);
    const view = page.getByRole('link', { name: 'View project Cosmos' });
    await expect(view).toBeFocused();
    await expect(view).toBeInViewport({ ratio: 1 });
  });

  test('390 px: the controls of the page are 44 px at least', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/projects/astrohub', { waitUntil: 'networkidle' });
    await atLeast44(page.getByRole('link', { name: 'Back to the shell' }));
    await atLeast44(page.getByRole('link', { name: /Previous project/ }));
    await atLeast44(page.getByRole('link', { name: /Next project/ }));
    const copies = page.getByRole('region', { name: 'Try it' }).getByRole('button');
    expect(await copies.count()).toBe(4);
    for (const button of await copies.all()) await atLeast44(button);
  });

  test('Projects in the bar also brings the focus to the row of the project just seen', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/projects/chessmate', { waitUntil: 'networkidle' });
    await bar(page).getByRole('link', { name: 'Projects' }).click();
    await expect(page).toHaveURL(/\/#projects$/);
    const view = page.getByRole('link', { name: 'View project Chessmate' });
    await expect(view).toBeFocused();
    await expect(view).toBeInViewport();
  });

  test('no rail and no HUD: there are no chapters', async ({ page }) => {
    await page.goto('/projects/chessmate', { waitUntil: 'networkidle' });
    await expect(page.getByRole('navigation', { name: 'Chapters' })).toHaveCount(0);
    await expect(page.locator('[aria-hidden="true"]', { hasText: /^t [=≈]/ })).toHaveCount(0);
  });

  test('«Skip to content» is the first Tab and focuses the project name', async ({ page }) => {
    await page.goto('/projects/cosmos', { waitUntil: 'networkidle' });
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    await expect(page).toHaveURL(/\/projects\/cosmos$/);
  });

  test('EN / ES goes to the same project in the other language', async ({ page }) => {
    await page.goto('/projects/chessmate', { waitUntil: 'networkidle' });
    await bar(page).getByRole('link', { name: 'Español' }).click();
    await expect(page).toHaveURL(/\/es\/projects\/chessmate$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText('Sobre el proyecto');
  });

  test('the quick mission opens here too and gives the focus back to the bar', async ({ page }) => {
    await page.goto('/projects/chessmate', { waitUntil: 'networkidle' });
    const opener = bar(page).getByRole('button', { name: 'Quick mission' });
    await opener.click();
    const dialog = page.getByRole('dialog', { name: /Víctor Pérez/ });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/projects\/chessmate#quick$/);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    await expect(page).toHaveURL(/\/projects\/chessmate$/);
  });

  test('a quick mission link to another project closes the mode on the new page', async ({
    page,
  }) => {
    await page.goto('/projects/chessmate', { waitUntil: 'networkidle' });
    await bar(page).getByRole('button', { name: 'Quick mission' }).click();
    const dialog = page.getByRole('dialog', { name: /Víctor Pérez/ });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('link', { name: /View project\s*AstroHub/ }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('AstroHub');
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/projects\/astrohub$/);
  });

  test('«Next project» with the keyboard brings the focus to the next project name', async ({
    page,
  }) => {
    await page.goto('/projects/chessmate', { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: /Next project\s*AstroHub/ }).focus();
    await page.keyboard.press('Enter');
    const title = page.getByRole('heading', { level: 1 });
    await expect(title).toHaveText('AstroHub');
    await expect(title).toBeFocused();
    await expect(title).toBeInViewport();
  });

  test('first and last project: their only neighbour card takes half the row, on its side', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    for (const [path, name, side] of [
      ['/projects/chessmate', /Next project/, 'end'],
      ['/projects/cosmos', /Previous project/, 'start'],
    ] as const) {
      await page.goto(path, { waitUntil: 'networkidle' });
      const pager = page.getByRole('navigation', { name: 'More projects' }).getByRole('list');
      const listBox = await pager.boundingBox();
      const cardBox = await pager.getByRole('link', { name }).boundingBox();
      if (listBox === null || cardBox === null) throw new Error('No pager');
      expect(cardBox.width).toBeLessThanOrEqual(listBox.width / 2);
      const gap =
        side === 'end'
          ? listBox.x + listBox.width - (cardBox.x + cardBox.width)
          : cardBox.x - listBox.x;
      expect(Math.abs(gap)).toBeLessThanOrEqual(1);
    }
  });

  for (const width of [520, 600]) {
    test(`${String(width)} px with text at 200 %: the demo accounts fit in their box (Spanish)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      for (const path of ['/es/projects/astrohub', '/es/projects/chessmate']) {
        await page.goto(path, { waitUntil: 'networkidle' });
        await page.addStyleTag({ content: 'html { font-size: 200%; }' });
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width,
        );
        const overflowing = await page
          .getByRole('region', { name: 'Pruébalo' })
          .evaluate((region) => {
            const box = region.querySelector('h3')?.parentElement?.getBoundingClientRect();
            if (box === undefined) return -1;
            return [...region.querySelectorAll('button, code')].filter(
              (element) => element.getBoundingClientRect().right > box.right + 0.5,
            ).length;
          });
        expect(overflowing).toBe(0);
      }
    });
  }

  for (const width of [320, 390]) {
    test(`${String(width)} px with text at 200 %: no sideways scroll, and the bar fits`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      for (const [path, quick] of [
        ['/projects/chessmate', 'Quick mission'],
        ['/es/projects/astrohub', 'Modo misión rápida'],
        ['/projects/cosmos', 'Quick mission'],
        ['/projects/no-existe', null],
        ['/es/loquesea', null],
      ] as const) {
        await page.goto(path, { waitUntil: 'networkidle' });
        await page.addStyleTag({ content: 'html { font-size: 200%; }' });
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width,
        );
        // `scrollWidth` no cuenta lo que se sale de la barra fija: se mira aparte.
        if (quick !== null) {
          await expect(bar(page).getByRole('button', { name: quick })).toBeInViewport({ ratio: 1 });
        }
      }
    });
  }
});

test.describe('project page with a Spanish browser', () => {
  test.use({ locale: 'es-ES' });

  test('the language suggestion offers this same project in Spanish', async ({ page }) => {
    await page.goto('/projects/astrohub', { waitUntil: 'networkidle' });
    const suggestion = page
      .getByRole('status')
      .filter({ hasText: 'Esta página también está en español.' });
    await suggestion.getByRole('link', { name: 'Ver en español' }).click();
    await expect(page).toHaveURL(/\/es\/projects\/astrohub$/);
  });
});
