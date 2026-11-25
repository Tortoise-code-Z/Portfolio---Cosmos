import { expect, test } from '@playwright/test';

import {
  CHAPTER_ANCHORS,
  CHAPTER_INDICES,
  EPILOGUE,
  INTERLUDES,
} from '../../src/content/chapters.ts';
import { arrivalBeamLine } from '../../src/lib/scroll/arrivalChoreography/arrivalChoreography.ts';
import {
  arrivalGeometry,
  forceLowScene,
  PARTICLES_PAINTED,
  scrollToY,
  withoutWebGL,
} from '../e2e/support/helpers.ts';

/**
 * Un estado por capítulo (docs/05-tecnico/calidad.md → «Regresión visual»): se entra por su ancla, así que la
 * escena arranca en su `m` exacto (ADR-028), y se espera a que haya partículas pintadas (en el epílogo, también el
 * retrato) y a que lleguen las fuentes. Siempre en nivel Bajo (ver `beforeEach`) y, como todas las capturas menos las
 * de la llegada del epílogo (abajo), con movimiento reducido (`playwright.visual.config.ts`: el epílogo, sin teletipo). El año de la firma del sitio va
 * tapado (`data-site-year`).
 */
/**
 * Las de los capítulos, siempre en Bajo (`forceLowScene`: se presenta como GPU con poca memoria; la del modo sin
 * WebGL, abajo, no tiene escena). En la imagen, Chromium pinta con
 * SwiftShader y lo dice en su `renderer`: sin presentarse como GPU, el sitio iría al modo sin WebGL (ADR-029); y
 * sin la poca memoria, en escritorio arrancaría en Alto o Medio según los núcleos, SwiftShader no llega a 45 fps y
 * la degradación en caliente bajaría el nivel a mitad de la foto.
 */
test.beforeEach(async ({ page }) => {
  await forceLowScene(page);
});

/**
 * Lo que se espera a la escena (partículas pintadas, el retrato) antes de la foto: más que los 15 s de `expect`. En
 * Docker, el primer test de cada tanda arranca en frío (el servidor, el navegador y SwiftShader compilando el shader) y
 * se pasaba de 15 s, aunque la foto en sí saliera bien; con la escena ya caliente tarda ~2 s. La foto sigue con su plazo.
 */
const SCENE_TIMEOUT_MS = 60_000;

for (const index of CHAPTER_INDICES) {
  const anchor = CHAPTER_ANCHORS[index];
  const name = `chapter-${String(index)}-${anchor ?? 'start'}`;

  test(`chapter ${String(index)} (${anchor ?? 'start'}) looks as it should`, async ({ page }) => {
    await page.goto(anchor === null ? '/' : `/#${anchor}`);
    await expect(page.locator(PARTICLES_PAINTED)).toHaveAttribute('data-level', 'low', {
      timeout: SCENE_TIMEOUT_MS,
    });
    // El retrato llega aparte, en su encargo al worker: sin esperarlo, la foto podría salir con la Tierra.
    if (index === EPILOGUE) {
      await expect(page.locator(PARTICLES_PAINTED)).toHaveAttribute('data-portrait', 'painted', {
        timeout: SCENE_TIMEOUT_MS,
      });
    }
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    // El año de la firma (epílogo) cambia cada 1 de enero: va tapado.
    await expect(page).toHaveScreenshot(`${name}.png`, {
      mask: [page.locator('[data-site-year]')],
    });
  });
}

/**
 * Los interludios (fase C): la pantalla de la transmisión, entrando por su ancla. Como todas las capturas menos las de
 * la llegada del epílogo (abajo), con movimiento reducido (`playwright.visual.config.ts`): sin barrido, teletipo ni cursor que parpadee. Detrás, la forma del capítulo de antes, atenuada. Las cifras de
 * la telemetría de Mission control y su mes (`data-telemetry`) cambian con cada test o ADR nuevo y cada mes: van
 * tapadas (las comprueba su e2e, `mission-control.spec.ts`).
 */
for (const interlude of INTERLUDES) {
  test(`interlude ${interlude.id} looks as it should`, async ({ page }) => {
    await page.goto(`/#${interlude.anchor}`);
    await expect(page.locator(PARTICLES_PAINTED)).toHaveAttribute('data-level', 'low', {
      timeout: SCENE_TIMEOUT_MS,
    });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await expect(page).toHaveScreenshot(`interlude-${interlude.id}.png`, {
      mask: [page.locator('[data-telemetry]')],
    });
  });
}

/**
 * El modo sin WebGL con su foto fija (ADR-029): el degradado del espacio, la foto de la galaxia encima (fundida con
 * `screen`) y el aviso. Una sola, en el capítulo 2, en los dos tamaños: la foto de escritorio y la de móvil.
 */
test.describe('without WebGL', () => {
  test.beforeEach(async ({ page }) => {
    await withoutWebGL(page);
  });

  test('chapter 2 (skills) shows its still over the backdrop', async ({ page }) => {
    await page.goto('/#skills');
    await expect(page.locator('[data-scene-stills] img[data-still-chapter="2"]')).toHaveAttribute(
      'data-visible',
      'true',
    );
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await expect(page).toHaveScreenshot('no-webgl-chapter-2-skills.png');
  });
});

/**
 * La llegada del epílogo con movimiento (C.7; docs/02-experiencia/capitulos/05-crew-file.md → «Transición»): las demás
 * capturas van con movimiento reducido, que no tiene llegada. Esta la para en una `a` fija: 0,4 (el haz a media bajada
 * revelando la pantalla y las esquinas cerrándose sobre el visor) y 1 (el visor encajado y la ficha escrita). Sin WebGL:
 * la página hace lo mismo sobre la foto fija del retrato, y así no queda un reloj de la escena que parar (los fallos de
 * señal y el haz en bucle del retrato cambiarían de una foto a otra). Las fuentes, antes del scroll (una que llega
 * tarde movería el visor); después se espera a que la `m` de la página (suavizada) llegue a esa `a` y se pare, y al
 * hacer la foto las transiciones (el teletipo) acaban (`animations: 'disabled'`).
 */
test.describe('the arrival of the epilogue, with motion', () => {
  test.use({ reducedMotion: 'no-preference' });

  test.beforeEach(async ({ page }) => {
    await withoutWebGL(page);
  });

  for (const at of [0.4, 1]) {
    test(`stopped at ${String(at)} of its arrival, it looks as it should`, async ({ page }) => {
      await page.goto('/#contact');
      const section = page.locator(`[data-chapter="${String(EPILOGUE)}"]`);
      await expect(section).toHaveAttribute('data-arrival', '');
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      // Del principio de la sección (bajo la barra) al final de su llegada (el marcador del ancla).
      const { start, landed } = await arrivalGeometry(section);
      await scrollToY(page, start + at * (landed - start));
      await expect(page.locator('[data-scene-stills] img[data-still-chapter="5"]')).toHaveAttribute(
        'data-visible',
        'true',
      );
      // Parada en su sitio: la línea del haz donde toca en esa `a` (en 1, arriba y sin esquinas que viajan: entre 0,92 y
      // casi 1 el estilo no cambia, así que no basta con que no cambie) y lo que escribe la página, quieto un cuarto
      // de segundo. La `m` de la página llega suavizada, y hasta que pasa de Contacto no se mueve nada.
      const settled = () =>
        section.evaluate(
          (element, { line, done }) =>
            new Promise<boolean>((resolve) => {
              const before = element.getAttribute('style');
              const stage = element.querySelector('[data-stage]')?.getBoundingClientRect().top ?? 0;
              const beamY = element.style.getPropertyValue('--_beam-y');
              const there = done
                ? beamY === '0.0px' && element.style.getPropertyValue('--_corners-show') === '0'
                : Math.abs(
                    Number.parseFloat(beamY) -
                      (line * document.documentElement.clientHeight - stage),
                  ) < 0.5;
              setTimeout(() => {
                resolve(there && element.getAttribute('style') === before);
              }, 250);
            }),
          { line: arrivalBeamLine(at), done: at === 1 },
        );
      await expect.poll(settled, { timeout: SCENE_TIMEOUT_MS }).toBe(true);
      // El año de la firma, tapado cuando se ve (a mitad de la llegada lo tapa el haz).
      await expect(page).toHaveScreenshot(`arrival-${String(at * 100)}-crew-file.png`, {
        mask: at === 1 ? [page.locator('[data-site-year]')] : [],
      });
    });
  }
});
