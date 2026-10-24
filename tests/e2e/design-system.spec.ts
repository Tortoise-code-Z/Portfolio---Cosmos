import { expect, test, type Page } from '@playwright/test';

/**
 * Cimientos visuales (F2 · paso 1): tokens, estilos globales y fuentes autoalojadas.
 * Detalle en docs/03-diseno/design-system.md y docs/03-diseno/movimiento.md.
 */

const VOID_RGB = 'rgb(4, 5, 11)';
const STAR_RGB = 'rgb(255, 196, 107)';

/** Caras que declara `src/styles/fonts.css`, por familia. */
const EXPECTED_FACES: Readonly<Record<string, number>> = {
  Anybody: 1,
  Geologica: 1,
  'IBM Plex Mono': 2,
};

/** Rango mínimo del eje `wdth`: a 150 % el texto debe medir al menos esto respecto a 50 %. */
const MIN_WIDTH_AXIS_RATIO = 1.5;

const DURATION_TOKENS = [
  '--dur-fast',
  '--dur-base',
  '--dur-slow',
  '--dur-flight',
  '--dur-fade-base',
  '--dur-fade-slow',
] as const;

/**
 * Mide el efecto real de cada token de duración (`transition-duration` calculada), no el texto de
 * la variable: cada navegador serializa distinto el valor de una custom property.
 */
async function measureDurations(page: Page): Promise<string[]> {
  return page.evaluate((tokens) => {
    const probe = document.createElement('div');
    document.body.append(probe);
    const measured = tokens.map((token) => {
      probe.style.transitionDuration = `var(${token})`;
      return getComputedStyle(probe).transitionDuration;
    });
    probe.remove();
    return measured;
  }, DURATION_TOKENS);
}

/** Valor calculado de `padding-left: var(--gutter)` con el ancho de ventana dado. */
async function measureGutter(page: Page, width: number): Promise<string> {
  await page.setViewportSize({ width, height: 800 });
  return page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.paddingLeft = 'var(--gutter)';
    document.body.append(probe);
    const value = getComputedStyle(probe).paddingLeft;
    probe.remove();
    return value;
  });
}

/**
 * Abre la portada contando las peticiones de `.woff2` que salen a la red (no las entradas de Resource
 * Timing: según el motor, una fuente precargada y luego usada puede dejar dos entradas aunque se
 * descargue una sola vez) y los avisos de consola sobre precargas («preloaded but not used»).
 */
async function loadHomeWatchingFonts(
  page: Page,
): Promise<{ readonly fetched: string[]; readonly warnings: string[] }> {
  const fetched: string[] = [];
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning' && /preload/i.test(message.text()))
      warnings.push(message.text());
  });
  await page.route('**/*.woff2', async (route) => {
    fetched.push(new URL(route.request().url()).pathname);
    await route.continue();
  });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  return { fetched, warnings };
}

test.describe('design system foundations', () => {
  test('dark page background and color scheme come from the tokens', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'dark');
    const styles = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      return {
        rootBackground: root.backgroundColor,
        bodyBackground: getComputedStyle(document.body).backgroundColor,
        colorScheme: root.colorScheme,
      };
    });
    expect(styles).toEqual({
      rootBackground: VOID_RGB,
      bodyBackground: VOID_RGB,
      colorScheme: 'dark',
    });
  });

  test('every self-hosted font face loads from the build', async ({ page }) => {
    await page.goto('/');
    const faces = await page.evaluate(async () => {
      const all = [...document.fonts];
      // Se carga cada cara por sí misma: pedir «500 IBM Plex Mono» resolvería con la de 400 si faltara.
      await Promise.allSettled(all.map((face) => face.load()));
      return all.map((face) => ({
        family: face.family.replaceAll('"', ''),
        weight: face.weight,
        status: face.status,
      }));
    });

    const perFamily: Record<string, number> = {};
    for (const { family } of faces) perFamily[family] = (perFamily[family] ?? 0) + 1;
    expect(perFamily).toEqual(EXPECTED_FACES);
    expect(faces.filter((face) => face.status !== 'loaded')).toEqual([]);

    const weightsOf = (family: string): string[] =>
      faces
        .filter((face) => face.family === family)
        .map((face) => (face.weight.match(/\d+/g) ?? []).join(' '));
    expect(weightsOf('IBM Plex Mono').sort()).toEqual(['400', '500']);
    expect(weightsOf('Anybody')).toEqual(['100 900']);
  });

  test('the hero name is the display face narrowed to wdth 62 (energy held in)', async ({
    page,
  }) => {
    await page.goto('/');
    const name = page.getByRole('heading', { level: 1 });
    await expect(name).toHaveCSS('font-stretch', '62%');
    await expect(name).toHaveCSS('font-weight', '850');
    await expect(name).toHaveCSS('text-transform', 'uppercase');
  });

  test('display headings use Anybody with its width axis', async ({ page }) => {
    // La 404 usa el h1 global de global.css (el del hero lo ajusta su capítulo).
    await page.goto('/404');
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveCSS('font-stretch', '135%');
    await expect(heading).toHaveCSS('font-weight', '800');
    await expect(heading).toHaveCSS('text-transform', 'uppercase');
    const fontFamily = await heading.evaluate((element) => getComputedStyle(element).fontFamily);
    expect(fontFamily).toMatch(/^"?Anybody"?,/);

    // Se mide lo que se pinta: si el archivo no trajera el eje `wdth`, los dos anchos serían iguales.
    const widthRatio = await page.evaluate(async () => {
      await document.fonts.load('800 32px "Anybody"');
      const probe = document.createElement('span');
      probe.textContent = 'COSMOS PORTFOLIO';
      probe.style.cssText =
        'position:absolute;white-space:nowrap;font-family:var(--font-display);font-weight:800;font-size:32px';
      document.body.append(probe);
      probe.style.fontStretch = '50%';
      const narrow = probe.getBoundingClientRect().width;
      probe.style.fontStretch = '150%';
      const wide = probe.getBoundingClientRect().width;
      probe.remove();
      return wide / narrow;
    });
    expect(widthRatio).toBeGreaterThanOrEqual(MIN_WIDTH_AXIS_RATIO);
  });

  test('the two preloaded fonts come from the build and are used', async ({ page }) => {
    const { fetched } = await loadHomeWatchingFonts(page);
    const preloads = page.locator('link[rel="preload"][as="font"][type="font/woff2"][crossorigin]');
    await expect(preloads).toHaveCount(2);
    const preloaded = await preloads.evaluateAll((links) =>
      links.map((link) => new URL(link.getAttribute('href') ?? '', document.baseURI).pathname),
    );
    // Archivos que piden los `@font-face`: una precarga que apunte a otro archivo no se aprovecha.
    const declared = await page.evaluate(() =>
      [...document.styleSheets]
        .flatMap((sheet) => [...sheet.cssRules])
        .filter((rule): rule is CSSFontFaceRule => rule instanceof CSSFontFaceRule)
        .flatMap((rule) =>
          [...rule.style.getPropertyValue('src').matchAll(/url\(\s*["']?([^"')]+)/g)].map(
            (match) =>
              new URL(match[1] ?? '', rule.parentStyleSheet?.href ?? document.baseURI).pathname,
          ),
        ),
    );
    for (const path of preloaded) {
      expect(path).toMatch(/^\/assets\/.+\.woff2$/);
      expect(declared).toContain(path);
      expect(fetched).toContain(path);
    }
  });

  test('each font file is downloaded once (the preload is reused)', async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName === 'webkit',
      'WebKit downloads preloaded fonts twice even with a matching preload (https://bugs.webkit.org/show_bug.cgi?id=194589)',
    );
    const { fetched, warnings } = await loadHomeWatchingFonts(page);
    expect(fetched, 'each .woff2 is requested once').toEqual([...new Set(fetched)]);
    expect(warnings).toEqual([]);
  });

  test('keyboard focus shows the amber ring', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const button = document.createElement('button');
      button.id = 'focus-probe';
      button.textContent = 'Focus probe';
      document.body.prepend(button);
    });
    // Una tecla antes del foco: el navegador lo trata como foco de teclado (:focus-visible).
    await page.keyboard.press('Shift');
    const probe = page.locator('#focus-probe');
    await probe.focus();
    expect(await probe.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
    await expect(probe).toHaveCSS('outline-style', 'solid');
    await expect(probe).toHaveCSS('outline-width', '2px');
    await expect(probe).toHaveCSS('outline-color', STAR_RGB);
    await expect(probe).toHaveCSS('outline-offset', '3px');
  });

  test('the side gutter narrows below the sm breakpoint', async ({ page }) => {
    await page.goto('/');
    expect(await measureGutter(page, 400)).toBe('16px');
    expect(await measureGutter(page, 1024)).toBe('24px');
  });

  test('full motion keeps the token durations', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    expect(await measureDurations(page)).toEqual([
      '0.15s',
      '0.25s',
      '0.4s',
      '0.8s',
      '0.25s',
      '0.4s',
    ]);
  });

  test('reduced motion zeroes UI durations but keeps short opacity fades', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    expect(await measureDurations(page)).toEqual(['0s', '0s', '0s', '0s', '0.15s', '0.15s']);
  });

  test('the reset keeps modals and popovers centred and icons inline', async ({ page }) => {
    await page.goto('/');
    const layout = await page.evaluate(() => {
      // El centro de la zona en la que se centran (sin el hueco de la barra de scroll, global.css).
      const probe = document.createElement('div');
      probe.style.cssText = 'position: fixed; inset: 0; pointer-events: none';
      document.body.append(probe);
      const area = probe.getBoundingClientRect();
      probe.remove();
      const centreOffset = (element: HTMLElement): number => {
        const box = element.getBoundingClientRect();
        const dx = box.left + box.width / 2 - (area.left + area.width / 2);
        const dy = box.top + box.height / 2 - (area.top + area.height / 2);
        return Math.max(Math.abs(dx), Math.abs(dy));
      };

      const dialog = document.createElement('dialog');
      dialog.style.inlineSize = '200px';
      dialog.style.blockSize = '100px';
      document.body.append(dialog);
      dialog.showModal();
      const dialogOffset = centreOffset(dialog);
      dialog.close();

      const popover = document.createElement('div');
      popover.popover = 'manual';
      popover.style.inlineSize = '200px';
      popover.style.blockSize = '100px';
      document.body.append(popover);
      popover.showPopover();
      const popoverOffset = centreOffset(popover);
      popover.hidePopover();

      const paragraph = document.createElement('p');
      paragraph.innerHTML = 'Code <svg width="16" height="16" aria-hidden="true"></svg>';
      document.body.append(paragraph);
      const icon = paragraph.querySelector('svg');
      const svgDisplay = icon === null ? 'missing' : getComputedStyle(icon).display;

      dialog.remove();
      popover.remove();
      paragraph.remove();
      return { dialogOffset, popoverOffset, svgDisplay };
    });
    expect(layout.dialogOffset).toBeLessThanOrEqual(1);
    expect(layout.popoverOffset).toBeLessThanOrEqual(1);
    expect(layout.svgDisplay).toBe('inline');
  });

  test('every page links the same single stylesheet (ADR-019)', async ({ request }) => {
    // Si una ruta trajera su propia hoja, la 404 servida para `/ES` no coincidiría al hidratar.
    const pages = ['/', '/es', '/projects/chessmate', '/es/projects/chessmate', '/404', '/es/404'];
    const sheets = await Promise.all(
      pages.map(async (path) => {
        const html = await (await request.get(path)).text();
        return [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(
          (match) => match[1],
        );
      }),
    );
    expect(sheets[0]).toHaveLength(1);
    for (const list of sheets) expect(list).toEqual(sheets[0]);
  });
});
