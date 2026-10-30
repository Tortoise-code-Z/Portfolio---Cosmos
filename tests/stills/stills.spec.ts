import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';
import sharp from 'sharp';

import { CHAPTER_ANCHORS } from '../../src/content/chapters.ts';
import {
  STILL_CHAPTERS,
  STILL_FRAMES,
  stillFileName,
  type StillFrameName,
} from '../../src/features/scene-mount/stillFrames/stillFrames.ts';
import { PARTICLES_PAINTED, presentCapableMachine } from '../e2e/support/helpers.ts';
import { stillsFingerprint } from './fingerprint.ts';

/**
 * Saca las fotos fijas del modo sin WebGL (ADR-029) de la escena real: `npm run stills`, dentro de la imagen de
 * Playwright (como las capturas). Para cada encuadre de `STILL_FRAMES` y cada capítulo con foto, entra por su ancla
 * (la escena arranca en su `m`, ADR-028) con movimiento reducido (quieta), espera a las partículas pintadas y
 * fotografía solo el lienzo, sobre negro (`--color-void` a `#000`: en el sitio se funde con `screen`). Después la
 * codifica en AVIF y WebP en `src/assets/scene-stills/` (una carpeta por formato) y deja la huella de lo que se ve
 * en `stills.json` (`fingerprint.ts`), solo si en esta pasada se han rehecho todas. No es un test: no compara nada
 * (lo vigilan los e2e y las capturas del modo sin WebGL).
 */

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const OUT_DIR = join(ROOT, 'src/assets/scene-stills');

/**
 * Calidad de cada formato (sharp). Las partículas son puntos de color sobre negro: AVIF sin submuestreo de color
 * (con 4:2:0 los puntos pierden el tono). Medidas en F3.9: la mayor, la galaxia de escritorio (AVIF ~100 KB, WebP
 * ~160 KB), dentro de los 200 KB por variante de `budgets.spec.ts`.
 */
const ENCODING = {
  avif: { quality: 45, chromaSubsampling: '4:4:4', effort: 6 },
  webp: { quality: 70, effort: 6 },
} as const;

/**
 * Las fotos escritas en esta pasada. La huella solo se escribe si están todas: con `npm run stills -- -g fingerprint`
 * (o `--last-failed`) se quedaría la huella nueva con las fotos viejas.
 */
const written = new Set<string>();

test.describe.configure({ mode: 'serial' });

for (const frameName of Object.keys(STILL_FRAMES) as StillFrameName[]) {
  const frame = STILL_FRAMES[frameName];

  test.describe(`the ${frameName} stills`, () => {
    test.use({
      viewport: { width: frame.width, height: frame.height },
      deviceScaleFactor: frame.deviceScaleFactor,
      reducedMotion: 'reduce',
      locale: 'en-US',
    });

    test('one per chapter, from the real scene', async ({ page }) => {
      // Alto en escritorio; Bajo en el encuadre de móvil (pantalla estrecha), como un visitante con GPU.
      await presentCapableMachine(page);
      await page.addInitScript(() => {
        // Antes de montar la escena (que lee `--color-void` al crear el lienzo): fondo negro y sin barra de
        // scroll (el lienzo ocupa la ventana entera, con el aspecto exacto de `STILL_FRAMES`).
        document.addEventListener('DOMContentLoaded', () => {
          const style = document.createElement('style');
          style.textContent =
            ':root { --color-void: #000000 !important; scrollbar-width: none; } ::-webkit-scrollbar { display: none; }';
          document.head.append(style);
        });
      });
      for (const format of ['avif', 'webp']) mkdirSync(join(OUT_DIR, format), { recursive: true });

      for (const chapter of STILL_CHAPTERS) {
        await page.goto('about:blank');
        await page.goto(`/#${String(CHAPTER_ANCHORS[chapter])}`);
        const scene = page.locator(PARTICLES_PAINTED);
        await expect(scene).toHaveAttribute('data-level', frame.level, { timeout: 60_000 });
        // Solo el lienzo: lo demás, invisible (sin cambiar la maqueta).
        await page.addStyleTag({
          content:
            '* { visibility: hidden !important; } canvas { visibility: visible !important; }',
        });
        const canvas = page.locator('canvas');
        expect(await canvas.boundingBox()).toEqual({
          x: 0,
          y: 0,
          width: frame.width,
          height: frame.height,
        });
        const png = await canvas.screenshot({ animations: 'disabled' });
        // La degradación en caliente no ha bajado el nivel mientras tanto (empieza con 2 s de calentamiento).
        expect(await scene.getAttribute('data-level')).toBe(frame.level);

        const name = stillFileName(frameName, chapter);
        await sharp(png)
          .avif(ENCODING.avif)
          .toFile(join(OUT_DIR, 'avif', `${name}.avif`));
        await sharp(png)
          .webp(ENCODING.webp)
          .toFile(join(OUT_DIR, 'webp', `${name}.webp`));
        written.add(name);
      }
    });
  });
}

test('the fingerprint of what the stills show', () => {
  expect(
    written.size,
    'Every still must be taken in this run before writing the fingerprint (run `npm run stills` without filters)',
  ).toBe(STILL_CHAPTERS.length * Object.keys(STILL_FRAMES).length);
  const manifest = {
    fingerprint: stillsFingerprint(ROOT),
    frames: STILL_FRAMES,
    encoding: ENCODING,
  };
  writeFileSync(join(OUT_DIR, 'stills.json'), `${JSON.stringify(manifest, null, 2)}\n`);
});
