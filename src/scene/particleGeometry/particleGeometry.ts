import { BufferAttribute, BufferGeometry, Sphere, Vector3 } from 'three';

import type { ShapeSet } from '../shapes/shapeContract/shapeContract';
import { STARS } from '../shapes/stars/stars';

/**
 * La geometría de las partículas (docs/04-escena/particulas-y-shaders.md → «Atributos»): un vértice por
 * partícula y una forma por atributo. Usa las matrices del `ShapeSet` tal cual (llegan transferidas del worker),
 * sin copiarlas.
 */

/** Qué matriz del `ShapeSet` va en cada atributo del shader (3 por partícula). */
export const SHAPE_ATTRIBUTES = {
  position: 'nebula',
  pGal: 'galaxy',
  pTur: 'turtle',
  pEar: 'earth',
} as const;

/** `aR`: 4 por partícula. */
export const RAND_ATTRIBUTE = 'aR';

/**
 * Una esfera que lo abarca todo, para que Three no la calcule sobre `position` (que es solo la nebulosa). El
 * objeto no se recorta por la cámara (`frustumCulled = false`): las formas ocupan regiones distintas.
 */
export const PARTICLES_BOUNDING_RADIUS = 100;

export function createParticleGeometry(shapes: ShapeSet): BufferGeometry {
  const geometry = new BufferGeometry();
  for (const [attribute, key] of Object.entries(SHAPE_ATTRIBUTES)) {
    geometry.setAttribute(attribute, new BufferAttribute(shapes[key], 3));
  }
  geometry.setAttribute(RAND_ATTRIBUTE, new BufferAttribute(shapes.rand, 4));
  geometry.boundingSphere = new Sphere(new Vector3(), PARTICLES_BOUNDING_RADIUS);
  return geometry;
}

/** La esfera de las estrellas de fondo: la cáscara más lejana donde caen (`STARS`). */
export const STARS_BOUNDING_RADIUS = STARS.minRadius + STARS.radiusRange;

/** La geometría de las estrellas de fondo: posición y un número aleatorio por estrella. */
export function createStarsGeometry(positions: Float32Array, rand: Float32Array): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute(RAND_ATTRIBUTE, new BufferAttribute(rand, 1));
  geometry.boundingSphere = new Sphere(new Vector3(), STARS_BOUNDING_RADIUS);
  return geometry;
}
