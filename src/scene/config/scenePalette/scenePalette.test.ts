// @vitest-environment node
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { hexToRgb, SCENE_PALETTE } from './scenePalette';

const DESIGN_SYSTEM = new URL('../../../../docs/03-diseno/design-system.md', import.meta.url);

/** Los colores de la tabla «Paleta de la escena» del design system. */
function documentedSceneColours(): string[] {
  const doc = readFileSync(DESIGN_SYSTEM, 'utf8');
  const start = doc.indexOf('### Paleta de la escena');
  const end = doc.indexOf('\n## ', start);
  expect(start).toBeGreaterThan(-1);
  return [...doc.slice(start, end).matchAll(/#[0-9a-f]{6}\b/gi)].map(([hex]) => hex.toLowerCase());
}

describe('scene palette', () => {
  it('has every main colour of the design system table, with the same value', () => {
    const documented = documentedSceneColours();
    expect(documented.length).toBeGreaterThan(20);
    const values = new Set<string>(Object.values(SCENE_PALETTE));
    expect(documented.filter((hex) => !values.has(hex))).toEqual([]);
  });

  it('every colour is #rrggbb in lower case', () => {
    for (const hex of Object.values(SCENE_PALETTE)) expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('hexToRgb gives the 0–1 components and refuses anything else', () => {
    expect(hexToRgb('#ff8000')).toEqual([1, 128 / 255, 0]);
    expect(hexToRgb('#FFFFFF')).toEqual([1, 1, 1]);
    expect(() => hexToRgb('#fff')).toThrow(RangeError);
    expect(() => hexToRgb('red')).toThrow(/#rrggbb/);
  });
});
