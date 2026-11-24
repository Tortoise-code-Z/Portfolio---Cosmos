import { expect, type Locator, type Page } from '@playwright/test';

import { projectEntries } from '../../src/content/projects/entries.ts';
import { SHAPES_WORKER_TIMEOUT_MS } from '../../src/scene/worker/loadShapes/loadShapes.ts';
import {
  collectErrors,
  expectInterface,
  interfaceRects,
  overlaps,
  PARTICLES_PAINTED,
  projectBySlug,
  SCENE_READY,
  settleScene,
  skipWithoutWebGL2,
  waitFrames,
  withoutWebGL,
  type Rect,
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

const DESKTOP = { width: 1280, height: 720 } as const;

/** El worker de las formas (`scene.spec.ts`). */
const SHAPES_WORKER = /\/assets\/shapes\.worker-[^/]+\.js$/;

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
    const marked = new Set<string>();
    await expect
      .poll(
        async () => {
          // La placa, las filas y los pins en una sola lectura: los escribe el mismo frame.
          const { plate, rows, hot, shown } = await page.evaluate(() => {
            const pins = [
              ...document.querySelectorAll<HTMLElement>('[data-plate-pins] [data-pin]'),
            ].filter((el) => el.style.visibility === 'visible' && Number(el.style.opacity) > 0);
            return {
              plate: document.querySelector('[data-plate]')?.getAttribute('data-plate') ?? null,
              rows: [...document.querySelectorAll('#projects li[data-hot]')].map(
                (el) => el.getAttribute('data-project') ?? '',
              ),
              hot: pins.filter((el) => el.hasAttribute('data-hot')).map((el) => el.dataset.pin),
              shown: pins.map((el) => el.dataset.pin),
            };
          });
          expect(rows).toEqual([]);
          if (plate !== null) {
            seen.add(plate);
            // El pin marcado es el de la placa encendida, y solo ese (si se ve).
            expect(hot).toEqual(shown.includes(plate) ? [plate] : []);
            if (hot.length > 0) marked.add(plate);
          }
          return seen.size;
        },
        { timeout: CYCLE_TIMEOUT_MS },
      )
      .toBeGreaterThan(1);
    expect(marked.size).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });

  test('entering straight into Projects, the pins wait for the turtle: none over the void while the shapes arrive', async ({
    page,
  }) => {
    // El worker de las formas no llega hasta que el test lo suelta: el lienzo y su bucle ya están, la tortuga no.
    let release = (): void => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(SHAPES_WORKER, async (route) => {
      await held;
      await route.continue();
    });
    await page.setViewportSize(DESKTOP);
    await page.goto('/#projects');
    await expect(page.locator(SCENE_READY)).toBeAttached();
    // Unos frames del bucle sin formas (pide sus frames con requestAnimationFrame, como estos).
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          let left = 5;
          const next = (): void => {
            left -= 1;
            if (left === 0) resolve();
            else requestAnimationFrame(next);
          };
          requestAnimationFrame(next);
        }),
    );
    await expect(page.locator(PARTICLES_PAINTED)).toHaveCount(0);
    expect(await shownPins(page)).toEqual([]);
    expect(await page.locator('[data-plate-pins] [data-live]').count()).toBe(0);
    release();
    await expect(page.locator(PARTICLES_PAINTED)).toBeAttached({
      timeout: SHAPES_WORKER_TIMEOUT_MS * 2,
    });
    await expect.poll(async () => (await shownPins(page)).length).toBe(ordered.length);
  });

  test('while Mission control is read (the turtle still behind its veil), no pin shows and no plate lights', async ({
    page,
    browserName,
  }) => {
    test.slow(browserName === 'webkit', 'WebKit without a GPU paints few frames per second in CI');
    await page.setViewportSize(DESKTOP);
    await page.goto('/#mission-control', { waitUntil: 'networkidle' });
    await expect(page.locator(PARTICLES_PAINTED)).toBeAttached({
      timeout: SHAPES_WORKER_TIMEOUT_MS * 2,
    });
    // Más que un turno del ciclo (2,6 s de reloj de escena, que avanza como mucho 0,1 s por frame).
    await waitFrames(page, 40, 3000);
    expect(await plates(page)).toEqual({ plate: null, rows: [] });
    expect(await shownPins(page)).toEqual([]);
    expect(await page.locator('[data-plate-pins] [data-live]').count()).toBe(0);
    // La tortuga estaba detrás: de vuelta en Projects, el ciclo enciende sus placas.
    await page.evaluate(() => {
      document.getElementById('projects')?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
    await expect(page.locator('[data-plate]')).toBeAttached({ timeout: CYCLE_TIMEOUT_MS });
  });

  test('a row pointed while the cycle lights another plate lights its own', async ({ page }) => {
    await openProjects(page);
    const { plate: cycling } = await plates(page);
    const other = ordered.find(({ slug }) => slug !== cycling);
    if (other === undefined) throw new Error('Two projects needed');
    await row(page, other.slug).hover();
    await expectPointed(page, other.slug);
    // Y la fila sigue mandando: más de un turno del ciclo (2,6 s de reloj de escena) sin que cambie la placa. Si no
    // mandara, el ciclo pasaría por la suya dentro del sondeo y el `expectPointed` de arriba pasaría igual.
    await page.locator('[data-plate]').evaluate((scene) => {
      const seen: string[] = [];
      Object.assign(window, { platesSeen: seen });
      new MutationObserver(() => {
        seen.push(scene.getAttribute('data-plate') ?? 'none');
      }).observe(scene, { attributes: true, attributeFilter: ['data-plate'] });
    });
    await waitFrames(page, 40, 3000);
    expect(
      await page.evaluate(() => (window as unknown as { platesSeen: string[] }).platesSeen),
    ).toEqual([]);
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
    // Dos frames de la página por píxel: con pocos fps (WebKit sin GPU) también se pinta cada paso, y un hueco sin
    // fila se vería.
    const twoFrames = (): Promise<void> =>
      page.evaluate(
        () =>
          new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                resolve();
              });
            });
          }),
      );
    for (let y = a.y + a.height - 4; y <= b.y + 4; y += 1) {
      await page.mouse.move(x, y);
      await twoFrames();
    }
    for (let y = b.y + 4; y >= a.y + a.height - 4; y -= 1) {
      await page.mouse.move(x, y);
      await twoFrames();
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
      // Atrás: la capa de los pins vuelve a nacer y la escena los escribe enteros, los tres, en su sitio.
      await page.goBack();
      await expect(page).toHaveURL(/#projects$/);
      await pinsStill(page);
      expect((await shownPins(page)).map(({ slug }) => slug).sort()).toEqual(
        ordered.map(({ slug }) => slug).sort(),
      );
    });

    test('leaving the chapter with the wheel, the mouse still over a pin, lets its project go', async ({
      page,
    }) => {
      const [first] = ordered;
      if (first === undefined) throw new Error('No projects');
      await openProjects(page, false);
      await pinsStill(page);
      await pinOf(page, first.slug).hover();
      await expectPointed(page, first.slug);
      // Sin mover el ratón: el motor tiene que volver a mirar qué hay bajo el puntero tras el scroll (en WebKit no
      // está garantizado), como las etiquetas de Skills. Projects mide 240 vh: cuatro pantallas lo dejan atrás.
      await page.mouse.wheel(0, DESKTOP.height * 4);
      await expect(page.locator('[data-plate-pins] [data-live]')).toHaveCount(0);
      await expectNothingPointed(page);
    });

    test('leaving the chapter with the wheel, the mouse still over a row, lets its project go', async ({
      page,
    }) => {
      const [first] = ordered;
      if (first === undefined) throw new Error('No projects');
      await openProjects(page, false);
      await row(page, first.slug).hover();
      await expectPointed(page, first.slug);
      await page.mouse.wheel(0, DESKTOP.height * 2);
      await expectNothingPointed(page);
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
      // Los pins, decorativos, no se ven: la fila es la versión accesible.
      await expect(page.locator('[data-plate-pins]')).toBeHidden();
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
        // Cada proyecto con su pin, también en el móvil, escalonados (03-tortuga.md → «Aceptación» y «Móvil»).
        expect(pins.map(({ slug }) => slug).sort()).toEqual(ordered.map(({ slug }) => slug).sort());
        const canvas = await page.locator('canvas').boundingBox();
        if (canvas === null) throw new Error('No canvas');
        // Todas las piezas, también el panel en el móvil (en la posición de referencia, al entrar por su ancla: al
        // bajar, el panel sube sobre la tortuga y tapa los pins, como las etiquetas de las estrellas; componentes.md).
        const ui = await interfaceRects(page, 'projects');
        expectInterface(ui, viewport.width);
        const zones = [
          ['bar', ui.bar],
          ['rail', ui.rail],
          ['HUD', ui.hud],
          ['panel', ui.panel],
        ] as const;
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

test('without WebGL the links of a row work: its project page, its code and its live demo', async ({
  page,
}) => {
  await withoutWebGL(page);
  await page.goto('/#projects', { waitUntil: 'networkidle' });
  await settleScene(page);
  await expect(page.locator('html')).toHaveClass(/\bno-gl\b/);
  const chessmate = projectBySlug('chessmate');
  const links = row(page, 'chessmate');
  for (const [name, href] of [
    ['Code', chessmate.links.code],
    ['Live demo', chessmate.links.demo],
  ] as const) {
    if (href === null) continue;
    const link = links.getByRole('link', { name: new RegExp(`^${name}`) });
    await expect(link).toHaveAttribute('href', href);
    await expect(link).toHaveAttribute('target', '_blank');
  }
  await links.getByRole('link', { name: 'View project Chessmate' }).click();
  await expect(page).toHaveURL(/\/projects\/chessmate$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Chessmate');
});
