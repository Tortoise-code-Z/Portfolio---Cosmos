import { expect, test, type Page } from '@playwright/test';

/**
 * El viaje sin escena (F2 · paso 4): capítulos, anclas, detonación, encuadre y lectura sin JS.
 * Detalle en docs/02-experiencia/ (README y capitulos/) y docs/03-diseno/componentes.md.
 */

/** Recoge los errores de consola para exigir «0 errores» (métrica del brief). */
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

const CHAPTERS = {
  en: [
    ['about', 'A star born from curiosity'],
    ['skills', 'My galaxy of tools'],
    ['projects', 'What I carry on my shell'],
    ['contact', 'Touchdown'],
  ],
  es: [
    ['about', 'Una estrella que nace de la curiosidad'],
    ['skills', 'Mi galaxia de herramientas'],
    ['projects', 'Lo que llevo a cuestas'],
    ['contact', 'Aterrizaje'],
  ],
} as const;

/** Tamaños de referencia de docs/02-experiencia (encuadre y solapes). */
const REFERENCE_VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
] as const;

const offsetTop = (page: Page, id: string): Promise<number> =>
  page.evaluate((anchor) => document.getElementById(anchor)?.offsetTop ?? -1, id);

test.describe('the journey (home)', () => {
  for (const [path, locale] of [
    ['/', 'en'],
    ['/es', 'es'],
  ] as const) {
    test(`${path}: one h1, the four chapters in order and no console errors`, async ({ page }) => {
      const errors = collectConsoleErrors(page);
      await page.goto(path, { waitUntil: 'networkidle' });
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Víctor Pérez');
      await expect(page.getByRole('heading', { level: 2 })).toHaveText(
        CHAPTERS[locale].map(([, title]) => title),
      );
      for (const [id, title] of CHAPTERS[locale]) {
        await expect(page.getByRole('region', { name: title })).toHaveAttribute('id', id);
      }
      expect(errors).toEqual([]);
    });
  }

  test('a chapter link (/#projects) lands on its chapter', async ({ page }) => {
    await page.goto('/#projects', { waitUntil: 'networkidle' });
    await expect
      .poll(async () => Math.abs((await page.locator('#projects').boundingBox())?.y ?? 99))
      .toBeLessThanOrEqual(2);
  });

  test('holding the button 1.5 s travels to About; back at the top it re-arms', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const button = page.getByRole('button', { name: 'Hold to detonate' });
    await button.focus();
    await page.keyboard.down('Space');
    await page.waitForTimeout(1_700);
    await page.keyboard.up('Space');
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    const about = await offsetTop(page, 'about');
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(about);

    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await expect(button).not.toHaveAttribute('aria-disabled');
  });

  test('a short click does not detonate', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Hold to detonate' }).click();
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('with reduced motion the jump to About is instant', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'networkidle' });
    const button = page.getByRole('button', { name: 'Hold to detonate' });
    const box = await button.boundingBox();
    if (box === null) throw new Error('Hold button not rendered');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    // En el frame en que detona ya está en About: sin animación de scroll.
    const atDetonation = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          const target = document.querySelector('[aria-describedby]');
          new MutationObserver(() => {
            resolve(window.scrollY);
          }).observe(target ?? document.body, { attributeFilter: ['aria-disabled'] });
        }),
    );
    await page.mouse.up();
    expect(atDetonation).toBe(await offsetTop(page, 'about'));
  });

  for (const viewport of REFERENCE_VIEWPORTS) {
    test(`${String(viewport.width)}×${String(viewport.height)}: no horizontal scroll and the name never covers the singularity`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto('/', { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const layout = await page.evaluate(() => {
        const core = document.querySelector('[aria-hidden="true"] > span:last-child');
        const lines = [...document.querySelectorAll('h1 > span')];
        const coreBox = core?.getBoundingClientRect();
        const overlaps = lines.some((line) => {
          const range = document.createRange();
          range.selectNodeContents(line);
          const box = range.getBoundingClientRect();
          return (
            coreBox !== undefined &&
            box.left < coreBox.right &&
            box.right > coreBox.left &&
            box.top < coreBox.bottom &&
            box.bottom > coreBox.top
          );
        });
        return {
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          hasCore: coreBox !== undefined && coreBox.width > 0,
          overlaps,
        };
      });
      expect(layout.overflow).toBeLessThanOrEqual(0);
      expect(layout.hasCore).toBe(true);
      expect(layout.overlaps).toBe(false);
    });
  }

  test('1280×720: every focusable element of the journey comes into view with Tab', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === 'webkit', 'Safari only tabs to links with a system setting on');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/', { waitUntil: 'networkidle' });
    const total = await page.locator('main a[href], main button').count();
    const hidden: string[] = [];
    for (let index = 0; index < total; index += 1) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const element = document.activeElement;
        if (element === null || element === document.body) return null;
        const box = element.getBoundingClientRect();
        return {
          name: element.textContent.trim(),
          // Medio píxel de margen: las cajas tienen decimales.
          visible: box.top >= -0.5 && box.bottom <= window.innerHeight + 0.5,
        };
      });
      if (focused === null) break;
      if (!focused.visible) hidden.push(focused.name);
    }
    expect(hidden).toEqual([]);
  });

  test('external links open in a new tab with rel="noopener noreferrer"', async ({ page }) => {
    await page.goto('/');
    const external = page.locator('main a[target="_blank"]');
    expect(await external.count()).toBeGreaterThan(0);
    for (const link of await external.all()) {
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  test('loading the hero with slow fonts keeps CLS under 0.1', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Layout shift entries and network throttling: Chromium');
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: 200 * 1024,
      uploadThroughput: 100 * 1024,
    });
    await page.addInitScript(() => {
      const store = window as unknown as { __cls: number };
      store.__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & {
          value: number;
          hadRecentInput: boolean;
        })[]) {
          if (!entry.hadRecentInput) store.__cls += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    expect(cls).toBeLessThan(0.1);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the whole journey is readable from the pre-rendered HTML (P1)', async ({ page }) => {
    await page.goto('/es');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Víctor Pérez');
    await expect(page.getByRole('heading', { level: 2 })).toHaveText(
      CHAPTERS.es.map(([, title]) => title),
    );
    await expect(page.getByRole('link', { name: 'Ver proyecto Chessmate' })).toHaveAttribute(
      'href',
      '/es/projects/chessmate',
    );
    await expect(
      page.getByRole('link', { name: 'victorperez.brmte@passmail.com' }),
    ).toHaveAttribute('href', 'mailto:victorperez.brmte@passmail.com');
  });

  test('the dark background does not depend on JavaScript (P1)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(4, 5, 11)');
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
  });
});
