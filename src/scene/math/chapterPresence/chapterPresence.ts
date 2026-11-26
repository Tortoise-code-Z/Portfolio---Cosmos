import { clamp } from '~/lib/math/clamp/clamp';
import type { ShapeId, ShapeMix } from '~/lib/scroll/shapeTrack/shapeTrack';

import { CHAPTER_PRESENCE_FADE } from '../../config/sceneConfig';

/**
 * Cuánto está presente un capítulo con la `m` de la escena: 1 en él y 0 a ±0,56 (`1 / CHAPTER_PRESENCE_FADE`) de él.
 * La misma rampa para todo lo que la escena pinta por capítulo: las constelaciones (2), las placas y los pins (3)
 * (docs/04-escena/constelaciones-y-placas.md), y el Sol y la gravedad suave sobre la Tierra (4;
 * docs/04-escena/particulas-y-shaders.md).
 */
export function chapterPresence(m: number, chapter: number): number {
  return clamp(1 - Math.abs(m - chapter) * CHAPTER_PRESENCE_FADE, 0, 1);
}

/**
 * Cuánto está presente una forma en la mezcla de este frame (C.7 · naves): la misma rampa que `chapterPresence`, pero
 * sobre lo que pesa la forma en la mezcla (1 quieta en ella; `1 − t` dejándola; `t` llegando a ella; 0 si no está).
 * Sin naves da lo mismo que `chapterPresence` con la `m` de la forma; con ellas, lo atado a una forma (los pins, las
 * placas, las constelaciones, el Sol) se va y vuelve con su forma, no con el capítulo.
 */
export function shapePresence(mix: Readonly<ShapeMix>, id: ShapeId): number {
  const weight = mix.from === id ? 1 - mix.t : mix.to === id ? mix.t : 0;
  return clamp(1 - (1 - weight) * CHAPTER_PRESENCE_FADE, 0, 1);
}
