import { expect, type Locator, type Page } from '@playwright/test';

import { projectEntries } from '../../src/content/projects/entries.ts';
import { SHAPES_WORKER_TIMEOUT_MS } from '../../src/scene/worker/loadShapes/loadShapes.ts';
import {
  browserHasWebGL2,
  collectErrors,
  PARTICLES_PAINTED,
  settleScene,
  withoutWebGL,
} from './support/helpers.ts';
import { test } from './support/test.ts';

/**
 * Las placas de la tortuga con la página de verdad (F4.4a; docs/02-experiencia/capitulos/03-tortuga.md →
 * «Interacciones», docs/04-escena/constelaciones-y-placas.md → «Resaltado»): el ratón, el Tab y el toque en una fila
 * iluminan la placa de su proyecto (y solo esa) y marcan la fila; sin nada señalado, las placas se iluminan por
 * turnos sin marcar ninguna fila; con movimiento reducido, sin turnos. La placa que pinta la escena la dice su
 * envoltorio (`data-plate`, el slug de su proyecto).
 */

const DESKTOP = { width: 1280, height: 720 } as const;

/** En orden de lectura, como las filas. */
const ordered = [...projectEntries].sort((a, b) => a.order - b.order);

/**
 * El ciclo da una placa cada 2,6 s de reloj de la escena, que avanza como mucho 0,1 s por frame (`MAX_STEP_S`):
 * WebKit sin GPU en el CI (~3 fps, `journey.spec.ts` → `DETONATE_TIMEOUT_MS`) pide ~9 s por placa.
 */
const CYCLE_TIMEOUT_MS = 20_000;

const row = (page: Page, slug: string): Locator =>
  page.locator(`#projects li[data-project="${slug}"]`);

/** La placa que pinta la escena (el slug de su proyecto) o `null`, y las filas marcadas. */
async function plates(page: Page): Promise<{ plate: string | null; rows: string[] }> {
  return page.evaluate(() => ({
    plate: document.querySelector('[data-plate]')?.getAttribute('data-plate') ?? null,
    rows: [...document.querySelectorAll('#projects li[data-hot]')].map(
      (el) => el.getAttribute('data-project') ?? '',
    ),
  }));
}

/** Un proyecto señalado: su placa encendida y su fila marcada, y solo esas. */
async function expectPointed(page: Page, slug: string): Promise<void> {
  await expect.poll(() => plates(page)).toEqual({ plate: slug, rows: [slug] });
}

/** Nada señalado: ninguna fila marcada; la placa, la del ciclo (cualquiera) o, sin ciclo, ninguna. */
async function expectNothingPointed(page: Page, cycle: boolean): Promise<void> {
  await expect.poll(async () => (await plates(page)).rows).toEqual([]);
  if (!cycle) await expect.poll(async () => (await plates(page)).plate).toBeNull();
}

/** El viaje en `#projects` con la escena pintada y ya en la tortuga (alguna placa encendida por el ciclo). */
async function openProjects(page: Page, cycle = true): Promise<void> {
  await page.setViewportSize(DESKTOP);
  await page.goto('/#projects', { waitUntil: 'networkidle' });
  await expect(page.locator(PARTICLES_PAINTED)).toBeAttached({
    timeout: SHAPES_WORKER_TIMEOUT_MS * 2,
  });
  if (cycle) await expect(page.locator('[data-plate]')).toBeAttached();
}

test.describe('the plates of the turtle', () => {
  test.beforeEach(async ({ page, browserName }) => {
    await page.goto('/');
    const hasWebGL2 = await browserHasWebGL2(page);
    // Chromium siempre lo tiene (SwiftShader sin GPU): si faltara, estos tests no deben saltarse en silencio.
    if (browserName === 'chromium') expect(hasWebGL2, 'Chromium must have WebGL2').toBe(true);
    test.skip(!hasWebGL2, 'This browser has no WebGL2 here');
  });

  test('with nothing pointed, the plates light in turn and no row is marked', async ({
    page,
    browserName,
  }) => {
    test.slow(browserName === 'webkit', 'WebKit without a GPU paints ~3 frames per second');
    const errors = collectErrors(page);
    await openProjects(page);
    const seen = new Set<string>();
    await expect
      .poll(
        async () => {
          const { plate, rows } = await plates(page);
          expect(rows).toEqual([]);
          if (plate !== null) seen.add(plate);
          return seen.size;
        },
        { timeout: CYCLE_TIMEOUT_MS },
      )
      .toBeGreaterThan(1);
    expect(errors).toEqual([]);
  });

  test('the mouse over a row lights its plate, and only it, and marks the row; leaving lets it go', async ({
    page,
  }) => {
    await openProjects(page);
    for (const { slug } of ordered) {
      await row(page, slug).hover();
      await expectPointed(page, slug);
    }
    // Al margen del panel (el capítulo deja pasar el ratón): fuera de cualquier fila.
    await page.mouse.move(4, DESKTOP.height / 2);
    await expectNothingPointed(page, true);
  });

  test('Tab through the links of the rows lights the plate of each row in turn', async ({
    page,
  }) => {
    await openProjects(page);
    await page.locator('#projects-title').focus();
    for (const { slug } of ordered) {
      await page.keyboard.press('Tab');
      await expect(row(page, slug).getByRole('link').first()).toBeFocused();
      await expectPointed(page, slug);
      // Los demás enlaces de la misma fila no la sueltan.
      const links = await row(page, slug).getByRole('link').count();
      for (let i = 1; i < links; i++) {
        await page.keyboard.press('Tab');
        await expectPointed(page, slug);
      }
    }
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('no plate lights by itself; the mouse over a row still lights its plate', async ({
      page,
    }) => {
      await openProjects(page, false);
      await expectNothingPointed(page, false);
      const [first] = ordered;
      if (first === undefined) throw new Error('No projects');
      await row(page, first.slug).hover();
      await expectPointed(page, first.slug);
      await page.mouse.move(4, DESKTOP.height / 2);
      await expectNothingPointed(page, false);
    });
  });

  test.describe('on a touch screen', () => {
    test.use({ hasTouch: true });

    test('a tap on a row lights its plate, another switches, a tap outside lets it go', async ({
      page,
    }) => {
      const [first, second] = ordered;
      if (first === undefined || second === undefined) throw new Error('Two projects needed');
      await openProjects(page);
      await row(page, first.slug).getByRole('heading', { level: 3 }).tap();
      await expectPointed(page, first.slug);
      await row(page, second.slug).getByRole('heading', { level: 3 }).tap();
      await expectPointed(page, second.slug);
      await page.locator('#projects-title').tap();
      await expectNothingPointed(page, true);
    });
  });
});

test('without WebGL the rows light no plate and are not marked by the mouse', async ({ page }) => {
  await withoutWebGL(page);
  await page.goto('/#projects', { waitUntil: 'networkidle' });
  await settleScene(page);
  await expect(page.locator('html')).toHaveClass(/\bno-gl\b/);
  const [first] = ordered;
  if (first === undefined) throw new Error('No projects');
  await row(page, first.slug).hover();
  await expect.poll(() => plates(page)).toEqual({ plate: null, rows: [] });
});
