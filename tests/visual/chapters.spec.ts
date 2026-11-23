import { expect, test } from '@playwright/test';

import {
  CHAPTER_ANCHORS,
  CHAPTER_INDICES,
  EPILOGUE,
  INTERLUDES,
} from '../../src/content/chapters.ts';
import { forceLowScene, PARTICLES_PAINTED, withoutWebGL } from '../e2e/support/helpers.ts';

/**
 * Un estado por capítulo (docs/05-tecnico/calidad.md → «Regresión visual»): se entra por su ancla, así que la
 * escena arranca en su `m` exacto (ADR-028), y se espera a que haya partículas pintadas (en el epílogo, también el
 * retrato) y a que lleguen las fuentes. Siempre en nivel Bajo (ver `beforeEach`) y, como todas las capturas, con
 * movimiento reducido (`playwright.visual.config.ts`: el epílogo, sin teletipo). El año de la firma del sitio va
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
 * Los interludios (fase C): la pantalla de la transmisión, entrando por su ancla. Como todas las capturas, con
 * movimiento reducido (`playwright.visual.config.ts`): sin barrido, teletipo ni cursor que parpadee. Detrás, la forma del capítulo de antes, atenuada. Las cifras de
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
