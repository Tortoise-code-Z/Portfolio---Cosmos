import { describe, expect, it } from 'vitest';

import { FIRST_PLATE_LABEL, LAST_PLATE_LABEL } from '../../config/plateSlots/plateSlots';
import { SCENE_PALETTE } from '../../config/scenePalette/scenePalette';
import { EARTH_TAG, TURTLE_TAG } from '../../shapes/shapeContract/shapeContract';
import particlesFragment from '../particles/particles.frag.glsl?raw';
import particlesVertex from '../particles/particles.vert.glsl?raw';
import starsFragment from '../stars/stars.frag.glsl?raw';
import starsVertex from '../stars/stars.vert.glsl?raw';
import { constantName, glslFloat, glslHeader } from './glslHeader';

const header = glslHeader();
const SHADERS = { particlesVertex, particlesFragment, starsVertex, starsFragment };

/** Los nombres que define la cabecera (`#define X …` y `const vec3 X = …`). */
const defined = new Set(
  [...header.matchAll(/^(?:#define (\w+)|const vec3 (\w+))/gm)].map(([, a, b]) => a ?? b),
);

describe('glslHeader', () => {
  it('defines every turtle and Earth tag with its value, and the plate range', () => {
    for (const [key, value] of Object.entries(TURTLE_TAG)) {
      expect(header).toContain(`#define TURTLE_${constantName(key)} ${glslFloat(value)}\n`);
    }
    for (const [key, value] of Object.entries(EARTH_TAG)) {
      expect(header).toContain(`#define EARTH_${constantName(key)} ${glslFloat(value)}\n`);
    }
    expect(header).toContain(`#define PLATE_FIRST ${glslFloat(FIRST_PLATE_LABEL)}\n`);
    expect(header).toContain(`#define PLATE_LAST ${glslFloat(LAST_PLATE_LABEL)}\n`);
  });

  it('a vec3 per palette colour, with its components', () => {
    expect(header).toContain('const vec3 COLOR_TURTLE_EDGE = vec3(1.0, 0.6588, 0.2784);');
    expect(
      Object.keys(SCENE_PALETTE).every((key) => defined.has(`COLOR_${constantName(key)}`)),
    ).toBe(true);
  });

  it('every tag, plate or colour name the shaders use is defined (a typo would not compile)', () => {
    for (const [name, source] of Object.entries(SHADERS)) {
      const used = new Set(
        [...source.matchAll(/\b(?:TURTLE|EARTH|PLATE|COLOR)_\w+/g)].map(([match]) => match),
      );
      const missing = [...used].filter((identifier) => !defined.has(identifier));
      expect(missing, name).toEqual([]);
    }
  });

  it('the shaders write no tag number by hand: tag comparisons go through the names', () => {
    // Una etiqueta escrita a mano se vería como `tag … 12.5` o `isTag(tag, 12.0)`.
    for (const [name, source] of Object.entries(SHADERS)) {
      expect(source, name).not.toMatch(/\btag\s*[<>=]=?\s*\d/);
      expect(source, name).not.toMatch(/isTag\(tag,\s*\d/);
    }
  });

  it('glslFloat always writes a float literal; constantName goes to UPPER_SNAKE', () => {
    expect(glslFloat(20)).toBe('20.0');
    expect(glslFloat(0.25)).toBe('0.25');
    expect(glslFloat(-3)).toBe('-3.0');
    expect(glslFloat(1e-7)).toBe('1e-7');
    expect(() => glslFloat(Number.NaN)).toThrow(RangeError);
    expect(constantName('shellEdge')).toBe('SHELL_EDGE');
    expect(constantName('galaxyArmPink')).toBe('GALAXY_ARM_PINK');
    expect(constantName('head')).toBe('HEAD');
  });
});
