import { clamp } from '~/lib/math/clamp/clamp';
import { damp } from '~/lib/math/damp/damp';

import { CONSTELLATION_LOOK } from '../../config/constellationLayout/constellationLayout';

/**
 * Las cuentas de las constelaciones en cada frame (docs/04-escena/constelaciones-y-placas.md → «Estados»): cuánto
 * está presente el capítulo 2 y cuánto está encendido cada grupo, y de ahí el tamaño y la opacidad de sus
 * estrellas, líneas y etiquetas. Puras: `scene/Constellations` las aplica.
 */

/** Presencia del capítulo 2 con la `m` de la escena: 1 en la galaxia y 0 a ±0,56 de ella. */
export function chapterPresence(m: number): number {
  return clamp(1 - Math.abs(m - 2) * CONSTELLATION_LOOK.presenceFade, 0, 1);
}

/**
 * Lo encendido de un grupo (0–1) tras `dt` segundos, hacia `on`: con el suavizado del ritmo `hotRate` o, con
 * movimiento reducido, de golpe (docs/02-experiencia/capitulos/02-galaxia.md: «el encendido es instantáneo»).
 */
export function followHot(hot: number, on: boolean, dt: number, reduced: boolean): number {
  const target = on ? 1 : 0;
  return reduced ? target : damp(hot, target, dt, CONSTELLATION_LOOK.hotRate, 1e-3);
}

/** Cómo se ve un grupo: lo escribe en un objeto que se crea una vez (cero objetos nuevos por frame, ADR-004). */
export interface ConstellationLook {
  /** Tamaño de las estrellas, en píxeles CSS. */
  starPx: number;
  starOpacity: number;
  lineOpacity: number;
  labelOpacity: number;
}

export function createConstellationLook(): ConstellationLook {
  return { starPx: 0, starOpacity: 0, lineOpacity: 0, labelOpacity: 0 };
}

function between(range: { readonly rest: number; readonly hot: number }, hot: number): number {
  return range.rest + (range.hot - range.rest) * hot;
}

export function constellationLook(
  presence: number,
  hot: number,
  out: ConstellationLook,
): ConstellationLook {
  const { starPx, hotScale, starOpacity, lineOpacity, labelOpacity } = CONSTELLATION_LOOK;
  out.starPx = starPx * (1 + (hotScale - 1) * hot);
  out.starOpacity = presence * between(starOpacity, hot);
  out.lineOpacity = presence * between(lineOpacity, hot);
  out.labelOpacity = presence * between(labelOpacity, hot);
  return out;
}
