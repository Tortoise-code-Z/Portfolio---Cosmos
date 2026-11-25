/**
 * Lo que se enfoca con Tab: alcanzable con el teclado (`tabIndex` ≥ 0) y con el foco a la vista (`:focus-visible`).
 * Fuera quedan los títulos que enfocan los saltos (`tabindex="-1"`: de su scroll ya se encarga `jumpToChapter`) y lo
 * que se enfoca con un clic. Lo comparten la llegada de un capítulo (su foco y su coreografía, ADR-039).
 */
export function isTabFocus(element: Element | null): element is HTMLElement {
  return (
    element instanceof HTMLElement && element.tabIndex >= 0 && element.matches(':focus-visible')
  );
}
