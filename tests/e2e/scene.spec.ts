import { expect, type Page } from '@playwright/test';

import { test } from './support/test.ts';

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

/** El halo y el punto CSS del hero (`Hero` → `data-singularity`). */
const heroHalo = (page: Page) => page.locator('[data-singularity="halo"]');
const heroCore = (page: Page) => page.locator('[data-singularity="core"]');
/** La escena ha pintado sus partículas (`SceneRoot` → `data-particles`). */
const PARTICLES_PAINTED = '[data-particles="painted"]:has(canvas)';

/** Lienzo de la escena (el único `<canvas>` de la página). */
const sceneCanvas = (page: Page) => page.locator('canvas');
const noGlNotice = (page: Page) => page.getByRole('status').getByText(NOTICE);

/**
 * Los avisos de WebGL que escribe el navegador al dibujar (`GL_INVALID_OPERATION…` de un atributo mal
 * dimensionado, por ejemplo): Chromium los da como *warning*, no como error, y `collectErrors` no los ve. Fuera,
 * los de rendimiento del driver (SwiftShader avisa al leer píxeles para una captura).
 */
function collectGlWarnings(page: Page): string[] {
  const warnings: string[] = [];
  page.on('console', (message) => {
    const text = message.text();
    if (
      message.type() === 'warning' &&
      /WebGL|GL_/.test(text) &&
      !text.includes('GL Driver Message (OpenGL, Performance,')
    ) {
      warnings.push(text);
    }
  });
  return warnings;
}

/** Espera dos frames de la página (la escena pinta con lo que acaba de cambiar). */
async function nextFrames(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }),
  );
}

interface Clip {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
type Rgb = readonly [number, number, number];

/** El color del espacio, leído del token en la página (`--color-void`, `#rrggbb`): el fondo del lienzo. */
async function voidRgb(page: Page): Promise<Rgb> {
  const hex = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--color-void').trim(),
  );
  expect(hex).toMatch(/^#[\da-f]{6}$/i);
  return [1, 3, 5].map((start) =>
    Number.parseInt(hex.slice(start, start + 2), 16),
  ) as unknown as Rgb;
}

/**
 * Lo que se ve en una zona de la ventana: qué parte no es el fondo (algo pinta ahí: un píxel cuenta si se aleja
 * del fondo más que el ruido de la compresión) y el color que más se repite. La captura la descodifica el propio
 * navegador (en un lienzo 2D), sin dependencias.
 */
async function look(page: Page, clip: Clip): Promise<{ painted: number; dominant: Rgb }> {
  const background = await voidRgb(page);
  const png = await page.screenshot({ clip });
  return page.evaluate(
    async ({ base64, background: [r, g, b] }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d');
      if (context === null) throw new Error('No 2D context');
      context.drawImage(image, 0, 0);
      const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
      let painted = 0;
      const counts = new Map<number, number>();
      for (let i = 0; i < data.length; i += 4) {
        const [pr = 0, pg = 0, pb = 0] = [data[i], data[i + 1], data[i + 2]];
        if (Math.abs(pr - r) + Math.abs(pg - g) + Math.abs(pb - b) > 30) painted += 1;
        const key = (pr << 16) | (pg << 8) | pb;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      const [top = 0] = [...counts.entries()].sort((a, c) => c[1] - a[1])[0] ?? [];
      return {
        painted: painted / (data.length / 4),
        dominant: [(top >> 16) & 255, (top >> 8) & 255, top & 255] as const,
      };
    },
    { base64: png.toString('base64'), background },
  );
}

/** Junto a los paneles, entre ellos y el raíl (escritorio): donde está la forma del capítulo. */
function sceneClip(page: Page): Clip {
  const { width, height } = page.viewportSize() ?? { width: 0, height: 0 };
  return { x: width * 0.5, y: height * 0.15, width: width * 0.35, height: height * 0.7 };
}

/** Arriba a la derecha, bajo la barra y encima del raíl: en el hero solo hay espacio (y alguna estrella). */
function emptyClip(page: Page): Clip {
  const { width, height } = page.viewportSize() ?? { width: 0, height: 0 };
  return { x: width * 0.7, y: height * 0.12, width: width * 0.15, height: height * 0.18 };
}

/**
 * Las partículas se ven en el capítulo 1: se entra por su ancla en una carga nueva (un ancla da su `m` exacto y la
 * escena arranca en él, sin suavizado), se espera a que el raíl lo marque y, junto a los paneles, buena parte de los
 * píxeles no es el fondo. Con un tamaño de punto 0, alfa 0 o un atributo vacío, casi ninguno. Desde otra página del
 * sitio, ir a `/#about` solo cambiaría el ancla (sin recargar): antes se pasa por `about:blank`.
 */
async function expectParticlesSeenInAbout(page: Page): Promise<void> {
  await page.goto('about:blank');
  await page.goto('/#about', { waitUntil: 'networkidle' });
  await expect(page.locator(PARTICLES_PAINTED)).toBeAttached({
    timeout: SHAPES_WORKER_TIMEOUT_MS * 2,
  });
  await expect(
    page.getByRole('navigation', { name: 'Chapters' }).locator('[aria-current="step"]'),
  ).toHaveAccessibleName(/^About/);
  await expect.poll(async () => (await look(page, sceneClip(page))).painted).toBeGreaterThan(0.05);
}

/** El fondo que se ve es el del token, ±2 por canal (el lienzo no se limpia en negro). */
async function expectVoidBackground(page: Page): Promise<void> {
  const background = await voidRgb(page);
  await expect
    .poll(async () => {
      const { dominant } = await look(page, emptyClip(page));
      return Math.max(...dominant.map((channel, i) => Math.abs(channel - (background[i] ?? 0))));
    })
    .toBeLessThanOrEqual(2);
}

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

  test('in Chromium the e2e start the scene in low, whatever the machine (support/test.ts)', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Only Chromium is forced to low');
    await page.goto('/', { waitUntil: 'networkidle' });
    const scene = page.locator(PARTICLES_PAINTED);
    await expect(scene).toBeAttached({ timeout: SHAPES_WORKER_TIMEOUT_MS * 2 });
    // Una sola lectura, nada más pintar: la degradación en caliente solo mide con partículas pintadas y empieza
    // con su calentamiento, así que aún no ha podido bajar el nivel. Esperar a `low` la dejaría llegar sola.
    expect(await scene.getAttribute('data-level')).toBe('low');
  });

  test('is decorative and lets clicks through to the content underneath', async ({ page }) => {
    await expect(sceneCanvas(page)).toBeAttached();
    // Con escena, el fondo estático de `no-gl` no está (`backgroundImage`: igual en los tres motores, al
    // contrario que `content`, que sin regla puede ser `none` o `normal`).
    expect(
      await page.evaluate(() => getComputedStyle(document.body, '::before').backgroundImage),
    ).toBe('none');
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
    // Three rehace su fondo en negro al recuperar el contexto: la escena lo vuelve a poner.
    await nextFrames(page);
    await expectVoidBackground(page);
  });

  test('paints its particles: the shaders compile, the hero dot hands over and the journey runs without errors', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    const glWarnings = collectGlWarnings(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator(PARTICLES_PAINTED)).toBeAttached({
      timeout: SHAPES_WORKER_TIMEOUT_MS * 2,
    });
    await expect(page.locator('html')).toHaveClass(/\bscene-on\b/);
    // La singularidad de partículas releva al punto; el halo se queda.
    await expect(heroCore(page)).toHaveCSS('opacity', '0');
    await expect(heroHalo(page)).not.toHaveCSS('opacity', '0');
    // El fondo es el color del espacio, no negro.
    await expectVoidBackground(page);
    // Por los 5 capítulos (las 5 formas, de una en una): ningún error, ningún shader roto.
    for (const id of ['about', 'skills', 'projects', 'contact']) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await nextFrames(page);
    }
    // El recorrido llega de verdad al último capítulo.
    await expect(
      page.getByRole('navigation', { name: 'Chapters' }).locator('[aria-current="step"]'),
    ).toHaveAccessibleName(/^Contact/);
    await expectParticlesSeenInAbout(page);
    await expect(page.locator('html')).not.toHaveClass(/\bno-gl\b/);
    expect(errors).toEqual([]);
    expect(glWarnings).toEqual([]);
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('still paints its particles (they are seen) and hands over the hero dot, without errors', async ({
      page,
    }) => {
      const errors = collectErrors(page);
      const glWarnings = collectGlWarnings(page);
      await page.goto('/', { waitUntil: 'networkidle' });
      expect(
        await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
      ).toBe(true);
      await expect(page.locator(PARTICLES_PAINTED)).toBeAttached({
        timeout: SHAPES_WORKER_TIMEOUT_MS * 2,
      });
      await expect(page.locator('html')).toHaveClass(/\bscene-on\b/);
      await expect(heroCore(page)).toHaveCSS('opacity', '0');
      await page.locator('#contact').scrollIntoViewIfNeeded();
      await nextFrames(page);
      await expectParticlesSeenInAbout(page);
      await expect(page.locator('html')).not.toHaveClass(/\bno-gl\b/);
      expect(errors).toEqual([]);
      expect(glWarnings).toEqual([]);
    });
  });

  test('pauses while the quick mission covers it, and goes on when it closes', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator(PARTICLES_PAINTED)).toBeAttached({
      timeout: SHAPES_WORKER_TIMEOUT_MS * 2,
    });
    const scene = page.locator(SCENE_READY);
    await expect(scene).not.toHaveAttribute('data-paused');
    await page.getByRole('banner').getByRole('button', { name: 'Quick mission' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(scene).toHaveAttribute('data-paused', 'true');
    await dialog.getByRole('button', { name: 'Close quick mission' }).click();
    await expect(scene).not.toHaveAttribute('data-paused');
    await nextFrames(page);
    await expect(page.locator('html')).not.toHaveClass(/\bno-gl\b/);
    expect(errors).toEqual([]);
  });

  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 390, height: 844 },
  ]) {
    test(`at ${String(viewport.width)}×${String(viewport.height)}, the camera moves through every chapter with the mouse in and out, without errors`, async ({
      page,
    }) => {
      const errors = collectErrors(page);
      const glWarnings = collectGlWarnings(page);
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
        await nextFrames(page);
      }
      await page.mouse.move(-10, -10);
      // Un par de frames con el ratón fuera: la rama que vuelve al centro llega a correr.
      await nextFrames(page);
      await expect(page.locator('html')).not.toHaveClass(/\bno-gl\b/);
      expect(errors).toEqual([]);
      expect(glWarnings).toEqual([]);
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

  test.describe('hot degradation (painting too slowly)', () => {
    // Por nivel: 2 s de calentamiento y 3 ventanas de 2 s, más el worker. Las esperas de los dos niveles (hasta
    // 66 s) no caben en los 30 s de un test.
    test.describe.configure({ timeout: 90_000 });
    // Sin el Bajo del `test` de `support/test.ts`: el nivel lo fuerza `startHigh`.
    test.use({ sceneInLow: false });

    /**
     * Arranca en Alto: la detección cree que hay GPU (sin `failIfMajorPerformanceCaveat`; fuera de la imagen de
     * Playwright, SwiftShader daría «software» y Bajo) y hay 8 núcleos. Los fps bajos los pone el test, no la
     * máquina: cada frame llega 50 ms tarde (~20 fps, por debajo de los 45 de escritorio también con GPU). El bucle
     * de la escena lee `requestAnimationFrame` en cada frame, así que recoge el cambio. Este `describe` apaga el Bajo
     * de `support/test.ts` (`sceneInLow: false`): no hay otro script de WebGL que pisar.
     */
    async function startHigh(page: Page, browserName: string): Promise<void> {
      test.skip(browserName !== 'chromium', 'Only Chromium is forced and slowed down here');
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.addInitScript(() => {
        // eslint-disable-next-line @typescript-eslint/unbound-method -- se llama con `.call(this, …)`
        const getContext = HTMLCanvasElement.prototype.getContext;
        function withoutCaveat(
          this: HTMLCanvasElement,
          type: string,
          attributes?: WebGLContextAttributes,
        ): RenderingContext | null {
          const rest = { ...attributes };
          delete rest.failIfMajorPerformanceCaveat;
          return getContext.call(this, type, rest);
        }
        HTMLCanvasElement.prototype.getContext = withoutCaveat as typeof getContext;
        Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { get: () => 8 });
        const SLOW_FRAME_MS = 50;
        window.requestAnimationFrame = (callback) =>
          window.setTimeout(() => {
            callback(performance.now());
          }, SLOW_FRAME_MS);
        window.cancelAnimationFrame = (handle) => {
          window.clearTimeout(handle);
        };
      });
      // El `beforeEach` ya abrió `/`: ir a `/#about` desde ahí solo cambiaría el ancla, sin recargar ni pasar por
      // el script de arriba.
      await page.goto('about:blank');
    }

    test('goes down one level at a time to low, each with its shapes from the worker, without errors', async ({
      page,
      browserName,
    }) => {
      await startHigh(page, browserName);
      const errors = collectErrors(page);
      // Los únicos e2e de Chromium que pasan por Alto y Medio (los demás van en Bajo, sin estela ni luces).
      const glWarnings = collectGlWarnings(page);
      const generator = generatorRequests(page);
      await page.goto('/#about');
      const scene = page.locator(PARTICLES_PAINTED);
      await expect(scene).toHaveAttribute('data-level', 'high', {
        timeout: SHAPES_WORKER_TIMEOUT_MS * 2,
      });
      // Calentamiento (2 s) y 3 ventanas de 2 s por nivel, más lo que tarde el worker.
      await expect(scene).toHaveAttribute('data-level', 'medium', { timeout: 30_000 });
      await expect(scene).toHaveAttribute('data-level', 'low', { timeout: 30_000 });
      await expect(scene).toHaveAttribute('data-shapes', 'worker');
      expect(generator).toEqual([]);
      await expect(page.locator('html')).not.toHaveClass(/\bno-gl\b/);
      expect(errors).toEqual([]);
      expect(glWarnings).toEqual([]);
    });

    test('the shapes of the lower level do not arrive: the level stays, warned once, the scene goes on', async ({
      page,
      browserName,
    }) => {
      await startHigh(page, browserName);
      const errors = collectErrors(page);
      const warnings: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'warning') warnings.push(message.text());
      });
      const generator = generatorRequests(page);
      await page.goto('/#about');
      const scene = page.locator(PARTICLES_PAINTED);
      await expect(scene).toHaveAttribute('data-level', 'high', {
        timeout: SHAPES_WORKER_TIMEOUT_MS * 2,
      });
      await expect(scene).toHaveAttribute('data-shapes', 'worker');
      // Las formas del nivel de debajo ya no llegan.
      await page.route(SHAPES_WORKER, (route) => route.abort());
      const kept = '[scene] The shapes for a lower level did not arrive; keeping the current level';
      await expect
        .poll(() => warnings.filter((warning) => warning.startsWith(kept)).length, {
          timeout: 30_000,
        })
        .toBe(1);
      // Un rato más, por si llegara un segundo aviso. Que deje de medir (sin más intentos) lo fija el unitario de
      // `useHotDegradation`: aquí el medidor ya no existe y esperar un ciclo entero no probaría nada más.
      await page.waitForTimeout(3000);
      expect(warnings.filter((warning) => warning.startsWith(kept))).toHaveLength(1);
      await expect(scene).toHaveAttribute('data-level', 'high');
      await expect(scene).toHaveAttribute('data-shapes', 'worker');
      expect(generator).toEqual([]);
      await expect(page.locator('html')).not.toHaveClass(/\bno-gl\b/);
      expect(errors.filter((error) => !error.startsWith('Failed to load resource'))).toEqual([]);
    });
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
    await expect(heroCore(page)).not.toHaveCSS('opacity', '0');
    await expect(heroHalo(page)).not.toHaveCSS('opacity', '0');
    // En lugar del lienzo, el fondo estático del espacio, fijo en la capa de la escena: por debajo del
    // contenido (los dos en el orden de apilado de la raíz). Si lo tapara, los clics pasarían igual
    // (`pointer-events: none`) y solo se notaría al mirar.
    const backdrop = await page.evaluate(() => {
      const style = getComputedStyle(document.body, '::before');
      const main = document.querySelector('main');
      return {
        position: style.position,
        image: style.backgroundImage,
        zIndex: Number(style.zIndex),
        mainZIndex: main === null ? null : Number(getComputedStyle(main).zIndex),
        mainInBody: main?.parentElement === document.body,
      };
    });
    expect(backdrop).toEqual({
      position: 'fixed',
      image: expect.stringMatching(/^radial-gradient\(/) as unknown,
      zIndex: expect.any(Number) as unknown,
      mainZIndex: expect.any(Number) as unknown,
      mainInBody: true,
    });
    expect(backdrop.mainZIndex).toBeGreaterThan(backdrop.zIndex);

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
