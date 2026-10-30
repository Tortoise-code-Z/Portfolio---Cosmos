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
import { presentWebGLAsHardware } from '../e2e/support/helpers.ts';
import { stillsFingerprint } from './fingerprint.ts';

/**
 * Saca las fotos fijas del modo sin WebGL (ADR-029) de la escena real: `npm run stills`, dentro de la imagen de
 * Playwright (como las capturas). Para cada encuadre de `STILL_FRAMES` y cada capítulo con foto, entra por su ancla
 * (la escena arranca en su `m`, ADR-028) con movimiento reducido (quieta), espera a las partículas pintadas y
 * fotografía solo el lienzo, sobre negro (`--color-void` a `#000`: en el sitio se funde con `screen`). Después la
 * codifica en AVIF y WebP en `src/assets/scene-stills/` (una carpeta por formato) y deja la huella de lo que se ve en `stills.json`
 * (`fingerprint.ts`). No es un test: no compara nada (lo vigilan los e2e y las capturas del modo sin WebGL).
 */

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const OUT_DIR = join(ROOT, 'src/assets/scene-stills');
const PARTICLES_PAINTED = '[data-particles="painted"]:has(canvas)';

/**
 * Calidad de cada formato (sharp). Las partículas son puntos de color sobre negro: AVIF sin submuestreo de color
 * (con 4:2:0 los puntos pierden el tono). Medidas en F3.9: la mayor, la galaxia de escritorio (AVIF ~100 KB, WebP
 * ~165 KB), dentro de los 200 KB por variante de `budgets.spec.ts`.
 */
const ENCODING = {
  avif: { quality: 45, chromaSubsampling: '4:4:4', effort: 6 },
  webp: { quality: 70, effort: 6 },
} as const;

/** Las señales de una máquina con GPU: Alto en escritorio; Bajo en el encuadre de móvil (pantalla estrecha). */
const CAPABLE_MACHINE = { hardwareConcurrency: 8, deviceMemory: 8 } as const;

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
      await presentWebGLAsHardware(page);
      await page.addInitScript((machine) => {
        Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', {
          configurable: true,
          get: () => machine.hardwareConcurrency,
        });
        Object.defineProperty(Navigator.prototype, 'deviceMemory', {
          configurable: true,
          get: () => machine.deviceMemory,
        });
        // Antes de montar la escena (que lee `--color-void` al crear el lienzo): fondo negro y sin barra de
        // scroll (el lienzo ocupa la ventana entera, con el aspecto exacto de `STILL_FRAMES`).
        document.addEventListener('DOMContentLoaded', () => {
          const style = document.createElement('style');
          style.textContent =
            ':root { --color-void: #000000 !important; scrollbar-width: none; } ::-webkit-scrollbar { display: none; }';
          document.head.append(style);
        });
      }, CAPABLE_MACHINE);
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
      }
    });
  });
}

test('the fingerprint of what the stills show', () => {
  const manifest = {
    fingerprint: stillsFingerprint(ROOT),
    frames: STILL_FRAMES,
    encoding: ENCODING,
  };
  writeFileSync(join(OUT_DIR, 'stills.json'), `${JSON.stringify(manifest, null, 2)}\n`);
});
