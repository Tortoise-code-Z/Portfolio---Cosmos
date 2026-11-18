import { expect, type Locator, type Page } from '@playwright/test';

import { skillGroups } from '../../src/content/skills.ts';
import type { SkillGroupId } from '../../src/content/types.ts';
import { STAR_LABEL_KEEP_OUT } from '../../src/scene/config/constellationLayout/constellationLayout.ts';
import { SHAPES_WORKER_TIMEOUT_MS } from '../../src/scene/worker/loadShapes/loadShapes.ts';
import {
  browserHasWebGL2,
  collectErrors,
  hud,
  PARTICLES_PAINTED,
  settleScene,
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
  let previous = '';
  await expect
    .poll(async () => {
      const now = JSON.stringify(await shownLabels(page));
      const still = now === previous;
      previous = now;
      return still;
    })
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

/** El lienzo de la escena (sin la barra de scroll), al que se refieren las zonas de `STAR_LABEL_KEEP_OUT`. */
async function canvasSize(page: Page): Promise<Viewport> {
  const box = await page.locator('canvas').boundingBox();
  if (box === null) throw new Error('No canvas');
  return { width: box.width, height: box.height };
}

test.describe('the constellations of Skills', () => {
  test.beforeEach(async ({ page, browserName }) => {
    await page.goto('/');
    const hasWebGL2 = await browserHasWebGL2(page);
    // Chromium siempre lo tiene (SwiftShader sin GPU): si faltara, estos tests no deben saltarse en silencio.
    if (browserName === 'chromium') expect(hasWebGL2, 'Chromium must have WebGL2').toBe(true);
    test.skip(!hasWebGL2, 'This browser has no WebGL2 here');
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
    });
  });

  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    test(`at ${String(viewport.width)}×${String(viewport.height)}, the labels shown never overlap each other, the interface or the edges`, async ({
      page,
    }) => {
      await openSkills(page, viewport);
      const labels = await shownLabels(page);
      expect(labels.length).toBeGreaterThan(0);
      if (viewport.width >= 900) {
        // En reposo, en escritorio, se ven todas (02-galaxia.md → «Layout»).
        expect(labels).toHaveLength(skillGroups.flatMap((group) => group.skills).length);
      }
      const canvas = await canvasSize(page);
      const ui = await interfaceRects(page);
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

  for (const path of ['/', '/es']) {
    for (const viewport of [
      { width: 1280, height: 720 },
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
    ]) {
      test(`${path} at ${String(viewport.width)}×${String(viewport.height)}: the real interface fits what the scene keeps the labels away from`, async ({
        page,
      }) => {
        await openSkills(page, viewport, path);
        const canvas = await canvasSize(page);
        const ui = await interfaceRects(page);
        const wide = viewport.width >= 900;
        const keep = wide ? STAR_LABEL_KEEP_OUT.wide : STAR_LABEL_KEEP_OUT.narrow;
        const { bar, rail, hud: hudRect, panel } = ui;
        if (bar === null || rail === null) throw new Error('No bar or rail');
        expect(bar[3]).toBeLessThanOrEqual(keep.barBottom);
        expect(canvas.width - rail[0], 'rail width').toBeLessThanOrEqual(keep.rail.fromRight);
        expect(canvas.height / 2 - rail[1], 'rail above the middle').toBeLessThanOrEqual(
          keep.rail.halfHeight,
        );
        expect(rail[3] - canvas.height / 2, 'rail below the middle').toBeLessThanOrEqual(
          keep.rail.halfHeight,
        );
        if (hudRect !== null) {
          expect(canvas.height - hudRect[1], 'HUD height').toBeLessThanOrEqual(keep.hud.fromBottom);
          if ('fromRight' in keep.hud) {
            expect(canvas.width - hudRect[0], 'HUD width').toBeLessThanOrEqual(keep.hud.fromRight);
          } else {
            expect(hudRect[2], 'HUD width').toBeLessThanOrEqual(keep.hud.fromLeft);
          }
        }
        if ('panelRight' in keep && panel !== null) {
          expect(panel[2], 'panel').toBeLessThanOrEqual(keep.panelRight);
        }
      });
    }
  }

  test('quick mission → a project → Back: the labels are there again, and none is lit', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await openSkills(page);
    await panelGroup(page, 'web').hover();
    await expectLit(page, 'web');
    await page.getByRole('banner').getByRole('button', { name: 'Quick mission' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('link', { name: 'View project Chessmate' }).click();
    await expect(page).toHaveURL(/\/projects\/chessmate$/);
    await expect(page.locator('[data-constellation-labels]')).toHaveCount(0);
    await page.goBack();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Close quick mission' }).click();
    // La misma página (sin recargar): el viaje vuelve a montarse y la escena sigue la de antes.
    await page.evaluate(() => {
      document.getElementById('skills')?.scrollIntoView({ behavior: 'instant' });
    });
    // Cualquiera: la escena tarda en volver a su sitio (su `m` va suavizada) y la más alta es la última en caber.
    await expect(page.locator('[data-constellation-labels] [data-live]').first()).toBeVisible({
      timeout: 10_000,
    });
    await expectLit(page, null);
    expect(errors).toEqual([]);
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
