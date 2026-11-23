import { expect, type Locator, type Page } from '@playwright/test';

import { projectEntries } from '../../src/content/projects/entries.ts';
import { WIDE_LAYOUT_QUERY } from '../../src/scene/config/sceneConfig.ts';
import { SHAPES_WORKER_TIMEOUT_MS } from '../../src/scene/worker/loadShapes/loadShapes.ts';
import {
  collectErrors,
  hud,
  PARTICLES_PAINTED,
  settleScene,
  skipWithoutWebGL2,
  withoutWebGL,
} from './support/helpers.ts';
import { test } from './support/test.ts';

/**
 * Las placas de la tortuga con la página de verdad (F4.4a; docs/02-experiencia/capitulos/03-tortuga.md →
 * «Interacciones», docs/04-escena/constelaciones-y-placas.md → «Resaltado»): el ratón, el Tab y el toque en una fila
 * iluminan la placa de su proyecto (y solo esa) y marcan la fila; sin nada señalado, las placas se iluminan por
 * turnos sin marcar ninguna fila; con movimiento reducido, sin turnos. La placa que pinta la escena la dice su
 * envoltorio (`data-plate`, el slug de su proyecto). Los pins (F4.4b): el ratón encima señala su proyecto, un clic
 * abre su ficha, en táctil el primer toque señala y el segundo abre, el ciclo los marca sin marcar filas y, a los
 * tamaños de referencia, los que se ven no se pisan ni pisan la interfaz.
 */

type Rect = readonly [left: number, top: number, right: number, bottom: number];

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

/** Nada señalado, sin ciclo (movimiento reducido): ninguna fila marcada y ninguna placa encendida. */
async function expectNothingPointed(page: Page): Promise<void> {
  await expect.poll(() => plates(page)).toEqual({ plate: null, rows: [] });
}

/** El viaje en `#projects` con la escena pintada y ya en la tortuga (alguna placa encendida por el ciclo). */
async function openProjects(
  page: Page,
  cycle = true,
  viewport: { readonly width: number; readonly height: number } = DESKTOP,
  path = '/',
): Promise<void> {
  await page.setViewportSize(viewport);
  await page.goto(`${path}#projects`, { waitUntil: 'networkidle' });
  await expect(page.locator(PARTICLES_PAINTED)).toBeAttached({
    timeout: SHAPES_WORKER_TIMEOUT_MS * 2,
  });
  if (cycle) await expect(page.locator('[data-plate]')).toBeAttached();
}

const pinOf = (page: Page, slug: string): Locator =>
  page.locator(`[data-plate-pins] [data-pin="${slug}"]`);

/** Un pin que se ve: su etiqueta y su tallo (hasta el pie), y si está marcado. */
interface ShownPin {
  readonly slug: string;
  readonly tag: Rect;
  readonly stem: Rect;
  readonly hot: boolean;
}

/** Los pins que se ven, por orden. */
async function shownPins(page: Page): Promise<ShownPin[]> {
  return page.evaluate(() => {
    const rect = (el: Element): Rect => {
      const { left, top, right, bottom } = el.getBoundingClientRect();
      return [left, top, right, bottom];
    };
    return [...document.querySelectorAll<HTMLElement>('[data-plate-pins] [data-pin]')]
      .filter((el) => el.style.visibility === 'visible' && Number(el.style.opacity) > 0)
      .map((el) => ({
        slug: el.dataset.pin ?? '',
        tag: rect(el),
        stem: rect(el.lastElementChild ?? el),
        hot: el.hasAttribute('data-hot'),
      }));
  });
}

/**
 * Lo que puede tardar la escena en quedarse quieta tras un salto de scroll: WebKit sin GPU en el CI va a ~3 fps
 * (`constellations.spec.ts` → `LABELS_STILL_TIMEOUT_MS`).
 */
const PINS_STILL_TIMEOUT_MS = 15_000;

/** Espera a que los pins visibles no se muevan entre dos lecturas (con movimiento reducido, la tortuga no se mece). */
async function pinsStill(page: Page): Promise<void> {
  let previous = '';
  await expect
    .poll(
      async () => {
        const now = JSON.stringify((await shownPins(page)).map(({ slug, tag }) => [slug, tag]));
        const still = now === previous && now !== '[]';
        previous = now;
        return still;
      },
      { timeout: PINS_STILL_TIMEOUT_MS },
    )
    .toBe(true);
}

function overlaps(a: Rect, b: Rect): boolean {
  return a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
}

async function rectOf(locator: Locator): Promise<Rect | null> {
  if (!(await locator.isVisible())) return null;
  const box = await locator.boundingBox();
  return box === null ? null : [box.x, box.y, box.x + box.width, box.y + box.height];
}

test.describe('the plates of the turtle', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await skipWithoutWebGL2(page, testInfo);
  });

  test('with nothing pointed, the plates light in turn, no row is marked and the pin of the lit plate is', async ({
    page,
  }) => {
    // Hasta dos turnos del ciclo (en WebKit sin GPU, ~9 s cada uno) después de cargar la página: en los tres motores.
    test.slow();
    const errors = collectErrors(page);
    await openProjects(page);
    const seen = new Set<string>();
    await expect
      .poll(
        async () => {
          const [{ plate, rows }, pins] = await Promise.all([plates(page), shownPins(page)]);
          expect(rows).toEqual([]);
          if (plate !== null) {
            seen.add(plate);
            // Un pin marcado, el de la placa encendida (si se ve: puede leerse entre dos frames).
            const hot = pins.filter(({ hot: isHot }) => isHot).map(({ slug }) => slug);
            expect(hot.filter((slug) => slug !== plate)).toEqual([]);
          }
          return seen.size;
        },
        { timeout: CYCLE_TIMEOUT_MS },
      )
      .toBeGreaterThan(1);
    expect(errors).toEqual([]);
  });

  test('a row pointed while the cycle lights another plate lights its own and stops the cycle', async ({
    page,
  }) => {
    await openProjects(page);
    const { plate: cycling } = await plates(page);
    const other = ordered.find(({ slug }) => slug !== cycling);
    if (other === undefined) throw new Error('Two projects needed');
    // Con un proyecto señalado el ciclo se para: la placa solo puede ser la de la fila.
    await row(page, other.slug).hover();
    await expectPointed(page, other.slug);
  });

  test('moving the mouse slowly from one row to the next never shows the plate of the cycle in between', async ({
    page,
  }) => {
    // Espera a que el ciclo esté en una placa que no es de ninguna de las dos filas (hasta dos turnos).
    test.slow();
    const [first, second, third] = ordered;
    if (first === undefined || second === undefined || third === undefined)
      throw new Error('Three projects needed');
    await openProjects(page);
    await row(page, second.slug).evaluate((el) => {
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
    });
    await expect(page.locator(`[data-plate="${third.slug}"]`)).toBeAttached({
      timeout: CYCLE_TIMEOUT_MS,
    });
    const a = await row(page, first.slug).boundingBox();
    const b = await row(page, second.slug).boundingBox();
    if (a === null || b === null) throw new Error('No rows');
    const x = a.x + a.width / 2;
    await page.mouse.move(x, a.y + a.height - 4);
    await expectPointed(page, first.slug);
    // Cada placa que pinta la escena desde aquí.
    await page.locator('[data-plate]').evaluate((scene) => {
      const seen: string[] = [];
      Object.assign(window, { platesSeen: seen });
      new MutationObserver(() => {
        seen.push(scene.getAttribute('data-plate') ?? 'none');
      }).observe(scene, { attributes: true, attributeFilter: ['data-plate'] });
    });
    // De píxel en píxel por el hueco entre las dos filas, ida y vuelta.
    for (let y = a.y + a.height - 4; y <= b.y + 4; y += 1) {
      await page.mouse.move(x, y);
      await page.waitForTimeout(20);
    }
    for (let y = b.y + 4; y >= a.y + a.height - 4; y -= 1) {
      await page.mouse.move(x, y);
      await page.waitForTimeout(20);
    }
    await expectPointed(page, first.slug);
    expect(
      await page.evaluate(() => (window as unknown as { platesSeen: string[] }).platesSeen),
    ).toEqual([second.slug, first.slug]);
  });

  test.describe('with reduced motion (no cycle: a plate can only come from a gesture)', () => {
    test.use({ reducedMotion: 'reduce' });

    test('no plate lights by itself', async ({ page }) => {
      await openProjects(page, false);
      // Primero, algo que solo pasa con la escena en la tortuga: los pins, quietos en su sitio.
      await pinsStill(page);
      expect(await plates(page)).toEqual({ plate: null, rows: [] });
    });

    test('the mouse over a row lights its plate, and only it, and marks the row; leaving lets it go', async ({
      page,
    }) => {
      await openProjects(page, false);
      for (const { slug } of ordered) {
        await row(page, slug).hover();
        await expectPointed(page, slug);
      }
      // Al margen del panel (el capítulo deja pasar el ratón): fuera de cualquier fila.
      await page.mouse.move(4, DESKTOP.height / 2);
      await expectNothingPointed(page);
    });

    test('Tab through the links of the rows lights the plate of each row in turn', async ({
      page,
    }) => {
      await openProjects(page, false);
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

    test('the mouse over a pin lights its plate and marks its row and itself; leaving lets it go', async ({
      page,
    }) => {
      await openProjects(page, false);
      await pinsStill(page);
      for (const { slug } of ordered) {
        // `hover` comprueba que el pin recibe el puntero: ni `<main>` ni el capítulo se lo quitan.
        await pinOf(page, slug).hover();
        await expectPointed(page, slug);
        await expect(pinOf(page, slug)).toHaveAttribute('data-hot', '');
      }
      await page.mouse.move(4, DESKTOP.height / 2);
      await expectNothingPointed(page);
      await expect(page.locator('[data-plate-pins] [data-hot]')).toHaveCount(0);
    });

    test('a mouse click on a pin opens its project page', async ({ page }) => {
      const [first] = ordered;
      if (first === undefined) throw new Error('No projects');
      await openProjects(page, false);
      await pinsStill(page);
      await pinOf(page, first.slug).click();
      await expect(page).toHaveURL(new RegExp(`/projects/${first.slug}$`));
    });

    test('in Windows high contrast, the pointed row stands out (Highlight)', async ({
      page,
      browserName,
    }) => {
      test.skip(browserName !== 'chromium', 'Only Chromium emulates forced colors.');
      const [first, second] = ordered;
      if (first === undefined || second === undefined) throw new Error('Two projects needed');
      await page.emulateMedia({ forcedColors: 'active' });
      await openProjects(page, false);
      await row(page, first.slug).hover();
      await expectPointed(page, first.slug);
      const border = (slug: string): Promise<string> =>
        row(page, slug).evaluate((element) => getComputedStyle(element).borderInlineStartColor);
      // El borde llega con su transición: se espera a que se distinga del de una fila sin señalar.
      const off = await border(second.slug);
      await expect.poll(() => border(first.slug)).not.toBe(off);
    });

    test.describe('on a touch screen', () => {
      test.use({ hasTouch: true });

      test('a first tap on a pin lights its plate and marks its row; a second opens its project', async ({
        page,
      }) => {
        const [, second] = ordered;
        if (second === undefined) throw new Error('Two projects needed');
        await openProjects(page, false);
        await pinsStill(page);
        await pinOf(page, second.slug).tap();
        await expectPointed(page, second.slug);
        await expect(page).toHaveURL(/#projects$/);
        await pinOf(page, second.slug).tap();
        await expect(page).toHaveURL(new RegExp(`/projects/${second.slug}$`));
      });

      test('a tap on a row lights its plate, another switches, a tap outside lets it go', async ({
        page,
      }) => {
        const [first, second] = ordered;
        if (first === undefined || second === undefined) throw new Error('Two projects needed');
        await openProjects(page, false);
        await row(page, first.slug).getByRole('heading', { level: 3 }).tap();
        await expectPointed(page, first.slug);
        await row(page, second.slug).getByRole('heading', { level: 3 }).tap();
        await expectPointed(page, second.slug);
        await page.locator('#projects-title').tap();
        await expectNothingPointed(page);
      });
    });
  });
});

test.describe('the pins of the plates, where they stand', () => {
  test.use({ reducedMotion: 'reduce' });

  test.beforeEach(async ({ page }, testInfo) => {
    await skipWithoutWebGL2(page, testInfo);
  });

  for (const path of ['/', '/es']) {
    for (const viewport of [
      { width: 1280, height: 720 },
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      test(`${path} at ${String(viewport.width)}×${String(viewport.height)}, the pins shown never overlap each other, the interface or the edges`, async ({
        page,
      }) => {
        await openProjects(page, false, viewport, path);
        await pinsStill(page);
        const pins = await shownPins(page);
        const wide = await page.evaluate((query) => matchMedia(query).matches, WIDE_LAYOUT_QUERY);
        // Cada proyecto con su pin, también en el móvil, escalonados (03-tortuga.md → «Aceptación» y «Móvil»).
        expect(pins.map(({ slug }) => slug).sort()).toEqual(ordered.map(({ slug }) => slug).sort());
        const canvas = await page.locator('canvas').boundingBox();
        if (canvas === null) throw new Error('No canvas');
        const zones = [
          ['bar', await rectOf(page.getByRole('banner'))],
          [
            'rail',
            await rectOf(page.getByRole('navigation', { name: /^(?:Chapters|Capítulos)$/ })),
          ],
          ['HUD', await rectOf(hud(page))],
          ['panel', wide ? await rectOf(page.locator('#projects > *').first()) : null],
        ] as const;
        expect(zones[1][1], 'rail').not.toBeNull();
        for (const [index, { slug, tag, stem }] of pins.entries()) {
          expect(tag[0], `${slug}: left edge`).toBeGreaterThanOrEqual(0);
          expect(tag[1], `${slug}: top edge`).toBeGreaterThanOrEqual(0);
          expect(tag[2], `${slug}: right edge`).toBeLessThanOrEqual(canvas.width);
          expect(stem[3], `${slug}: bottom edge`).toBeLessThanOrEqual(canvas.height);
          for (const [name, zone] of zones) {
            if (zone === null) continue;
            expect(overlaps(tag, zone), `${slug} over the ${name}`).toBe(false);
            expect(overlaps(stem, zone), `the stem of ${slug} over the ${name}`).toBe(false);
          }
          // Ni dos etiquetas se pisan ni un tallo cruza la etiqueta de otro.
          for (const other of pins.slice(index + 1)) {
            expect(overlaps(tag, other.tag), `${slug} over ${other.slug}`).toBe(false);
            expect(overlaps(tag, other.stem), `${slug} over the stem of ${other.slug}`).toBe(false);
            expect(overlaps(stem, other.tag), `the stem of ${slug} over ${other.slug}`).toBe(false);
          }
        }
      });
    }
  }
});

test('without WebGL the rows light no plate and are not marked by the mouse', async ({ page }) => {
  await withoutWebGL(page);
  await page.goto('/#projects', { waitUntil: 'networkidle' });
  await settleScene(page);
  await expect(page.locator('html')).toHaveClass(/\bno-gl\b/);
  const [first, second] = ordered;
  if (first === undefined || second === undefined) throw new Error('Two projects needed');
  await row(page, first.slug).hover();
  // Primero, que el ratón encima ya se ve (el ámbar del `:hover`): después, que no ha señalado nada.
  const border = (slug: string): Promise<string> =>
    row(page, slug).evaluate((element) => getComputedStyle(element).borderInlineStartColor);
  const off = await border(second.slug);
  await expect.poll(() => border(first.slug)).not.toBe(off);
  expect(await plates(page)).toEqual({ plate: null, rows: [] });
});
