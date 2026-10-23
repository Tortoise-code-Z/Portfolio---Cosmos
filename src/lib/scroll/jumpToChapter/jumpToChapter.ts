import { jumpBehavior } from '../../device/reducedMotion/reducedMotion';

interface JumpOptions {
  /**
   * Ancla que deja en la URL (`#projects`, o `''` para el inicio), sin añadir una entrada al historial
   * (docs/02-experiencia/navegacion.md → «Rutas y URLs»). Sin ella, la URL no cambia.
   */
  readonly hash?: string;
}

/**
 * Viaja a un capítulo: scroll suave hasta su inicio (instantáneo con movimiento reducido) y foco en el
 * título que lo nombra (`aria-labelledby`, con `tabindex="-1"`), sin otro salto de scroll. Quien llega
 * con teclado o lector sigue leyendo donde ha llegado, como con un enlace de salto. Lo usan la
 * detonación, el raíl y la barra superior.
 */
export function jumpToChapter(chapter: HTMLElement, { hash }: JumpOptions = {}): void {
  chapter.scrollIntoView({ behavior: jumpBehavior(), block: 'start' });
  const titleId = chapter.getAttribute('aria-labelledby');
  if (titleId !== null) document.getElementById(titleId)?.focus({ preventScroll: true });
  if (hash === undefined) return;
  const { pathname, search } = window.location;
  // Se conserva el estado de la entrada: React Router guarda ahí su clave de restauración del scroll.
  window.history.replaceState(window.history.state, '', `${pathname}${search}${hash}`);
}
