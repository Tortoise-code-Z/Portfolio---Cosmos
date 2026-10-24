/**
 * Cambia el ancla de la URL sin añadir una entrada al historial ni mover la página
 * (docs/02-experiencia/navegacion.md → «Rutas y URLs»); `''` la quita. Conserva el estado de la
 * entrada: React Router guarda ahí su clave de restauración del scroll. Lo usan los saltos a un
 * capítulo y el modo misión rápida (`#quick`).
 */
export function replaceHash(hash: string): void {
  const { pathname, search } = window.location;
  window.history.replaceState(window.history.state, '', `${pathname}${search}${hash}`);
}
