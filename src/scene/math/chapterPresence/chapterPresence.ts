import { clamp } from '~/lib/math/clamp/clamp';

import { CHAPTER_PRESENCE_FADE } from '../../config/sceneConfig';

/**
 * Cuánto está presente un capítulo con la `m` de la escena: 1 en él y 0 a ±0,56 (`1 / CHAPTER_PRESENCE_FADE`) de él.
 * La misma rampa para todo lo que la escena pinta por capítulo: las constelaciones (2), las placas y los pins (3)
 * (docs/04-escena/constelaciones-y-placas.md).
 */
export function chapterPresence(m: number, chapter: number): number {
  return clamp(1 - Math.abs(m - chapter) * CHAPTER_PRESENCE_FADE, 0, 1);
}
