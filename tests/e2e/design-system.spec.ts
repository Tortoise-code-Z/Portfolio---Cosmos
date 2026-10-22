import { expect, test } from '@playwright/test';

/**
 * Cimientos visuales (F2 · paso 1): tokens, estilos globales y fuentes autoalojadas.
 * Detalle en docs/03-diseno/design-system.md y docs/03-diseno/movimiento.md.
 */

const VOID_RGB = 'rgb(4, 5, 11)';

/** Cada cara de `src/styles/fonts.css`, tal como la pide el CSS. */
const FONT_FACES = [
  '800 16px "Anybody"',
  '400 16px "Geologica"',
  '400 16px "IBM Plex Mono"',
  '500 16px "IBM Plex Mono"',
] as const;

test.describe('design system foundations', () => {
  test('dark page background and color scheme come from the tokens', async ({ page }) => {
    await page.goto('/');
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

  test('self-hosted fonts load from the build', async ({ page }) => {
    await page.goto('/');
    for (const face of FONT_FACES) {
      const loaded = await page.evaluate(async (spec) => {
        const faces = await document.fonts.load(spec);
        return faces.length > 0 && faces.every((fontFace) => fontFace.status === 'loaded');
      }, face);
      expect(loaded, face).toBe(true);
    }
  });

  test('display headings use Anybody with its width axis', async ({ page }) => {
    await page.goto('/');
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveCSS('font-stretch', '135%');
    await expect(heading).toHaveCSS('text-transform', 'uppercase');
    const fontFamily = await heading.evaluate((element) => getComputedStyle(element).fontFamily);
    expect(fontFamily).toMatch(/^"?Anybody"?,/);

    const stretchRange = await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].find((fontFace) => fontFace.family.includes('Anybody'))?.stretch;
    });
    expect(stretchRange).toBe('50% 150%');
  });

  test('reduced motion zeroes UI durations but keeps short opacity fades', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    // Se mide el efecto real (transition-duration calculada), no el texto de la variable:
    // cada navegador serializa distinto el valor de una custom property.
    const durations = await page.evaluate(() => {
      const probe = document.createElement('div');
      document.body.append(probe);
      const measured = [
        '--dur-fast',
        '--dur-base',
        '--dur-slow',
        '--dur-flight',
        '--dur-fade-base',
      ].map((token) => {
        probe.style.transitionDuration = `var(${token})`;
        return getComputedStyle(probe).transitionDuration;
      });
      probe.remove();
      return measured;
    });
    expect(durations).toEqual(['0s', '0s', '0s', '0s', '0.15s']);
  });
});
