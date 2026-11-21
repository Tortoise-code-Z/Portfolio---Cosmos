import { expect, type Page } from '@playwright/test';

import { test } from './support/test.ts';

import {
  browserHasWebGL2,
  collectErrors,
  PARTICLES_PAINTED,
  settleScene,
  withoutWebGL,
} from './support/helpers.ts';

/**
 * El viaje sin escena (F2 · paso 4): capítulos, anclas, detonación, encuadre y lectura sin JS.
 * Detalle en docs/02-experiencia/ (README y capitulos/) y docs/03-diseno/componentes.md.
 */

/**
 * Cuánto se espera a que una carga mantenida detone. La carga avanza como mucho 0,1 s por frame
 * (`HOLD_MAX_STEP_SECONDS`), así que pide 15 frames: WebKit sin GPU en el CI puede ir a unos 3 fps con la página
 * entera (C.2: se quedó en 0,93, 14 frames en 5 s). La duración exacta la vigila `charge.test.ts`.
 */
const DETONATE_TIMEOUT_MS = 15_000;

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

/** Los títulos `h2` del viaje en orden: los capítulos y, tras About, el Mission log (fase C). */
const HEADINGS = {
  en: [
    'A star born from curiosity',
    'Mission 01',
    'My galaxy of tools',
    'What I carry on my shell',
    'Touchdown',
  ],
  es: [
    'Una estrella que nace de la curiosidad',
    'Misión 01',
    'Mi galaxia de herramientas',
    'Lo que llevo a cuestas',
    'Aterrizaje',
  ],
} as const;

/** Tamaños de referencia de docs/02-experiencia (encuadre y solapes). */
const REFERENCE_VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
] as const;

/** Scroll en el que un capítulo queda justo bajo la barra fija (`scroll-padding-block-start`). */
const landingY = (page: Page, id: string): Promise<number> =>
  page.evaluate((anchor) => {
    const top = document.getElementById(anchor)?.offsetTop ?? -1;
    const bar = Number.parseFloat(
      getComputedStyle(document.documentElement).scrollPaddingBlockStart,
    );
    return top - bar;
  }, id);

/** Alto que tapa la barra fija arriba. */
const barHeight = (page: Page): Promise<number> =>
  page.evaluate(() =>
    Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingBlockStart),
  );

test.describe('the journey (home)', () => {
  for (const [path, locale] of [
    ['/', 'en'],
    ['/es', 'es'],
  ] as const) {
    test(`${path}: one h1, the four chapters and the Mission log in order, and no console errors`, async ({
      page,
    }) => {
      const errors = collectErrors(page);
      await page.goto(path, { waitUntil: 'networkidle' });
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Víctor Pérez');
      await expect(page.getByRole('heading', { level: 2 })).toHaveText(HEADINGS[locale]);
      await expect(page.getByRole('region', { name: HEADINGS[locale][1] })).toHaveAttribute(
        'id',
        'mission-log',
      );
      for (const [id, title] of CHAPTERS[locale]) {
        await expect(page.getByRole('region', { name: title })).toHaveAttribute('id', id);
      }
      expect(errors).toEqual([]);
    });
  }

  test('a chapter link (/#projects) lands on its chapter, just below the top bar', async ({
    page,
  }) => {
    await page.goto('/#projects', { waitUntil: 'networkidle' });
    const bar = await barHeight(page);
    expect(bar).toBeGreaterThan(0);
    await expect
      .poll(async () => Math.abs(((await page.locator('#projects').boundingBox())?.y ?? 99) - bar))
      .toBeLessThanOrEqual(2);
  });

  test('holding the button 1.5 s travels to About; back at the top it re-arms', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const button = page.getByRole('button', { name: 'Hold to detonate' });
    await button.focus();
    // Se mantiene hasta ver el resultado: la duración exacta la vigila charge.test.ts y un CI lento
    // no suelta antes de tiempo.
    await page.keyboard.down('Space');
    await expect(button).toHaveAttribute('aria-disabled', 'true', { timeout: DETONATE_TIMEOUT_MS });
    await page.keyboard.up('Space');
    const about = await landingY(page, 'about');
    // `scrollY` puede ser fraccionario y `offsetTop` es entero: 1 px de tolerancia, sin redondear.
    await expect
      .poll(async () => Math.abs((await page.evaluate(() => window.scrollY)) - about))
      .toBeLessThanOrEqual(1);
    // El foco viaja con la vista: al título de About, sin anillo cortado ni otro salto de scroll.
    await expect(page.getByRole('heading', { level: 2, name: CHAPTERS.en[0][1] })).toBeFocused();

    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await expect(button).not.toHaveAttribute('aria-disabled');
  });

  test('a short click does not detonate: the charge drains back to 0', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await settleScene(page);
    const button = page.getByRole('button', { name: 'Hold to detonate' });
    await button.click();
    // Si soltar no funcionara, la carga seguiría subiendo hasta detonar y nunca volvería a 0.
    await expect
      .poll(() => button.evaluate((element) => element.style.getPropertyValue('--_charge')))
      .toBe('0');
    await expect(button).not.toHaveAttribute('aria-disabled');
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('with reduced motion the jump to About is instant', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'networkidle' });
    await settleScene(page);
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
    expect(Math.abs(atDetonation - (await landingY(page, 'about')))).toBeLessThanOrEqual(1);
  });

  for (const viewport of REFERENCE_VIEWPORTS) {
    test(`${String(viewport.width)}×${String(viewport.height)}: no horizontal scroll and the name never covers the singularity`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto('/', { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const layout = await page.evaluate(() => {
        const hero = document.querySelector('section[data-chapter="0"]');
        const core = hero?.querySelector('[data-singularity="core"]');
        const title = hero?.querySelector('h1');
        const kicker = title?.previousElementSibling;
        const textBox = (element: Element): DOMRect => {
          const range = document.createRange();
          range.selectNodeContents(element);
          return range.getBoundingClientRect();
        };
        const overlap = (a: DOMRect, b: DOMRect): boolean =>
          a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        if (core == null || title == null || kicker == null) return null;
        const coreBox = core.getBoundingClientRect();
        const kickerBox = textBox(kicker);
        const lines = [...title.querySelectorAll(':scope > span')].map(textBox);
        return {
          // clientWidth no cuenta la barra de scroll (innerWidth sí): un elemento a 100vw desborda.
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          hasCore: coreBox.width > 0,
          nameOverCore: lines.some((line) => overlap(line, coreBox)),
          kickerOverCore: overlap(kickerBox, coreBox),
          kickerOverName: lines.some((line) => overlap(line, kickerBox)),
        };
      });
      expect(layout).not.toBeNull();
      expect(layout?.overflow).toBeLessThanOrEqual(0);
      expect(layout?.hasCore).toBe(true);
      expect(layout?.nameOverCore).toBe(false);
      expect(layout?.kickerOverCore).toBe(false);
      expect(layout?.kickerOverName).toBe(false);

      // Bajando, el nombre se ensancha (`wdth` 150 y espaciado, ADR-030): tampoco desborda de lado. Dos pantallas
      // abajo, pasado `m` 1, para llegar también al espaciado máximo.
      await page.evaluate(() => {
        window.scrollTo(0, window.innerHeight * 2);
      });
      await expect
        .poll(() =>
          page.evaluate(() =>
            Number.parseFloat(
              getComputedStyle(document.querySelector('h1') ?? document.body).fontStretch,
            ),
          ),
        )
        .toBe(150);
      // El peor caso es con todo el espaciado (0,25 em, en `m` 1), que llega después del `wdth`. El bucle del Big Bang
      // lo persigue frame a frame: con pocos frames (la escena por software y varios tests a la vez) tarda más de los
      // 5 s por defecto en llegar.
      await expect
        .poll(
          () =>
            page.evaluate(() => {
              const title = document.querySelector('h1') ?? document.body;
              const { fontSize, letterSpacing } = getComputedStyle(title);
              return Number.parseFloat(letterSpacing) / Number.parseFloat(fontSize);
            }),
          { timeout: 15_000 },
        )
        .toBeCloseTo(0.25, 2);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
      ).toBeLessThanOrEqual(0);
    });
  }

  test('1280×720: every focusable element, with its focus ring, comes into view with Tab', async ({
    page,
    browserName,
  }) => {
    // Un Tab por elemento y, en WebKit, hasta 10 pares de frames por cada uno: con WebKit sin GPU a pocos fps
    // (DETONATE_TIMEOUT_MS) y los enlaces del Mission log, 30 s no llegan.
    test.slow(browserName === 'webkit', 'WebKit without a GPU paints few frames per second in CI');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/', { waitUntil: 'networkidle' });
    // Con la escena decidida: con ella, los grupos de Skills entran en el Tab (F4.3c); sin ella, no.
    await settleScene(page);
    // Se marca cada enlace, botón y grupo enfocable de main para saber cuáles visita el Tab (con lo que haya
    // delante, como la barra superior de F2.5, el recorrido sigue hasta salir de main).
    const total = await page.evaluate(() => {
      const focusables = [
        ...document.querySelectorAll('main a[href], main button, main [tabindex="0"]'),
      ];
      focusables.forEach((element, index) => {
        element.setAttribute('data-tab-check', String(index));
      });
      return focusables.length;
    });
    const visited = new Set<string>();
    const hidden: string[] = [];
    const MAX_TABS = total + 20;
    /** Lo enfocado y si se ve entero con su anillo, sin quedar bajo la barra. */
    const readFocused = () =>
      page.evaluate(() => {
        const element = document.activeElement;
        if (element === null || element === document.body) return null;
        const box = element.getBoundingClientRect();
        // El anillo de foco sobresale --focus-offset + --focus-width alrededor de la caja, y nada
        // puede quedar debajo de la barra fija (lo que tapa arriba, `scroll-padding-block-start`).
        const root = getComputedStyle(document.documentElement);
        const ring =
          Number.parseFloat(root.getPropertyValue('--focus-offset')) +
          Number.parseFloat(root.getPropertyValue('--focus-width'));
        const bar = Number.parseFloat(root.scrollPaddingBlockStart);
        return {
          id: element.getAttribute('data-tab-check'),
          name: element.textContent.trim(),
          visible: box.top - ring >= bar && box.bottom + ring <= window.innerHeight,
        };
      });
    for (let tab = 0; tab < MAX_TABS; tab += 1) {
      await page.keyboard.press('Tab');
      let focused = await readFocused();
      // WebKit puede terminar de traerlo a la vista unos frames después del Tab: se vuelve a mirar antes de darlo
      // por tapado (si de verdad queda tapado, sigue fallando).
      for (let frame = 0; frame < 10 && focused !== null && !focused.visible; frame += 1) {
        await page.evaluate(
          () =>
            new Promise((resolve) => {
              requestAnimationFrame(() => requestAnimationFrame(resolve));
            }),
        );
        focused = await readFocused();
      }
      if (focused === null) break;
      if (focused.id === null) {
        if (visited.size > 0) break; // Ha salido de main: recorrido completo.
        continue;
      }
      visited.add(focused.id);
      if (!focused.visible) hidden.push(focused.name);
    }
    expect(visited.size).toBe(total);
    expect(hidden).toEqual([]);
  });

  test('every link and button in the journey is at least 44 px tall (touch target)', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const short = await page.evaluate(() => {
      const min = Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--target-min'),
      );
      return [...document.querySelectorAll('main a[href], main button')]
        .filter((element) => element.getBoundingClientRect().height < min - 0.5)
        .map((element) => element.textContent.trim());
    });
    expect(short).toEqual([]);
  });

  test('lists without bullets keep their list role (Safari drops it without role="list")', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const lists = await page.locator('main :is(ul, ol)').count();
    expect(lists).toBeGreaterThan(0);
    await expect(page.locator('main').getByRole('list')).toHaveCount(lists);
  });

  test('external links open in a new tab with rel="noopener noreferrer"', async ({ page }) => {
    await page.goto('/');
    const external = page.locator('main a[target="_blank"]');
    expect(await external.count()).toBeGreaterThan(0);
    for (const link of await external.all()) {
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  test('the CV: the same English PDF from the top bar and Touchdown in both languages, and it is served', async ({
    page,
  }) => {
    const CV = '/Victor_Perez_CV.pdf';
    for (const [path, download] of [
      ['/', 'Download CV (PDF)'],
      ['/es', 'Descargar CV (PDF, en inglés)'],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole('banner').getByRole('link', { name: 'CV' })).toHaveAttribute(
        'href',
        CV,
      );
      const link = page.getByRole('link', { name: download });
      await expect(link).toHaveAttribute('href', CV);
      await expect(link).toHaveAttribute('download');
    }
    const response = await page.request.get(CV);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/pdf');
    expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
  });

  for (const viewport of [REFERENCE_VIEWPORTS[0], REFERENCE_VIEWPORTS[2]]) {
    test(`${String(viewport.width)}×${String(viewport.height)}: loading the hero with slow fonts keeps CLS under 0.1`, async ({
      page,
      browserName,
    }) => {
      test.skip(
        browserName !== 'chromium',
        'Layout shift entries and network throttling: Chromium',
      );
      await page.setViewportSize(viewport);
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
  }
});

/**
 * Los efectos del Big Bang en el DOM (F4.1, ADR-030): el nombre (eje `wdth` y espaciado) y el halo en todos los
 * modos; el destello y el temblor, solo con escena y sin movimiento reducido. Los valores exactos los vigilan
 * `lib/bigBang` y `useBigBang`; aquí, que lleguen a la página.
 */
test.describe('the Big Bang', () => {
  const nameWidth = (page: Page): Promise<number> =>
    page.evaluate(() =>
      Number.parseFloat(
        getComputedStyle(document.querySelector('h1') ?? document.body).fontStretch,
      ),
    );

  /**
   * Apunta lo más alto que llegan el destello y el temblor mientras dura el test: el destello de la detonación dura
   * ≈ 0,6 s y un sondeo desde fuera se lo puede saltar. Mira lo que escribe el bucle en `<html>` y, del destello,
   * si se pinta (sin escena no se ve).
   */
  async function recordPeaks(page: Page): Promise<() => Promise<{ flash: number; shake: number }>> {
    await page.evaluate(() => {
      const peaks = { flash: 0, shake: 0 };
      const root = document.documentElement;
      const flash = document.querySelector('[data-big-bang="flash"]');
      new MutationObserver(() => {
        const painted = flash !== null && getComputedStyle(flash).display !== 'none';
        const opacity = Number(root.style.getPropertyValue('--_bang-flash') || '0');
        if (painted) peaks.flash = Math.max(peaks.flash, opacity);
        for (const axis of ['x', 'y']) {
          const offset = Math.abs(
            Number.parseFloat(root.style.getPropertyValue(`--_bang-shake-${axis}`) || '0'),
          );
          peaks.shake = Math.max(peaks.shake, offset);
        }
      }).observe(root, { attributeFilter: ['style'] });
      Object.assign(window, { bigBangPeaks: peaks });
    });
    return () =>
      page.evaluate(
        () =>
          (window as unknown as { bigBangPeaks: { flash: number; shake: number } }).bigBangPeaks,
      );
  }

  /**
   * Apunta si el lienzo se ha movido de verdad (su `translate` calculado, no solo las variables de `<html>`, que se
   * escriben igual sin escena). Hay que llamarlo antes de que empiece el temblor.
   */
  async function recordCanvasMoves(page: Page): Promise<() => Promise<boolean>> {
    await page.evaluate(() => {
      const scene = document.querySelector('canvas')?.closest('[aria-hidden="true"]');
      const seen = { moved: false };
      const look = (): void => {
        if (scene == null) return;
        const translate = getComputedStyle(scene).translate;
        if (
          translate !== 'none' &&
          translate.split(' ').some((part) => Number.parseFloat(part) !== 0)
        ) {
          seen.moved = true;
        }
      };
      new MutationObserver(look).observe(document.documentElement, { attributeFilter: ['style'] });
      Object.assign(window, { canvasSeen: seen });
    });
    return () =>
      page.evaluate(
        () => (window as unknown as { canvasSeen: { moved: boolean } }).canvasSeen.moved,
      );
  }

  /**
   * Los de la escena se saltan sin WebGL2 (en el CI, Firefox o WebKit sin GPU pueden no tenerlo), como los de
   * `scene.spec.ts`; Chromium siempre lo tiene (SwiftShader), así que ahí nunca se saltan en silencio.
   */
  async function skipWithoutWebGL2(page: Page, browserName: string): Promise<void> {
    const hasWebGL2 = await browserHasWebGL2(page);
    if (browserName === 'chromium') expect(hasWebGL2, 'Chromium must have WebGL2').toBe(true);
    test.skip(!hasWebGL2, 'This browser has no WebGL2 here');
  }

  /** Mantiene `Espacio` en el botón hasta que detona y suelta. */
  async function holdUntilDetonated(page: Page, during?: () => Promise<void>): Promise<void> {
    const button = page.getByRole('button', { name: 'Hold to detonate' });
    await button.focus();
    await page.keyboard.down('Space');
    try {
      await during?.();
      await expect(button).toHaveAttribute('aria-disabled', 'true', {
        timeout: DETONATE_TIMEOUT_MS,
      });
    } finally {
      await page.keyboard.up('Space');
    }
  }

  /**
   * Espera a que la carga se haya descargado tras detonar (el halo vuelve a su tamaño, ≈ 0,56 s): para entonces ya
   * pasaron el frame de la detonación (el golpe del destello) y el salto a About, y sus picos están apuntados.
   */
  async function waitForDrain(page: Page): Promise<void> {
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.style.getPropertyValue('--_bang-halo-scale')),
      )
      .toBe('1.000');
  }

  test('charging squeezes the name; going down widens it, spreads its letters and puts the halo out', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await settleScene(page);
    expect(await nameWidth(page)).toBe(62);
    const button = page.getByRole('button', { name: 'Hold to detonate' });
    await button.focus();
    await page.keyboard.down('Space');
    await expect.poll(() => nameWidth(page)).toBeLessThan(58);
    await page.keyboard.up('Space');
    await expect.poll(() => nameWidth(page)).toBe(62);

    await page.evaluate(() => {
      window.scrollTo(0, window.innerHeight);
    });
    await expect.poll(() => nameWidth(page)).toBe(150);
    const { tracking, halo, position } = await page.evaluate(() => {
      const title = document.querySelector('h1');
      const singularity = document.querySelector('[data-singularity="halo"]')?.parentElement;
      return {
        tracking: Number.parseFloat(title === null ? '0' : getComputedStyle(title).letterSpacing),
        halo: singularity == null ? -1 : Number(getComputedStyle(singularity).opacity),
        position: singularity == null ? '' : getComputedStyle(singularity).position,
      };
    });
    expect(tracking).toBeGreaterThan(0);
    expect(halo).toBe(0);
    expect(position).toBe('fixed');
  });

  test('with the scene: the canvas shakes while it charges and detonating flashes', async ({
    page,
    browserName,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await skipWithoutWebGL2(page, browserName);
    await expect(page.locator(PARTICLES_PAINTED)).toBeAttached({ timeout: 15_000 });
    await settleScene(page);
    const peaks = await recordPeaks(page);
    const canvasMoved = await recordCanvasMoves(page);
    await holdUntilDetonated(page);
    // El golpe de la detonación: 0,95, y en su primer frame a la vista nunca baja de 0,95 · (1 − 0,1 · 1,6) ≈ 0,8
    // (el paso del frame va topado a 0,1 s). El destello del scroll no pasa de 0,75: por encima, es la detonación.
    await expect.poll(async () => (await peaks()).flash).toBeGreaterThan(0.75);
    expect((await peaks()).shake).toBeGreaterThan(0);
    expect(await canvasMoved()).toBe(true);
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.style.getPropertyValue('--_bang-flash')),
      )
      .toBe('0.000');
  });

  test('with the scene: starting to go down flashes once, and stopped there the flash goes out', async ({
    page,
    browserName,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await skipWithoutWebGL2(page, browserName);
    await expect(page.locator(PARTICLES_PAINTED)).toBeAttached({ timeout: 15_000 });
    await settleScene(page);
    const peaks = await recordPeaks(page);
    // Un golpe de rueda bajo la primera pantalla (`m` ≈ 0,1): antes, el destello se quedaba en 0,75 sobre el texto.
    await page.evaluate(() => {
      window.scrollTo(0, Math.round(window.innerHeight * 0.3));
    });
    await expect.poll(async () => (await peaks()).flash).toBeGreaterThan(0.5);
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.style.getPropertyValue('--_bang-flash')),
      )
      .toBe('0.000');
    // Y no vuelve mientras sigue ahí: sin ningún pico en el medio segundo siguiente (algo que no pasa no se puede
    // esperar con un sondeo).
    await page.evaluate(() => {
      (window as unknown as { bigBangPeaks: { flash: number } }).bigBangPeaks.flash = 0;
    });
    await page.waitForTimeout(500);
    expect((await peaks()).flash).toBe(0);
  });

  test('with reduced motion: no flash and no shake, but the name still squeezes', async ({
    page,
    browserName,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'networkidle' });
    await skipWithoutWebGL2(page, browserName);
    await expect(page.locator(PARTICLES_PAINTED)).toBeAttached({ timeout: 15_000 });
    await settleScene(page);
    const peaks = await recordPeaks(page);
    await holdUntilDetonated(page, async () => {
      await expect.poll(() => nameWidth(page)).toBeLessThan(58);
    });
    await waitForDrain(page);
    expect(await peaks()).toEqual({ flash: 0, shake: 0 });
  });

  test('without WebGL: no flash and no canvas to shake, but the name still squeezes', async ({
    page,
  }) => {
    await withoutWebGL(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveClass(/\bno-gl\b/);
    await settleScene(page);
    const peaks = await recordPeaks(page);
    await holdUntilDetonated(page, async () => {
      await expect.poll(() => nameWidth(page)).toBeLessThan(58);
    });
    await waitForDrain(page);
    // Los valores se escriben igual; sin escena no hay lienzo que tiemble ni destello que se pinte.
    expect((await peaks()).flash).toBe(0);
    expect(await page.locator('canvas').count()).toBe(0);
  });
});

test.describe('on a touch screen', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Touch input through CDP: Chromium');
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  /** Mantiene un dedo en el centro de `selector` hasta que `done` se cumple (o pasa el tiempo). */
  async function holdFinger(
    page: Page,
    selector: string,
    done: () => Promise<void>,
  ): Promise<void> {
    const box = await page.locator(selector).first().boundingBox();
    if (box === null) throw new Error(`${selector} not rendered`);
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    try {
      await done();
    } finally {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
  }

  test('holding the button with a finger detonates', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const button = page.getByRole('button', { name: 'Hold to detonate' });
    await holdFinger(page, 'button[aria-describedby]', () =>
      expect(button).toHaveAttribute('aria-disabled', 'true', { timeout: DETONATE_TIMEOUT_MS }),
    );
  });

  test('holding the text of the hero does not detonate (the text stays selectable)', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await holdFinger(page, 'h1', () => page.waitForTimeout(2_000));
    await expect(page.getByRole('button', { name: 'Hold to detonate' })).not.toHaveAttribute(
      'aria-disabled',
    );
  });

  test('390 px: the hold button takes the whole row', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const widths = await page
      .getByRole('button', { name: 'Hold to detonate' })
      .evaluate((button) => ({
        button: button.getBoundingClientRect().width,
        row: button.parentElement?.clientWidth ?? 0,
      }));
    expect(widths.button).toBeCloseTo(widths.row, 0);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the whole journey is readable from the pre-rendered HTML (P1)', async ({ page }) => {
    await page.goto('/es');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Víctor Pérez');
    await expect(page.getByRole('heading', { level: 2 })).toHaveText(HEADINGS.es);
    await expect(page.getByRole('link', { name: 'Ver proyecto Chessmate' })).toHaveAttribute(
      'href',
      '/es/projects/chessmate',
    );
    await expect(page.getByRole('link', { name: 'victorperez@tortoisecode.dev' })).toHaveAttribute(
      'href',
      'mailto:victorperez@tortoisecode.dev',
    );
  });

  test('the dark background does not depend on JavaScript (P1)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(4, 5, 11)');
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
  });
});
