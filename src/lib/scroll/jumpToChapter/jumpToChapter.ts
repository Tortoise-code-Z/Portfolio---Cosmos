import { jumpBehavior } from '../../device/reducedMotion/reducedMotion';
import { replaceHash } from '../../history/replaceHash/replaceHash';

interface JumpOptions {
  /**
   * Ancla que deja en la URL (`#projects`, o `''` para el inicio), sin añadir una entrada al historial
   * (docs/02-experiencia/navegacion.md → «Rutas y URLs»). Sin ella, la URL no cambia.
   */
  readonly hash?: string;
}

/**
 * Dónde se aterriza en un capítulo con llegada (el epílogo, ADR-039): un marcador al final de la llegada, con el ancla
 * del capítulo. Saltar al principio de la sección dejaría al lector al empezar la llegada, con el capítulo sin traer.
 */
export const LANDING_SELECTOR = '[data-landing]';

/**
 * Viaja a un capítulo: scroll suave hasta su inicio, o hasta el final de su llegada si la tiene (`LANDING_SELECTOR`),
 * (instantáneo con movimiento reducido) y foco en el título que lo nombra (`aria-labelledby`, con
 * `tabindex="-1"`), sin otro salto de scroll. Quien llega con teclado o lector sigue leyendo donde ha llegado, como
 * con un enlace de salto. Lo usan la detonación, el raíl y la barra superior.
 */
export function jumpToChapter(chapter: HTMLElement, { hash }: JumpOptions = {}): void {
  const landing = chapter.querySelector<HTMLElement>(LANDING_SELECTOR) ?? chapter;
  landing.scrollIntoView({ behavior: jumpBehavior(), block: 'start' });
  const titleId = chapter.getAttribute('aria-labelledby');
  if (titleId !== null) document.getElementById(titleId)?.focus({ preventScroll: true });
  if (hash !== undefined) replaceHash(hash);
}
