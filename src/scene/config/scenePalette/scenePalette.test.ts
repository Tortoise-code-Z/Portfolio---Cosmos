// @vitest-environment node
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { hexToRgb, SCENE_PALETTE, type ScenePaletteName } from './scenePalette';

const DESIGN_SYSTEM = new URL('../../../../docs/03-diseno/design-system.md', import.meta.url);

/** Los colores de la tabla «Paleta de la escena» del design system. */
function documentedSceneColours(): string[] {
  const doc = readFileSync(DESIGN_SYSTEM, 'utf8');
  const start = doc.indexOf('### Paleta de la escena');
  const end = doc.indexOf('\n## ', start);
  expect(start).toBeGreaterThan(-1);
  return [...doc.slice(start, end).matchAll(/#[0-9a-f]{6}\b/gi)].map(([hex]) => hex.toLowerCase());
}

/**
 * Cada color principal de la tabla con su papel, escrito a mano a partir de la tabla: un color que cambia de
 * papel (las placas con el de los bordes, el núcleo de la galaxia con el de la nebulosa) hace saltar el test.
 */
const DOCUMENTED_ROLES: Readonly<Partial<Record<ScenePaletteName, string>>> = {
  singularityWarm: '#fff2d9',
  singularityIce: '#c7dbff',
  nebulaMagenta: '#ff4291',
  nebulaViolet: '#8047ff',
  nebulaTeal: '#24d9e0',
  nebulaAmber: '#ff9947',
  nebulaCore: '#ffe6b8',
  galaxyCore: '#ffd18c',
  galaxyArm: '#618cff',
  galaxyArmPink: '#f273ff',
  turtleShell: '#1a998a',
  turtleEdge: '#ffa847',
  turtlePlate: '#f2b861',
  turtlePlateLit: '#ffedc7',
  turtleForest: '#52f26b',
  turtleBody: '#38c7a3',
  turtleWake: '#73bfff',
  earthOcean: '#1247d9',
  earthLand: '#47b852',
  earthDesert: '#c79e5c',
  earthClouds: '#f2f7ff',
  earthAtmosphere: '#599eff',
  earthDawn: '#ff7326',
};

describe('scene palette', () => {
  it('paints every main colour of the design system table in its role, with the same value', () => {
    for (const [name, hex] of Object.entries(DOCUMENTED_ROLES)) {
      expect(SCENE_PALETTE[name as ScenePaletteName], name).toBe(hex);
    }
    // Y la tabla lista justo esos colores (ni uno de más ni uno de menos).
    expect(new Set(documentedSceneColours())).toEqual(new Set(Object.values(DOCUMENTED_ROLES)));
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
