import { fileURLToPath } from 'node:url';

import { expect, type Page } from '@playwright/test';

import { collectTelemetry, monthOf } from '../../scripts/siteTelemetry.ts';
import { formatMonth } from '../../src/lib/i18n/format/format.ts';
import {
  brokenWords,
  collectErrors,
  hud,
  lineClips,
  settleScene,
  TELETYPE_WRITTEN,
  withoutWebGL,
} from './support/helpers.ts';
import { test } from './support/test.ts';

/**
 * El segundo interludio, Mission control (fase C · C.4; docs/02-experiencia/capitulos/interludio-2-mission-control.md):
 * cómo trabaja Víctor, como una transmisión entre Projects y Contact. Mientras se lee, la tortuga se queda quieta (el
 * reloj del HUD, en el tiempo mítico) y el raíl marca su rombo; «Skip transmission» y «Touchdown» llevan a Contact; las
 * cifras de la telemetría son las del repo; se lee sin WebGL, con movimiento reducido y a 390 px.
 */

const transmission = (page: Page) => page.locator('[data-interlude="mission-control"]');
const rail = (page: Page) => page.getByRole('navigation', { name: /^(?:Chapters|Capítulos)$/ });

/** La raíz del repo: la misma que lee el build (vite.config.ts), no la carpeta desde la que se lanza el e2e. */
const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));

/** Partida, una cifra o el «T-0» ocupa más de un renglón: su alto pasa de su interlineado. */
const onSeveralLines = (page: Page): Promise<(string | null)[]> =>
  transmission(page)
    .locator('dd, h2 [aria-hidden] > *')
    .evaluateAll((elements) =>
      elements
        .filter((element) => {
          const style = getComputedStyle(element);
          const lineHeight =
            style.lineHeight === 'normal'
              ? Number.parseFloat(style.fontSize) * 1.2
              : Number.parseFloat(style.lineHeight);
          return element.getBoundingClientRect().height > lineHeight * 1.5;
        })
        .map((element) => element.textContent),
    );

test.describe('Mission control', () => {
  // Que la tortuga se quede quieta en su pantalla lo fija `content.test.ts` (JOURNEY_SEGMENTS) y `journey.test.tsx`
  // (la `m` = 3 tramo a tramo); aquí se mira lo que se ve: el raíl y el reloj del HUD.
  test('/#mission-control lands on it: its title under the bar, the rail on its diamond and the clock stopped in mythic time', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto('/#mission-control', { waitUntil: 'networkidle' });
    await expect(page.getByRole('region', { name: 'How I work' })).toBeInViewport();
    const [title, bar] = await Promise.all([
      page.getByRole('heading', { level: 2, name: 'How I work' }).boundingBox(),
      page.getByRole('banner').boundingBox(),
    ]);
    expect(title?.y ?? 0).toBeGreaterThanOrEqual((bar?.y ?? 0) + (bar?.height ?? 0));
    await expect(rail(page).locator('[aria-current="step"]')).toHaveAccessibleName(
      'Mission control · transmission',
    );
    // El HUD se esconde (el pie ya dice el reloj parado) y, por debajo, sigue en la tortuga.
    await expect(hud(page)).toHaveAttribute('data-hidden', '');
    await expect(hud(page)).toContainText('mythic time');
    await expect(transmission(page)).toContainText('t = mythic time · cosmic clock paused');
    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.move(640, 360);
    await page.mouse.wheel(0, 400);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 300);
    await expect(rail(page).locator('[aria-current="step"]')).toHaveAccessibleName(
      'Mission control · transmission',
    );
    await expect(hud(page)).toContainText('mythic time');
    expect(errors).toEqual([]);
  });

  test('the telemetry is the repo of this deploy: the tests, browsers, decisions and month counted from the code', async ({
    page,
  }) => {
    const now = new Date();
    const counted = collectTelemetry(REPO_ROOT, now);
    // El mes del build: este, o el anterior si el build cayó al otro lado de un cambio de mes.
    const lastMonth = monthOf(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)));
    await page.goto('/#mission-control', { waitUntil: 'networkidle' });
    const heading = transmission(page).getByRole('heading', { level: 3, name: /^Telemetry/ });
    await expect(heading).toHaveText(
      new RegExp(
        `^Telemetry · this site · (?:${formatMonth('en', counted.month)}|${formatMonth('en', lastMonth)})$`,
      ),
    );
    const figures = transmission(page).getByRole('region', { name: /^Telemetry · this site · / });
    await expect(
      figures.getByRole('definition'),
      '¿npm run build tras cambiar tests, ci.yml o DECISIONS.md? El e2e cuenta el repo de ahora.',
    ).toHaveText([
      counted.unitTests.toLocaleString('en'),
      counted.e2eTests.toLocaleString('en'),
      String(counted.browsers.length),
      counted.decisions.toLocaleString('en'),
    ]);
    await expect(transmission(page)).toContainText(
      'Checks green in Chromium, Firefox, and WebKit.',
    );
  });

  test('the launch sequence reads in order as a list, T-4 to T-0', async ({ page }) => {
    await page.goto('/#mission-control', { waitUntil: 'networkidle' });
    const steps = transmission(page)
      .getByRole('list', { name: 'Schematic · launch sequence' })
      .getByRole('listitem');
    await expect(steps).toHaveCount(5);
    await expect(steps.first()).toContainText('T-4');
    await expect(steps.last()).toContainText('T-0');
  });

  test('the transmission takes the pointer: the plates behind it do not get it; its tail lets it through', async ({
    page,
  }) => {
    await page.goto('/#mission-control', { waitUntil: 'networkidle' });
    const inside = await page.evaluate(() => {
      const hit = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      return document.querySelector('[data-interlude="mission-control"]')?.contains(hit) ?? false;
    });
    expect(inside).toBe(true);
    await expect(page.locator('[data-interlude-tail="mission-control"]')).toHaveCSS(
      'pointer-events',
      'none',
    );
  });

  for (const path of ['/', '/es']) {
    test(`${path} at 1280×720: no text of the transmission goes under the rail`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto(`${path}#mission-control`, { waitUntil: 'networkidle' });
      const railBox = await rail(page).boundingBox();
      const under = await transmission(page)
        .locator('h2, p, dd, dt, li, h3, a')
        .evaluateAll(
          (elements, railLeft) =>
            elements
              .filter((element) => element.getBoundingClientRect().right > railLeft)
              .map((element) => element.textContent.slice(0, 40)),
          railBox?.x ?? 0,
        );
      expect(under).toEqual([]);
    });
  }

  test('switching language while reading it stays on it (not on Projects)', async ({ page }) => {
    await page.goto('/#mission-control', { waitUntil: 'networkidle' });
    await expect(rail(page).locator('[aria-current="step"]')).toHaveAccessibleName(
      'Mission control · transmission',
    );
    await page
      .getByRole('group', { name: 'Language' })
      .getByRole('link', { name: 'Español' })
      .click();
    await expect(page).toHaveURL(/\/es#mission-control$/);
    await expect(page.getByRole('region', { name: 'Cómo trabajo' })).toBeInViewport();
    await expect(rail(page).locator('[aria-current="step"]')).toHaveAccessibleName(
      'Control de misión · transmisión',
    );
  });

  test('Contact arrives after the tail: the rail and the clock move on', async ({ page }) => {
    await page.goto('/#contact', { waitUntil: 'networkidle' });
    await expect(rail(page).locator('[aria-current="step"]')).toHaveAccessibleName(
      'Contact · Earth',
    );
    await expect(hud(page)).toContainText('13.8 billion years');
  });

  for (const name of ['Skip transmission', 'Touchdown · Contact']) {
    test(`«${name}» with the keyboard goes to Contact, with the focus on its title`, async ({
      page,
    }) => {
      await page.goto('/#mission-control', { waitUntil: 'networkidle' });
      const link = transmission(page).getByRole('link', { name });
      await expect(link).toHaveAttribute('href', '/#contact');
      await link.focus();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('heading', { level: 2, name: 'Touchdown' })).toBeFocused();
      await expect(page).toHaveURL(/#contact$/);
    });
  }

  test('the diamond of the rail travels to it, with the focus on its title', async ({ page }) => {
    await page.goto('/#projects', { waitUntil: 'networkidle' });
    await rail(page).getByRole('link', { name: 'Mission control · transmission' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'How I work' })).toBeFocused();
    await expect(page).toHaveURL(/#mission-control$/);
  });

  test('390 px: no sideways scroll and a 44 px «Touchdown»', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#mission-control', { waitUntil: 'networkidle' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
    const box = await transmission(page)
      .getByRole('link', { name: 'Touchdown · Contact' })
      .boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  for (const width of [360, 390]) {
    for (const path of ['/', '/es']) {
      test(`${path} at ${String(width)} px with text at 200 %: nothing is cut, and the «T-0» and each figure stay on one line`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(`${path}#mission-control`, { waitUntil: 'networkidle' });
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '200%';
        });
        const cut = await transmission(page)
          .locator('h2, h3, li, dd, dt, p, a')
          .evaluateAll((elements) =>
            elements
              .filter((element) => element.scrollWidth > element.clientWidth)
              .map((element) => element.textContent.slice(0, 40)),
          );
        expect(cut).toEqual([]);
        expect(await onSeveralLines(page)).toEqual([]);
      });
    }
  }

  for (const path of ['/', '/es']) {
    test(`${path} at 1280×800 with text at 200 %: the «T-0» and each figure stay on one line`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`${path}#mission-control`, { waitUntil: 'networkidle' });
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      expect(await onSeveralLines(page)).toEqual([]);
    });

    test(`${path} at 1024×768 (between md and lg): no word of the sequence or the telemetry is split in two`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.goto(`${path}#mission-control`, { waitUntil: 'networkidle' });
      expect(await brokenWords(transmission(page))).toEqual([]);
    });
  }

  test('with reduced motion nothing is held back: every line is there, no sweep and no teletype', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#mission-control', { waitUntil: 'networkidle' });
    await settleScene(page);
    await expect(transmission(page)).not.toHaveAttribute('data-armed');
    expect(new Set(await lineClips(transmission(page)))).toEqual(new Set(['none']));
    await expect(transmission(page).locator('[class*="cursor"]')).toHaveCSS(
      'animation-name',
      'none',
    );
  });

  test('with motion, it switches on when it comes into view and the countdown ends with every step written', async ({
    page,
  }) => {
    await page.goto('/#projects', { waitUntil: 'networkidle' });
    await expect(transmission(page)).toHaveAttribute('data-armed', '');
    await expect(transmission(page)).not.toHaveAttribute('data-on');
    await transmission(page).scrollIntoViewIfNeeded();
    await expect(transmission(page)).toHaveAttribute('data-on', '');
    await expect
      .poll(async () =>
        (await lineClips(transmission(page))).every((clip) => clip === TELETYPE_WRITTEN),
      )
      .toBe(true);
    // Encendida, si se pide movimiento reducido el cursor deja de parpadear (su guarda de CSS).
    const cursor = transmission(page).locator('[class*="cursor"]');
    await expect(cursor).not.toHaveCSS('animation-name', 'none');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(cursor).toHaveCSS('animation-name', 'none');
  });

  test('without WebGL it reads whole, over the still photo of the turtle', async ({ page }) => {
    await withoutWebGL(page);
    await page.goto('/#mission-control', { waitUntil: 'networkidle' });
    const region = page.getByRole('region', { name: 'How I work' });
    await expect(region.getByText('Co-pilot: Claude Code with skills I wrote')).toBeVisible();
    await expect
      .poll(async () =>
        (await lineClips(transmission(page))).every(
          (clip) => clip === 'none' || clip === TELETYPE_WRITTEN,
        ),
      )
      .toBe(true);
    await expect(page.locator('[data-scene-stills] img[data-still-chapter="3"]')).toHaveAttribute(
      'data-visible',
      'true',
    );
  });
});
