import { expect, test } from '@playwright/test';

import { CHAPTER_ANCHORS, CHAPTER_INDICES } from '../../src/content/chapters.ts';
import { forceLowScene } from '../e2e/support/helpers.ts';

/**
 * Un estado por capítulo (docs/05-tecnico/calidad.md → «Regresión visual»): se entra por su ancla, así que la
 * escena arranca en su `m` exacto (ADR-028), y se espera a que haya partículas pintadas y a que lleguen las
 * fuentes. Siempre en nivel Bajo (ver `beforeEach`).
 */
const PARTICLES_PAINTED = '[data-particles="painted"]:has(canvas)';

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

for (const index of CHAPTER_INDICES) {
  const anchor = CHAPTER_ANCHORS[index];
  const name = `chapter-${String(index)}-${anchor ?? 'start'}`;

  test(`chapter ${String(index)} (${anchor ?? 'start'}) looks as it should`, async ({ page }) => {
    await page.goto(anchor === null ? '/' : `/#${anchor}`);
    await expect(page.locator(PARTICLES_PAINTED)).toHaveAttribute('data-level', 'low');
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await expect(page).toHaveScreenshot(`${name}.png`);
  });
}

/**
 * El modo sin WebGL con su foto fija (ADR-029): el degradado del espacio, la foto de la galaxia encima (fundida con
 * `screen`) y el aviso. Una sola, en el capítulo 2, en los dos tamaños: la foto de escritorio y la de móvil.
 */
test.describe('without WebGL', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      HTMLCanvasElement.prototype.getContext = () => null;
    });
  });

  test('chapter 2 (skills) shows its still over the backdrop', async ({ page }) => {
    await page.goto('/#skills');
    await expect(page.locator('[data-scene-stills] img[data-chapter="2"]')).toHaveAttribute(
      'data-visible',
      'true',
    );
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await expect(page).toHaveScreenshot('no-webgl-chapter-2-skills.png');
  });
});
