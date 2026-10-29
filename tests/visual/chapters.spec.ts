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
 * Siempre en Bajo (`forceLowScene`: se presenta como GPU con poca memoria). En la imagen, Chromium pinta con
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
