import { describe, expect, it } from 'vitest';

import { generateShapes } from '../shapes/generateShapes/generateShapes';
import {
  createParticleGeometry,
  createStarsGeometry,
  PARTICLES_BOUNDING_RADIUS,
  SHAPE_ATTRIBUTES,
} from './particleGeometry';

describe('createParticleGeometry', () => {
  const shapes = generateShapes({ count: 40, seed: 3, plates: [20] });
  const geometry = createParticleGeometry(shapes);

  it('one attribute per shape, plus aR, using the arrays as they came (no copy)', () => {
    expect(Object.keys(geometry.attributes).sort()).toEqual(
      ['aR', 'pEar', 'pGal', 'pTur', 'position'].sort(),
    );
    for (const [attribute, key] of Object.entries(SHAPE_ATTRIBUTES)) {
      const buffer = geometry.getAttribute(attribute);
      expect(buffer.array).toBe(shapes[key]);
      expect(buffer.itemSize).toBe(3);
      expect(buffer.count).toBe(40);
    }
    expect(geometry.getAttribute('aR').array).toBe(shapes.rand);
    expect(geometry.getAttribute('aR').itemSize).toBe(4);
  });

  it('a bounding sphere that covers every shape, so Three does not measure only the nebula', () => {
    expect(geometry.boundingSphere?.radius).toBe(PARTICLES_BOUNDING_RADIUS);
    for (const key of Object.values(SHAPE_ATTRIBUTES)) {
      for (const value of shapes[key])
        expect(Math.abs(value)).toBeLessThan(PARTICLES_BOUNDING_RADIUS);
    }
  });
});

describe('createStarsGeometry', () => {
  it('position (3) and aR (1) per star, without copies', () => {
    const positions = new Float32Array(6);
    const rand = new Float32Array(2);
    const geometry = createStarsGeometry(positions, rand);
    expect(geometry.getAttribute('position').array).toBe(positions);
    expect(geometry.getAttribute('aR').array).toBe(rand);
    expect(geometry.getAttribute('aR').itemSize).toBe(1);
  });
});
