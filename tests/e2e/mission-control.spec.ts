import { expect, type Page } from '@playwright/test';

import { collectTelemetry } from '../../scripts/siteTelemetry.ts';
import { collectErrors, hud, settleScene, withoutWebGL } from './support/helpers.ts';
import { test } from './support/test.ts';

/**
 * El segundo interludio, Mission control (fase C · C.4; docs/02-experiencia/capitulos/interludio-2-mission-control.md):
 * cómo trabaja Víctor, como una transmisión entre Projects y Contact. Mientras se lee, la tortuga se queda quieta (el
 * reloj del HUD, en el tiempo mítico) y el raíl marca su rombo; «Skip transmission» y «Touchdown» llevan a Contact; las
 * cifras de la telemetría son las del repo; se lee sin WebGL, con movimiento reducido y a 390 px.
 */

const transmission = (page: Page) => page.locator('[data-interlude="mission-control"]');
const rail = (page: Page) => page.getByRole('navigation', { name: /^(?:Chapters|Capítulos)$/ });

/** El `clip-path` calculado de cada línea del teletipo (`none` o `inset(0px)` si se ve entera). */
const lineClips = (page: Page): Promise<string[]> =>
  transmission(page)
    .locator('[data-line]')
    .evaluateAll((lines) => lines.map((line) => getComputedStyle(line).clipPath));

test.describe('Mission control', () => {
  test('/#mission-control lands on it: its title under the bar, the rail on its diamond and the turtle still', async ({
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

  test('the telemetry is the repo of this deploy: the tests, browsers and decisions counted from the code', async ({
    page,
  }) => {
    const counted = collectTelemetry(process.cwd(), new Date());
    await page.goto('/#mission-control', { waitUntil: 'networkidle' });
    const figures = transmission(page).getByRole('region', { name: /^Telemetry · this site · / });
    await expect(figures.getByRole('definition')).toHaveText([
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

  test('after its tail the Earth is formed: Contact arrives at its rest and the rail moves on', async ({
    page,
  }) => {
    await page.goto('/#contact', { waitUntil: 'networkidle' });
    await expect(rail(page).locator('[aria-current="step"]')).toHaveAccessibleName(
      'Contact · Earth',
    );
    await expect(hud(page)).not.toContainText('mythic time');
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

  test('390 px: no sideways scroll, nothing cut, and «Touchdown» is a 44 px target', async ({
    page,
  }) => {
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

  test('390 px with text at 200 %: the steps and the telemetry wrap instead of being cut', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#mission-control', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    const cut = await transmission(page)
      .locator('li, dd, dt, p')
      .evaluateAll((elements) =>
        elements
          .filter((element) => element.scrollWidth > element.clientWidth)
          .map((element) => element.textContent.slice(0, 40)),
      );
    expect(cut).toEqual([]);
  });

  test('with reduced motion nothing is held back: every line is there, no sweep and no teletype', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#mission-control', { waitUntil: 'networkidle' });
    await settleScene(page);
    await expect(transmission(page)).not.toHaveAttribute('data-armed');
    expect(new Set(await lineClips(page))).toEqual(new Set(['none']));
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
      .poll(async () => (await lineClips(page)).every((clip) => clip === 'inset(0px)'))
      .toBe(true);
  });

  test('without WebGL it reads whole, over the still photo of the turtle', async ({ page }) => {
    await withoutWebGL(page);
    await page.goto('/#mission-control', { waitUntil: 'networkidle' });
    const region = page.getByRole('region', { name: 'How I work' });
    await expect(region.getByText('Co-pilot: Claude Code with skills I wrote')).toBeVisible();
    await expect
      .poll(async () =>
        (await lineClips(page)).every((clip) => clip === 'none' || clip === 'inset(0px)'),
      )
      .toBe(true);
    await expect(page.locator('[data-scene-stills] img[data-still-chapter="3"]')).toHaveAttribute(
      'data-visible',
      'true',
    );
  });
});
