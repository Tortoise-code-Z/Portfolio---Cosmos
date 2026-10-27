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
/** Los generadores, en su propio chunk: solo se descargan si el worker falla y hay que reintentar. */
const GENERATOR_CHUNK = /\/assets\/generateShapes-[^/]+\.js$/;
/** Los dos chunks de la escena: `SceneRoot-*` (el componente) y `scene-*` (Three.js, R3F…, vite.config.ts). */
const SCENE_CHUNK = /\/assets\/(?:scene|SceneRoot)-[^/]+\.js$/;
const NOTICE = "Your browser can't show the 3D universe, but everything else is here.";

/** El punto y el halo CSS del hero (`[data-chapter="0"]`): primero el halo, después el punto. */
const heroGlow = (page: Page) => page.locator('[data-chapter="0"] > [aria-hidden="true"] > span');
/** La escena ha pintado sus partículas (`SceneRoot` → `data-particles`). */
const PARTICLES_PAINTED = '[data-particles="painted"]:has(canvas)';

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

/** Las peticiones del chunk de los generadores desde ahora. */
function generatorRequests(page: Page): string[] {
  const urls: string[] = [];
  page.on('request', (request) => {
    if (GENERATOR_CHUNK.test(new URL(request.url()).pathname)) urls.push(request.url());
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
    // Con escena, el fondo estático de `no-gl` no está.
    expect(await page.evaluate(() => getComputedStyle(document.body, '::before').content)).toBe(
      'none',
    );
    const wrapper = page.locator('[aria-hidden="true"]', { has: sceneCanvas(page) });
    await expect(wrapper).toHaveCSS('position', 'fixed');
    // React Three Fiber pone `pointer-events: auto` en línea a su envoltorio: no debe tapar los enlaces.
    await page
      .getByRole('link', { name: /^View project/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/projects\//);
  });

  for (const path of ['/', '/projects/chessmate', '/es/no-such-page']) {
    test(`the content of ${path} sits above the canvas (both in the root stacking order)`, async ({
      page,
    }) => {
      await page.goto(path);
      await expect(page.locator(SCENE_READY)).toBeAttached();
      // El lienzo es fijo y con z-index: sin una capa propia, el texto (sin posicionar) quedaría debajo.
      const layers = await page.evaluate(() => {
        const layer = (element: Element | null) => {
          if (element === null) return null;
          const style = getComputedStyle(element);
          return { position: style.position, zIndex: Number(style.zIndex) };
        };
        const canvas = document.querySelector('canvas');
        const scene = canvas?.closest('[aria-hidden="true"]') ?? null;
        const main = document.querySelector('main');
        // Los dos cuelgan de `body` sin otro contexto de apilado en medio: sus z-index se comparan.
        return {
          main: layer(main),
          scene: layer(scene),
          sameContext:
            scene?.parentElement === document.body && main?.parentElement === document.body,
        };
      });
      expect(layers.main?.position).not.toBe('static');
      expect(layers.scene?.position).toBe('fixed');
      expect(layers.main?.zIndex).toBeGreaterThan(layers.scene?.zIndex ?? Number.POSITIVE_INFINITY);
      expect(layers.sameContext).toBe(true);
    });
  }

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

  test('paints its particles: the shaders compile, the hero dot hands over and the journey runs without errors', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator(PARTICLES_PAINTED)).toBeAttached({
      timeout: SHAPES_WORKER_TIMEOUT_MS * 2,
    });
    await expect(page.locator('html')).toHaveClass(/\bscene-on\b/);
    // La singularidad de partículas releva al punto; el halo se queda.
    await expect(heroGlow(page).last()).toHaveCSS('opacity', '0');
    await expect(heroGlow(page).first()).not.toHaveCSS('opacity', '0');
    // Por los 5 capítulos (las 5 formas, de una en una): ningún error, ningún shader roto.
    for (const id of ['about', 'skills', 'projects', 'contact']) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await page.evaluate(
        () =>
          new Promise((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(resolve));
          }),
      );
    }
    await expect(page.locator('html')).not.toHaveClass(/\bno-gl\b/);
    expect(errors).toEqual([]);
  });

  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 390, height: 844 },
  ]) {
    test(`at ${String(viewport.width)}×${String(viewport.height)}, the camera follows the journey and the mouse without errors`, async ({
      page,
    }) => {
      const errors = collectErrors(page);
      await page.setViewportSize(viewport);
      await page.goto('/', { waitUntil: 'networkidle' });
      await expect(page.locator(PARTICLES_PAINTED)).toBeAttached({
        timeout: SHAPES_WORKER_TIMEOUT_MS * 2,
      });
      // Cada capítulo (su keyframe y, en escritorio, su encuadre) con el ratón moviéndose (paralaje) y
      // saliendo de la ventana (vuelve al centro); a 390 px, el campo de visión de móvil.
      for (const id of ['about', 'skills', 'projects', 'contact']) {
        await page.locator(`#${id}`).scrollIntoViewIfNeeded();
        await page.mouse.move(viewport.width * 0.9, viewport.height * 0.2, { steps: 4 });
        await page.mouse.move(viewport.width * 0.1, viewport.height * 0.8, { steps: 4 });
        await page.evaluate(
          () =>
            new Promise((resolve) => {
              requestAnimationFrame(() => requestAnimationFrame(resolve));
            }),
        );
      }
      await page.mouse.move(-10, -10);
      await expect(page.locator('html')).not.toHaveClass(/\bno-gl\b/);
      expect(errors).toEqual([]);
    });
  }

  test('generates its shapes in the worker, without downloading the generators', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    const generator = generatorRequests(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator(SCENE_READY)).toHaveAttribute('data-shapes', 'worker', {
      timeout: SHAPES_WORKER_TIMEOUT_MS * 2,
    });
    // Los generadores van dentro del worker: su chunk del hilo principal es solo para el reintento.
    expect(generator).toEqual([]);
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
    const generator = generatorRequests(page);
    await page.route(SHAPES_WORKER, (route) => route.abort());
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator(SCENE_READY)).toHaveAttribute('data-shapes', 'main', {
      timeout: SHAPES_WORKER_TIMEOUT_MS * 2,
    });
    // El reintento sí lo descarga (y así se sabe que el patrón de arriba casa con su nombre).
    expect(generator).toHaveLength(1);
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
    await expect(page.locator('html')).not.toHaveClass(/\bscene-on\b/);
    await expect(sceneCanvas(page)).toHaveCount(0);
    expect(requests).toEqual([]);
    // Sin escena, el hero se ve completo: el punto CSS y su halo.
    await expect(heroGlow(page)).toHaveCount(2);
    for (const glow of await heroGlow(page).all()) await expect(glow).not.toHaveCSS('opacity', '0');
    // En lugar del lienzo, el fondo estático del espacio, fijo en la capa de la escena.
    const backdrop = await page.evaluate(() => {
      const style = getComputedStyle(document.body, '::before');
      return { position: style.position, image: style.backgroundImage };
    });
    expect(backdrop).toEqual({
      position: 'fixed',
      image: expect.stringMatching(/^radial-gradient\(/) as unknown,
    });

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
