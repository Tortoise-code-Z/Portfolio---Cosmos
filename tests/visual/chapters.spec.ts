import { expect, test } from '@playwright/test';

import { CHAPTER_ANCHORS, CHAPTER_INDICES } from '../../src/content/chapters.ts';

/**
 * Un estado por capítulo (docs/05-tecnico/calidad.md → «Regresión visual»): se entra por su ancla, así que la
 * escena arranca en su `m` exacto (ADR-028), y se espera a que haya partículas pintadas y a que lleguen las
 * fuentes. Siempre en nivel Bajo (ver `beforeEach`).
 */
const PARTICLES_PAINTED = '[data-particles="painted"]:has(canvas)';

/**
 * En la imagen de Playwright, Chromium da contexto incluso con `failIfMajorPerformanceCaveat` (la detección cree
 * que hay GPU) y en escritorio arrancaría en Alto; SwiftShader no llega a 45 fps y la degradación en caliente
 * bajaría el nivel a mitad de la foto. Se le niega ese contexto: la detección dice «por software» y arranca en
 * Bajo, que ya es el suelo.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // eslint-disable-next-line @typescript-eslint/unbound-method -- se llama con `.call(this, …)`
    const getContext = HTMLCanvasElement.prototype.getContext;
    function asSoftware(
      this: HTMLCanvasElement,
      type: string,
      attributes?: WebGLContextAttributes,
    ): RenderingContext | null {
      return attributes?.failIfMajorPerformanceCaveat === true
        ? null
        : getContext.call(this, type, attributes);
    }
    HTMLCanvasElement.prototype.getContext = asSoftware as typeof getContext;
  });
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
