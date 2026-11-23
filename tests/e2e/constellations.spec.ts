import { expect, type Locator, type Page } from '@playwright/test';

import { skillGroups } from '../../src/content/skills.ts';
import type { SkillGroupId } from '../../src/content/types.ts';
import { keepOutZones } from '../../src/scene/math/labelFit/labelFit.ts';
import { STAR_LABEL_KEEP_OUT } from '../../src/scene/config/constellationLayout/constellationLayout.ts';
import { WIDE_LAYOUT_QUERY } from '../../src/scene/config/sceneConfig.ts';
import { CONTEXT_RESTORE_TIMEOUT_MS } from '../../src/scene/contextLoss/contextLoss.ts';
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
 * Las constelaciones de Skills con la página de verdad (F4.3c; docs/02-experiencia/capitulos/02-galaxia.md →
 * «Interacciones» y «Layout», docs/04-escena/constelaciones-y-placas.md): el ratón, el Tab y el toque encienden un
 * grupo (y solo ese), una etiqueta marca su grupo en el panel y, a los tamaños que vigila el CI, las etiquetas
 * visibles no se pisan ni pisan la interfaz. Lo que la escena reserva a mano (`STAR_LABEL_KEEP_OUT`) se compara con
 * la interfaz real.
 */

type Rect = readonly [left: number, top: number, right: number, bottom: number];

interface Viewport {
  readonly width: number;
  readonly height: number;
}

const DESKTOP: Viewport = { width: 1280, height: 720 };

/**
 * Desde aquí se ve el HUD (`CosmicHud.module.css`: sin HUD por debajo de `sm`, 520 px). Se comprueba en los dos
 * sentidos (`expectInterface`): si el corte del CSS cambia entre los anchos probados, el test falla.
 */
const HUD_FROM_PX = 520;

/** El grupo del panel (su `<li>`). */
const panelGroup = (page: Page, id: SkillGroupId): Locator =>
  page.locator(`#skills li[data-group="${id}"]`);

/** Una etiqueta, por la skill. */
const starLabel = (page: Page, skill: string): Locator =>
  page.locator(`[data-constellation-labels] [data-skill="${skill}"]`);

/**
 * Los grupos marcados en el panel y los que tienen etiquetas visibles encendidas: siempre los mismos. Las ocultas no
 * cuentan: la escena no reescribe una etiqueta oculta (se pone al día al volver a verse).
 */
async function litGroups(page: Page): Promise<{ panel: string[]; labels: string[] }> {
  return page.evaluate(() => {
    const groupsOf = (elements: readonly Element[]): string[] => [
      ...new Set(elements.map((el) => el.getAttribute('data-group') ?? '')),
    ];
    return {
      panel: groupsOf([...document.querySelectorAll('#skills li[data-hot]')]),
      labels: groupsOf(
        [
          ...document.querySelectorAll<HTMLElement>('[data-constellation-labels] [data-hot]'),
        ].filter((el) => el.style.visibility === 'visible'),
      ),
    };
  });
}

async function expectLit(page: Page, id: SkillGroupId | null): Promise<void> {
  const expected = id === null ? [] : [id];
  await expect.poll(() => litGroups(page)).toEqual({ panel: expected, labels: expected });
}

/** Lo que se ve de las etiquetas: id y caja, en el orden del panel. */
async function shownLabels(page: Page): Promise<{ id: string; rect: Rect }[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-constellation-labels] [data-skill]')]
      .filter((el) => el.style.visibility === 'visible' && Number(el.style.opacity) > 0)
      .map((el) => {
        const { left, top, right, bottom } = el.getBoundingClientRect();
        return { id: el.dataset.skill ?? '', rect: [left, top, right, bottom] as const };
      }),
  );
}

/**
 * El viaje en `#skills` con la escena pintada y las etiquetas quietas: responden al ratón (`data-live`) y no se
 * mueven entre dos lecturas (la `m` de la escena llega suavizada).
 */
async function openSkills(page: Page, viewport: Viewport = DESKTOP, path = '/'): Promise<void> {
  await page.setViewportSize(viewport);
  await page.goto(`${path}#skills`, { waitUntil: 'networkidle' });
  await expect(page.locator(PARTICLES_PAINTED)).toBeAttached({
    timeout: SHAPES_WORKER_TIMEOUT_MS * 2,
  });
  await expect(page.locator('[data-constellation-labels] [data-live]').first()).toBeAttached();
  await labelsStill(page);
}

/**
 * Lo que puede tardar la escena en quedarse quieta tras un salto de scroll. La `m` suavizada avanza como mucho un
 * 34 % de lo que le falta por frame (`M_SMOOTHING.rate` × `MAX_STEP_S`) y para a 1e-4: un cuarto de pantalla pide
 * ~20 frames. WebKit sin GPU en el CI va a ~3 fps con la página entera (`journey.spec.ts` → `DETONATE_TIMEOUT_MS`):
 * ~7 s, más que los 5 s de `expect`. Solo espera lo que haga falta.
 */
const LABELS_STILL_TIMEOUT_MS = 15_000;

/** Espera a que las etiquetas visibles no se muevan entre dos lecturas (la `m` de la escena llega suavizada). */
async function labelsStill(page: Page): Promise<void> {
  let previous = '';
  await expect
    .poll(
      async () => {
        const now = JSON.stringify(await shownLabels(page));
        const still = now === previous;
        previous = now;
        return still;
      },
      { timeout: LABELS_STILL_TIMEOUT_MS },
    )
    .toBe(true);
}

/**
 * Las etiquetas vivas (`data-live`) y visibles cuyo centro se queda `<main>` o un capítulo: el puntero no les llega.
 * Lo que pinta la interfaz encima (un panel, la barra) no cuenta: eso lo vigila el test de solapamiento.
 */
async function liveLabelsTakenByAChapter(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const main = document.querySelector('main');
    return [...document.querySelectorAll<HTMLElement>('[data-constellation-labels] [data-live]')]
      .filter((el) => el.style.visibility === 'visible' && Number(el.style.opacity) > 0)
      .filter((el) => {
        const { left, top, width, height } = el.getBoundingClientRect();
        const hit = document.elementFromPoint(left + width / 2, top + height / 2);
        return hit !== null && (hit === main || hit.parentElement === main);
      })
      .map((el) => el.dataset.skill ?? '');
  });
}

function overlaps(a: Rect, b: Rect): boolean {
  return a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
}

async function rectOf(locator: Locator): Promise<Rect | null> {
  if (!(await locator.isVisible())) return null;
  const box = await locator.boundingBox();
  return box === null ? null : [box.x, box.y, box.x + box.width, box.y + box.height];
}

/** La interfaz por encima de la escena (cada pieza, `null` si no se ve). */
interface InterfaceRects {
  readonly bar: Rect | null;
  readonly rail: Rect | null;
  readonly hud: Rect | null;
  /** El panel de Skills. */
  readonly panel: Rect | null;
}

async function interfaceRects(page: Page): Promise<InterfaceRects> {
  return {
    bar: await rectOf(page.getByRole('banner')),
    rail: await rectOf(page.getByRole('navigation', { name: /^(?:Chapters|Capítulos)$/ })),
    hud: await rectOf(hud(page)),
    panel: await rectOf(page.locator('#skills > *').first()),
  };
}

/** ¿Usa la página la disposición de escritorio? La misma consulta que la escena (`WIDE_LAYOUT_QUERY`). */
async function isWide(page: Page): Promise<boolean> {
  return page.evaluate((query) => matchMedia(query).matches, WIDE_LAYOUT_QUERY);
}

/**
 * La interfaz que se debe ver a este ancho, sin `null`: la barra, el raíl y el panel siempre, y el HUD desde
 * `HUD_FROM_PX` y solo desde ahí (su localizador ya se encuentra a 768, 1280 y 1440 px: por debajo, `null` es que está
 * oculto). Si un texto o el orden de la página cambian y una pieza deja de encontrarse, el test falla en vez de
 * saltarse su comprobación.
 */
function expectInterface(ui: InterfaceRects, width: number): void {
  expect(ui.bar, 'bar').not.toBeNull();
  expect(ui.rail, 'rail').not.toBeNull();
  expect(ui.panel, 'Skills panel').not.toBeNull();
  expect(ui.hud === null, 'HUD hidden').toBe(width < HUD_FROM_PX);
}

/** El lienzo de la escena (sin la barra de scroll), al que se refieren las zonas de `STAR_LABEL_KEEP_OUT`. */
async function canvasSize(page: Page): Promise<Viewport> {
  const box = await page.locator('canvas').boundingBox();
  if (box === null) throw new Error('No canvas');
  return { width: box.width, height: box.height };
}

test.describe('the constellations of Skills', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await skipWithoutWebGL2(page, testInfo);
  });

  test('the mouse over a group of the panel lights its constellation, and only it; leaving turns it off', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await openSkills(page);
    await expectLit(page, null);
    for (const { id } of skillGroups) {
      await panelGroup(page, id).hover();
      await expectLit(page, id);
    }
    // Al margen del panel (el capítulo deja pasar el ratón): fuera de cualquier grupo.
    await page.mouse.move(4, DESKTOP.height / 2);
    await expectLit(page, null);
    expect(errors).toEqual([]);
  });

  test('Tab lights each group in turn (they are focusable with the scene); leaving the panel turns it off', async ({
    page,
  }) => {
    await openSkills(page);
    await page.locator('#skills-title').focus();
    for (const group of skillGroups) {
      await page.keyboard.press('Tab');
      await expect(panelGroup(page, group.id)).toBeFocused();
      await expect(panelGroup(page, group.id)).toHaveAccessibleName(group.title.en);
      await expectLit(page, group.id);
    }
    await page.keyboard.press('Tab');
    await expectLit(page, null);
  });

  test('if the scene falls with the keyboard on a group, the focus goes to the chapter title, not to the page', async ({
    page,
  }) => {
    await openSkills(page);
    await page.locator('#skills-title').focus();
    await page.keyboard.press('Tab');
    await expect(panelGroup(page, 'web')).toBeFocused();
    // Un contexto perdido que no vuelve: la escena pasa a sin WebGL y el grupo deja de ser enfocable.
    await page.locator('canvas').evaluate((canvas) => {
      const context = (canvas as HTMLCanvasElement).getContext('webgl2');
      context?.getExtension('WEBGL_lose_context')?.loseContext();
    });
    await expect(page.locator('html')).toHaveClass(/\bno-gl\b/, {
      timeout: CONTEXT_RESTORE_TIMEOUT_MS * 2,
    });
    await expect(panelGroup(page, 'web')).not.toHaveAttribute('tabindex');
    await expect(page.locator('#skills-title')).toBeFocused();
  });

  test('a group clicked with the mouse does not light again by itself when the browser gives the focus back', async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== 'chromium',
      'How a programmatic focus inherits the last modality (:focus-visible): Chromium',
    );
    await openSkills(page);
    // El clic le da el foco (es enfocable); apartar el ratón lo apaga, pero el foco se queda.
    await panelGroup(page, 'web').click();
    await expectLit(page, 'web');
    await page.mouse.move(4, DESKTOP.height / 2);
    await expectLit(page, null);
    await expect(panelGroup(page, 'web')).toBeFocused();
    // Lo que hace el navegador al volver a la pestaña: quitar y devolver el foco, sin gesto (headless no lo hace con
    // `bringToFront`; se reproduce a mano, con la modalidad del último gesto, el ratón).
    await page.evaluate(() => {
      const group = document.activeElement;
      if (!(group instanceof HTMLElement)) throw new Error('No focused group');
      group.blur();
      group.focus();
    });
    await expect(panelGroup(page, 'web')).toBeFocused();
    await expectLit(page, null);
  });

  test.describe('with reduced motion (no parallax: the label stays still under the mouse)', () => {
    test.use({ reducedMotion: 'reduce' });

    test('the mouse over a label marks its group in the panel (the chapter lets it through); leaving lets it go', async ({
      page,
    }) => {
      await openSkills(page);
      // `hover` comprueba que la etiqueta recibe el puntero: ni `<main>` ni el capítulo se lo quitan.
      await starLabel(page, 'git').hover();
      await expectLit(page, 'tools');
      await starLabel(page, 'claude').hover();
      await expectLit(page, 'ai');
      await page.mouse.move(4, DESKTOP.height / 2);
      await expectLit(page, null);
    });

    test('leaving the chapter with the wheel, the mouse still over a label, lets its group go', async ({
      page,
    }) => {
      await openSkills(page);
      await starLabel(page, 'git').hover();
      await expectLit(page, 'tools');
      // Sin mover el ratón: el motor tiene que volver a mirar qué hay bajo el puntero tras el scroll (en WebKit no está garantizado).
      await page.mouse.wheel(0, DESKTOP.height * 2);
      await expect(page.locator('[data-constellation-labels] [data-live]')).toHaveCount(0);
      await expectLit(page, null);
    });
  });

  test('in Windows high contrast, the lit group stands out in the panel (Highlight)', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Only Chromium emulates forced colors.');
    await page.emulateMedia({ forcedColors: 'active' });
    await openSkills(page);
    await panelGroup(page, 'web').hover();
    await expectLit(page, 'web');
    const border = (id: SkillGroupId): Promise<string> =>
      panelGroup(page, id).evaluate((element) => getComputedStyle(element).borderInlineStartColor);
    // El borde llega con su transición: se espera a que se distinga del de un grupo apagado.
    const off = await border('ai');
    await expect.poll(() => border('web')).not.toBe(off);
  });

  test('while the galaxy comes in and goes out, no chapter takes the mouse from a live label', async ({
    page,
    browserName,
  }) => {
    // Cada paso espera a que la escena se quede quieta (`labelsStill`): en WebKit sin GPU, varios segundos por paso.
    test.slow(browserName === 'webkit', 'WebKit without a GPU paints few frames per second in CI');
    await openSkills(page);
    const viewportHeight = DESKTOP.height;
    const { top, bottom } = await page.evaluate(() => {
      const rect = document.getElementById('skills')?.getBoundingClientRect();
      if (rect === undefined) throw new Error('No #skills');
      return { top: rect.top + window.scrollY, bottom: rect.bottom + window.scrollY };
    });
    let checked = 0;
    // De About entrando (la galaxia aún abajo) a Projects entrando (la galaxia saliendo), a cuartos de pantalla.
    for (let y = top - viewportHeight; y <= bottom; y += viewportHeight / 4) {
      await page.evaluate((to) => {
        window.scrollTo({ top: to, behavior: 'instant' });
      }, y);
      await labelsStill(page);
      checked += await page.locator('[data-constellation-labels] [data-live]').count();
      expect(await liveLabelsTakenByAChapter(page), `scrolled to ${String(Math.round(y))}`).toEqual(
        [],
      );
    }
    expect(checked).toBeGreaterThan(0);
  });

  test.describe('on a touch screen', () => {
    test.use({ hasTouch: true });

    test('a tap lights a group, another switches, a label lights its own, a tap outside turns it off', async ({
      page,
    }) => {
      await openSkills(page);
      await panelGroup(page, 'web').tap();
      await expectLit(page, 'web');
      await panelGroup(page, 'ai').tap();
      await expectLit(page, 'ai');
      await starLabel(page, 'git').tap();
      await expectLit(page, 'tools');
      await page.locator('#skills-title').tap();
      await expectLit(page, null);
      // El «fuera» de verdad en el móvil: la escena, al margen del panel (cae en la página, no en un elemento).
      await panelGroup(page, 'web').tap();
      await expectLit(page, 'web');
      await page.touchscreen.tap(4, DESKTOP.height / 2);
      await expectLit(page, null);
    });
  });

  for (const path of ['/', '/es']) {
    for (const viewport of [
      { width: 1280, height: 720 },
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      test(`${path} at ${String(viewport.width)}×${String(viewport.height)}, the labels shown never overlap each other, the interface or the edges`, async ({
        page,
      }) => {
        await openSkills(page, viewport, path);
        const labels = await shownLabels(page);
        expect(labels.length).toBeGreaterThan(0);
        if (await isWide(page)) {
          // En reposo, en escritorio, se ven todas (02-galaxia.md → «Layout»).
          expect(labels).toHaveLength(skillGroups.flatMap((group) => group.skills).length);
        }
        const canvas = await canvasSize(page);
        const ui = await interfaceRects(page);
        expectInterface(ui, viewport.width);
        const zones = [
          ['bar', ui.bar],
          ['rail', ui.rail],
          ['HUD', ui.hud],
          ['panel', ui.panel],
        ] as const;
        for (const [index, { id, rect }] of labels.entries()) {
          expect(rect[0], `${id}: left edge`).toBeGreaterThanOrEqual(0);
          expect(rect[1], `${id}: top edge`).toBeGreaterThanOrEqual(0);
          expect(rect[2], `${id}: right edge`).toBeLessThanOrEqual(canvas.width);
          expect(rect[3], `${id}: bottom edge`).toBeLessThanOrEqual(canvas.height);
          for (const [name, zone] of zones) {
            if (zone !== null) expect(overlaps(rect, zone), `${id} over the ${name}`).toBe(false);
          }
          for (const other of labels.slice(index + 1)) {
            expect(overlaps(rect, other.rect), `${id} over ${other.id}`).toBe(false);
          }
        }
      });
    }
  }

  for (const path of ['/', '/es']) {
    for (const viewport of [
      { width: 1280, height: 720 },
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
      { width: 844, height: 390 },
      { width: 800, height: 360 },
    ]) {
      test(`${path} at ${String(viewport.width)}×${String(viewport.height)}: the real interface fits what the scene keeps the labels away from`, async ({
        page,
      }) => {
        await openSkills(page, viewport, path);
        const canvas = await canvasSize(page);
        const ui = await interfaceRects(page);
        expectInterface(ui, viewport.width);
        const keep = (await isWide(page)) ? STAR_LABEL_KEEP_OUT.wide : STAR_LABEL_KEEP_OUT.narrow;
        const { bar, rail, hud: hudRect, panel } = ui;
        if (bar === null || rail === null || panel === null)
          throw new Error('No bar, rail or panel');
        expect(bar[3]).toBeLessThanOrEqual(keep.barBottom);
        expect(canvas.width - rail[0], 'rail width').toBeLessThanOrEqual(keep.rail.fromRight);
        // El raíl de verdad cabe en la zona que la escena le guarda (la misma cuenta que usa: `keepOutZones`, sin su
        // margen), también cuando sus paradas encogen y baja bajo la barra (un móvil apaisado).
        const { marginPx } = STAR_LABEL_KEEP_OUT;
        const railZone = keepOutZones(canvas.width, canvas.height, await isWide(page)).find(
          ({ name }) => name === 'rail',
        )?.rect;
        if (railZone === undefined) throw new Error('No rail zone');
        expect(rail[0], 'rail left edge').toBeGreaterThanOrEqual(railZone[0] + marginPx - 0.5);
        expect(rail[1], 'rail top').toBeGreaterThanOrEqual(railZone[1] + marginPx - 0.5);
        expect(rail[3], 'rail bottom').toBeLessThanOrEqual(railZone[3] - marginPx + 0.5);
        if (hudRect !== null) {
          expect(canvas.height - hudRect[1], 'HUD height').toBeLessThanOrEqual(keep.hud.fromBottom);
          if ('fromRight' in keep.hud) {
            expect(canvas.width - hudRect[0], 'HUD width').toBeLessThanOrEqual(keep.hud.fromRight);
          } else {
            expect(hudRect[2], 'HUD width').toBeLessThanOrEqual(keep.hud.fromLeft);
          }
        }
        if ('panelRight' in keep) {
          expect(panel[2], 'panel').toBeLessThanOrEqual(keep.panelRight);
        }
      });
    }
  }

  test.describe('on a touch screen, through the browser history', () => {
    test.use({ hasTouch: true });

    test('a group lit when the journey goes away (Forward to a project) is off when it comes back', async ({
      page,
    }) => {
      const errors = collectErrors(page);
      /** De vuelta en el viaje (misma página, sin recargar): a `#skills`, con las etiquetas en su sitio. */
      const backToSkills = async (): Promise<void> => {
        await expect(page).toHaveURL(/\/(?:#skills)?$/);
        await page.locator('#skills').waitFor();
        await page.evaluate(() => {
          document.getElementById('skills')?.scrollIntoView({ behavior: 'instant' });
        });
        // La escena tarda en volver a su sitio (su `m` va suavizada).
        await expect(page.locator('[data-constellation-labels] [data-live]').first()).toBeVisible({
          timeout: 10_000,
        });
      };
      /** Sigue siendo el mismo documento: el viaje se desmonta y se monta, no se recarga ni vuelve de la caché. */
      const sameDocument = async (): Promise<void> => {
        expect(await page.evaluate(() => 'cosmosSameDocument' in window)).toBe(true);
      };
      await openSkills(page);
      await page.evaluate(() => {
        Object.assign(window, { cosmosSameDocument: true });
      });
      // Una ficha en el historial (navegación dentro de la página) y de vuelta: así hay un «Adelante».
      const view = page.getByRole('link', { name: 'View project Chessmate' });
      await view.scrollIntoViewIfNeeded();
      await view.tap();
      await expect(page).toHaveURL(/\/projects\/chessmate$/);
      await sameDocument();
      await page.goBack();
      await backToSkills();
      // Un toque enciende y deja encendido (no hay `pointerleave` de ratón); el historial no es un gesto.
      await panelGroup(page, 'web').tap();
      await expectLit(page, 'web');
      await page.goForward();
      await expect(page).toHaveURL(/\/projects\/chessmate$/);
      await expect(page.locator('[data-constellation-labels]')).toHaveCount(0);
      // WebKit deja un ratón simulado donde fue el toque: al volver, el grupo nuevo nacería debajo y el navegador le
      // daría un `pointerenter` de ratón (lo encendería un gesto, no el historial). Se aparta en la ficha.
      await page.mouse.move(4, DESKTOP.height / 2);
      await page.goBack();
      await backToSkills();
      await sameDocument();
      await expectLit(page, null);
      expect(errors).toEqual([]);
    });
  });
});

test('without WebGL the groups of the panel stay out of the Tab order and light nothing', async ({
  page,
}) => {
  await withoutWebGL(page);
  await page.goto('/#skills', { waitUntil: 'networkidle' });
  await settleScene(page);
  for (const { id } of skillGroups) {
    await expect(panelGroup(page, id)).not.toHaveAttribute('tabindex');
    await panelGroup(page, id).hover();
    await expect(panelGroup(page, id)).not.toHaveAttribute('data-hot');
  }
  await expect(page.locator('[data-constellation-labels]')).toHaveCount(0);
});
