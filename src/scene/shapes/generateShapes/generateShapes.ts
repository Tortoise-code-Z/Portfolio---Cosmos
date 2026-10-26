import { generateEarth } from '../earth/earth';
import { generateGalaxy } from '../galaxy/galaxy';
import { generateNebula } from '../nebula/nebula';
import { mulberry32, subSeed } from '../prng/prng';
import {
  type ShapeRequest,
  shapeRequestProblem,
  type ShapeSet,
} from '../shapeContract/shapeContract';
import { generateTurtle } from '../turtle/turtle';

/**
 * Las cuatro formas de la escena para `count` partículas (docs/04-escena/formas.md → «Contrato»). Corre en el
 * worker (y, si falla, una vez en el hilo principal). Todas las formas tienen el mismo `count`: cada partícula
 * tiene un sitio en cada una. Mismas entradas → mismos bytes, en el mismo motor de JavaScript.
 */

/** Genera las cuatro formas y `aR`. Lanza `RangeError` con una petición que no vale. */
export function generateShapes(request: ShapeRequest): ShapeSet {
  const problem = shapeRequestProblem(request);
  if (problem !== null) throw new RangeError(`[scene] Invalid shape request: ${problem}`);
  const { count, seed } = request;
  const shapes: ShapeSet = {
    count,
    nebula: new Float32Array(count * 3),
    galaxy: new Float32Array(count * 3),
    turtle: new Float32Array(count * 3),
    earth: new Float32Array(count * 3),
    rand: new Float32Array(count * 4),
  };
  // Cada parte con su subsemilla: retocar una no mueve las demás.
  const random = mulberry32(subSeed(seed, 'rand'));
  for (let i = 0; i < count; i++) {
    shapes.rand[i * 4] = random();
    shapes.rand[i * 4 + 3] = random();
  }
  generateNebula(count, mulberry32(subSeed(seed, 'nebula')), shapes.nebula);
  generateGalaxy(count, mulberry32(subSeed(seed, 'galaxy')), shapes.galaxy);
  generateTurtle(
    count,
    mulberry32(subSeed(seed, 'turtle')),
    new Set(request.plates),
    shapes.turtle,
    shapes.rand,
  );
  generateEarth(count, mulberry32(subSeed(seed, 'earth')), shapes.earth, shapes.rand);
  return shapes;
}
