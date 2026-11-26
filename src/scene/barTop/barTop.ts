import { clamp } from '~/lib/math/clamp/clamp';

/**
 * La barra fija de arriba, para la escena (C.7 · naves): la pantalla de una nave se encaja con lo que se ve debajo de
 * ella (`math/shipPose`), como el escenario del Crew file.
 */

/**
 * Lo que tapa la barra, en px: el `scroll-padding-block-start` del documento (el alto de la barra y la zona segura de
 * arriba), el mismo que lee el puente del scroll. 0 si no es un número positivo.
 */
export function readBarHeight(root: HTMLElement): number {
  const value = Number.parseFloat(getComputedStyle(root).scrollPaddingBlockStart);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** La fracción de un lienzo de `height` px que tapa una barra de `bar` px: de 0 a la mitad. Sin alto, 0. */
export function barFraction(bar: number, height: number): number {
  return height > 0 ? clamp(bar / height, 0, 0.5) : 0;
}
