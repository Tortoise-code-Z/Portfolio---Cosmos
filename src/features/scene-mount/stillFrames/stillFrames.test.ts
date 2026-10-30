// @vitest-environment node
// Lee un CSS del disco: no necesita DOM (y el URL de jsdom no acepta rutas file:).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { LEVEL_SETTINGS } from '~/lib/device/sceneLevel/sceneLevel';

import { DESKTOP_STILL_QUERY, STILL_FRAMES, stillFileName } from './stillFrames';

/** El CSS que encaja las fotos: sus cifras tienen que ser las de `STILL_FRAMES` (las de la cámara, camera.test.ts). */
const css = readFileSync(
  fileURLToPath(new URL('../SceneStills/SceneStills.module.css', import.meta.url)),
  'utf8',
);

/** Las declaraciones de `.still`, por la cadena de condiciones (`@media …`, `@container …`) que las envuelve. */
type StillRules = Map<string, Record<string, string>>;

/**
 * Lee el CSS bloque a bloque (sin comentarios; el archivo es pequeño y plano): para cada bloque `.still`, la cadena
 * de reglas `@` que lo rodea (unidas con « > ») y sus declaraciones. Así un test mira cada fórmula dentro de su
 * condición, no solo que esté escrita en algún sitio.
 */
function stillRules(source: string): StillRules {
  const text = source.replaceAll(/\/\*[\s\S]*?\*\//g, '');
  const rules: StillRules = new Map();
  const stack: string[] = [];
  let buffer = '';
  for (const char of text) {
    if (char === '{') {
      stack.push(buffer.trim().replaceAll(/\s+/g, ' '));
      buffer = '';
    } else if (char === '}') {
      const selector = stack.pop() ?? '';
      if (selector === '.still') {
        const declarations = Object.fromEntries(
          buffer
            .split(';')
            .map((declaration) => declaration.split(':').map((part) => part.trim()))
            .filter(([property = '', value]) => property !== '' && value !== undefined)
            .map(([property = '', ...value]) => [property, value.join(':')]),
        );
        rules.set(stack.join(' > '), declarations);
      }
      buffer = '';
    } else {
      buffer += char;
    }
  }
  return rules;
}

describe('STILL_FRAMES and SceneStills.module.css', () => {
  const { desktop, handheld } = STILL_FRAMES;
  const rules = stillRules(css);
  const width = /^\(width >= (\d+px)\)$/.exec(DESKTOP_STILL_QUERY)?.[1] ?? '';
  const desktopMedia = `@media ${DESKTOP_STILL_QUERY}`;
  const handheldMedia = `@media (width < ${width})`;
  const handheldAspect = `${String(handheld.width)} / ${String(handheld.height)}`;

  it('has exactly the default fit and three branches, each still fit inside its own conditions', () => {
    expect(width).not.toBe('');
    expect([...rules.keys()]).toEqual([
      '',
      `${desktopMedia} > @container (aspect-ratio < 5 / 4)`,
      `${handheldMedia} > @container (aspect-ratio > ${handheldAspect}) and (aspect-ratio < 5 / 4)`,
      `${handheldMedia} > @container (aspect-ratio >= 5 / 4)`,
    ]);
  });

  it('fits to the height by default (desktop from 1.25, handheld up to the cap)', () => {
    expect(rules.get('')).toMatchObject({ width: 'auto', height: '100%' });
  });

  it('narrow desktop: the width of a 1.25 window, with the desktop measures', () => {
    expect(rules.get(`${desktopMedia} > @container (aspect-ratio < 5 / 4)`)).toMatchObject({
      width: `calc(100% * ${String(desktop.width)} / ${String(desktop.height)} / 1.25)`,
      height: 'auto',
    });
  });

  it('handheld between the cap and 1.25: fitted to the width', () => {
    expect(
      rules.get(
        `${handheldMedia} > @container (aspect-ratio > ${handheldAspect}) and (aspect-ratio < 5 / 4)`,
      ),
    ).toMatchObject({ width: '100%', height: 'auto' });
  });

  it('landscape handheld: the height scaled by the ratio of the half-field tangents', () => {
    expect(rules.get(`${handheldMedia} > @container (aspect-ratio >= 5 / 4)`)).toMatchObject({
      width: 'auto',
      height: `calc(100% * 1.25 * ${String(handheld.height)} / ${String(handheld.width)})`,
    });
  });
});

describe('STILL_FRAMES', () => {
  it('takes each frame at the maximum density of its level (what a visitor with a GPU sees)', () => {
    for (const frame of Object.values(STILL_FRAMES)) {
      expect(frame.deviceScaleFactor).toBe(LEVEL_SETTINGS[frame.level].maxDpr);
    }
  });
});

describe('stillFileName', () => {
  it('names each file by frame and chapter', () => {
    expect(stillFileName('desktop', 1)).toBe('scene-still-desktop-1');
    expect(stillFileName('handheld', 4)).toBe('scene-still-handheld-4');
  });
});
