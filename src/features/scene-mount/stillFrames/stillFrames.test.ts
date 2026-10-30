// @vitest-environment node
// Lee un CSS del disco: no necesita DOM (y el URL de jsdom no acepta rutas file:).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { DESKTOP_STILL_QUERY, STILL_FRAMES, stillFileName } from './stillFrames';

/** El CSS que encaja las fotos: sus cifras tienen que ser las de `STILL_FRAMES` (las de la cámara, camera.test.ts). */
const css = readFileSync(
  fileURLToPath(new URL('../SceneStills/SceneStills.module.css', import.meta.url)),
  'utf8',
);

describe('STILL_FRAMES and SceneStills.module.css', () => {
  const { desktop, handheld } = STILL_FRAMES;

  it('fits each still with the measures it was taken at', () => {
    expect(css).toContain(
      `width: calc(100% * ${String(desktop.width)} / ${String(desktop.height)} / 1.25);`,
    );
    expect(css).toContain(
      `(aspect-ratio > ${String(handheld.width)} / ${String(handheld.height)})`,
    );
    expect(css).toContain(
      `height: calc(100% * 1.25 * ${String(handheld.height)} / ${String(handheld.width)});`,
    );
  });

  it('switches to the desktop still where the picture does (DESKTOP_STILL_QUERY)', () => {
    const width = /^\(width >= (\d+px)\)$/.exec(DESKTOP_STILL_QUERY)?.[1];
    expect(width).toBeDefined();
    expect(css).toContain(`@media (width >= ${String(width)}) and`);
    expect(css).toContain(`@media (width < ${String(width)}) and`);
  });
});

describe('stillFileName', () => {
  it('names each file by frame and chapter', () => {
    expect(stillFileName('desktop', 1)).toBe('scene-still-desktop-1');
    expect(stillFileName('handheld', 4)).toBe('scene-still-handheld-4');
  });
});
