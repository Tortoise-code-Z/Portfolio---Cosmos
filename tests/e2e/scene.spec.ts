import { expect, type Page, test } from '@playwright/test';

import { CONTEXT_RESTORE_TIMEOUT_MS } from '../../src/scene/contextLoss/contextLoss.ts';
import { SHAPES_WORKER_TIMEOUT_MS } from '../../src/scene/worker/loadShapes/loadShapes.ts';
import { collectErrors, SCENE_READY } from './support/helpers.ts';

/**
 * Carga de la escena y modo sin WebGL (docs/05-tecnico/arquitectura.md → «Carga de la escena»,
 * docs/02-experiencia/estados-y-accesibilidad.md → «Sin WebGL»). F3.1: el lienzo aún está vacío; aquí se
 * prueba que llega en diferido, en sus chunks, que sobrevive a la navegación y que cualquier fallo (el
 * contexto que se pierde, el chunk que no llega) deja la página entera con su aviso.
 */

/** El worker de las formas (su propio archivo, que pide la escena al montar). */
const SHAPES_WORKER = /\/assets\/shapes\.worker-[^/]+\.js$/;
/** Los dos chunks de la escena: `SceneRoot-*` (el componente) y `scene-*` (Three.js, R3F…, vite.config.ts). */
const SCENE_CHUNK = /\/assets\/(?:scene|SceneRoot)-[^/]+\.js$/;
const NOTICE = "Your browser can't show the 3D universe, but everything else is here.";

/** Lienzo de la escena (el único `<canvas>` de la página). */
const sceneCanvas = (page: Page) => page.locator('canvas');
const noGlNotice = (page: Page) => page.getByRole('status').getByText(NOTICE);

/** Pide los chunks de la escena que se descarguen desde ahora. */
function sceneRequests(page: Page): string[] {
  const urls: string[] = [];
  page.on('request', (request) => {
    if (SCENE_CHUNK.test(new URL(request.url()).pathname)) urls.push(request.url());
  });
  return urls;
}

/** ¿Tiene este navegador WebGL2? (en el CI, Firefox o WebKit sin GPU pueden no tenerlo). */
async function browserHasWebGL2(page: Page): Promise<boolean> {
  return page.evaluate(() => document.createElement('canvas').getContext('webgl2') !== null);
}

/**
 * Este navegador dice no a WebGL (como uno sin GPU o con WebGL desactivado). El sitio solo usa `<canvas>`
 * para la escena, así que basta con que ningún lienzo dé contexto.
 */
async function withoutWebGL(page: Page): Promise<void> {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
}

test.describe('the scene with WebGL', () => {
  test.beforeEach(async ({ page, browserName }) => {
    await page.goto('/');
    const hasWebGL2 = await browserHasWebGL2(page);
    // Chromium siempre lo tiene (SwiftShader sin GPU): si faltara, estos tests no deben saltarse en silencio.
    if (browserName === 'chromium') expect(hasWebGL2, 'Chromium must have WebGL2').toBe(true);
    test.skip(!hasWebGL2, 'This browser has no WebGL2 here');
  });

  test('arrives in its own chunks, which no HTML asks for, and mounts its renderer', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    const requests = sceneRequests(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    // Montada de verdad: el renderer existe (`data-ready`), no solo el `<canvas>` que R3F pinta antes.
    await expect(page.locator(SCENE_READY)).toBeAttached();
    expect(requests.map((url) => /\/assets\/(\w+)-/.exec(url)?.[1]).sort()).toEqual([
      'SceneRoot',
      'scene',
    ]);
    const html = await (await page.request.get('/')).text();
    expect(html).not.toMatch(/\/assets\/(?:scene|SceneRoot)-/);
    await expect(page.locator('html')).not.toHaveClass(/\bno-gl\b/);
    await expect(noGlNotice(page)).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('is decorative and lets clicks through to the content underneath', async ({ page }) => {
    await expect(sceneCanvas(page)).toBeAttached();
    const wrapper = page.locator('[aria-hidden="true"]', { has: sceneCanvas(page) });
    await expect(wrapper).toHaveCSS('position', 'fixed');
    // React Three Fiber pone `pointer-events: auto` en línea a su envoltorio: no debe tapar los enlaces.
    await page
      .getByRole('link', { name: /^View project/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/projects\//);
  });

  test('is mounted once: the same canvas survives going to a project and back', async ({
    page,
  }) => {
    await expect(sceneCanvas(page)).toBeAttached();
    await sceneCanvas(page).evaluate((canvas) => {
      canvas.dataset.e2eMark = 'first';
    });
    await page
      .getByRole('link', { name: /^View project/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/projects\//);
    await expect(sceneCanvas(page)).toHaveAttribute('data-e2e-mark', 'first');
    await page.goBack();
    await expect(sceneCanvas(page)).toHaveAttribute('data-e2e-mark', 'first');
  });

  test('a WebGL context that does not come back falls back to the no-WebGL mode', async ({
    page,
  }) => {
    await expect(sceneCanvas(page)).toBeAttached();
    await sceneCanvas(page).evaluate((canvas) => {
      const context = (canvas as HTMLCanvasElement).getContext('webgl2');
      context?.getExtension('WEBGL_lose_context')?.loseContext();
    });
    await expect(noGlNotice(page)).toBeVisible({ timeout: CONTEXT_RESTORE_TIMEOUT_MS * 2 });
    await expect(sceneCanvas(page)).toHaveCount(0);
    await expect(page.locator('html')).toHaveClass(/\bno-gl\b/);
  });

  test('a WebGL context that comes back in time keeps the scene', async ({ page }) => {
    await expect(page.locator(SCENE_READY)).toBeAttached();
    await sceneCanvas(page).evaluate(async (canvas) => {
      const context = (canvas as HTMLCanvasElement).getContext('webgl2');
      const lose = context?.getExtension('WEBGL_lose_context');
      lose?.loseContext();
      await new Promise((resolve) => setTimeout(resolve, 100));
      lose?.restoreContext();
    });
    // Pasado de sobra el plazo, la escena sigue y no hay aviso.
    await page.waitForTimeout(CONTEXT_RESTORE_TIMEOUT_MS * 1.5);
    await expect(sceneCanvas(page)).toHaveCount(1);
    await expect(noGlNotice(page)).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveClass(/\bno-gl\b/);
  });

  test('generates its shapes in the worker', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator(SCENE_READY)).toHaveAttribute('data-shapes', 'worker', {
      timeout: SHAPES_WORKER_TIMEOUT_MS * 2,
    });
    expect(errors).toEqual([]);
  });

  test('a shapes worker that never arrives: generated once on the main thread, the scene goes on', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    const warnings: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'warning') warnings.push(message.text());
    });
    await page.route(SHAPES_WORKER, (route) => route.abort());
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator(SCENE_READY)).toHaveAttribute('data-shapes', 'main', {
      timeout: SHAPES_WORKER_TIMEOUT_MS * 2,
    });
    await expect(page.locator('html')).not.toHaveClass(/\bno-gl\b/);
    await expect(noGlNotice(page)).toHaveCount(0);
    expect(errors.filter((error) => !error.startsWith('Failed to load resource'))).toEqual([]);
    expect(warnings).toContainEqual(
      expect.stringMatching(
        /^\[scene\] The shapes worker failed; generating once on the main thread/,
      ),
    );
  });

  test('a scene chunk that never arrives leaves the whole page, without WebGL', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.route(SCENE_CHUNK, (route) => route.abort());
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(noGlNotice(page)).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/\bno-gl\b/);
    await expect(sceneCanvas(page)).toHaveCount(0);
    // Solo el fallo de red, el import que falla (React 19 registra el error que recoge un boundary) y el
    // registro de la escena: nada más se rompe.
    const logged = errors.filter((error) => !error.startsWith('Failed to load resource'));
    expect(logged).toHaveLength(2);
    expect(logged).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^TypeError: /),
        expect.stringMatching(/^\[scene\] The 3D scene failed; continuing without WebGL/),
      ]),
    );
    await page.getByRole('button', { name: 'Got it' }).click();
    await page
      .getByRole('link', { name: /^View project/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/projects\//);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('without WebGL', () => {
  test.beforeEach(async ({ page }) => {
    await withoutWebGL(page);
  });

  test('never downloads the scene, marks the page and says so once', async ({ page }) => {
    const errors = collectErrors(page);
    const requests = sceneRequests(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(noGlNotice(page)).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/\bno-gl\b/);
    await expect(sceneCanvas(page)).toHaveCount(0);
    expect(requests).toEqual([]);

    await page.getByRole('button', { name: 'Got it' }).click();
    await expect(noGlNotice(page)).toHaveCount(0);
    // Navegar dentro del sitio no lo repite: es una vez por visita.
    await page
      .getByRole('link', { name: /^View project/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/projects\//);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(noGlNotice(page)).toHaveCount(0);
    // Recargar sí lo repite: el descarte no se guarda (si el navegador sigue sin WebGL, es útil decirlo).
    await page.reload({ waitUntil: 'networkidle' });
    await expect(noGlNotice(page)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('speaks the page language', async ({ page }) => {
    await page.goto('/es');
    await expect(
      page.getByRole('status').getByText(/^Tu navegador no puede mostrar el universo 3D/),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entendido' })).toBeVisible();
  });

  test.describe('with a Spanish browser on an English page', () => {
    test.use({ locale: 'es-ES' });

    test('waits for the language suggestion to be answered first', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });
      const suggestion = page
        .getByRole('status')
        .filter({ hasText: 'Esta página también está en español.' });
      await expect(suggestion.getByText('Esta página también está en español.')).toBeVisible();
      // El sitio ya ha decidido «sin WebGL»: que no haya aviso significa que espera su turno.
      await expect(page.locator('html')).toHaveClass(/\bno-gl\b/);
      await expect(noGlNotice(page)).toHaveCount(0);
      await suggestion.getByRole('button', { name: 'No, gracias' }).click();
      await expect(noGlNotice(page)).toBeVisible();
    });
  });
});
