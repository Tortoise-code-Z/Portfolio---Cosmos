import type { MouseEvent } from 'react';

/**
 * Clic normal: botón principal y sin teclas que pidan otra pestaña o ventana. Lo usan los enlaces del viaje que
 * saltan dentro de la página (raíl, barra, «Skip»): con cualquier otro clic, el enlace hace lo suyo.
 */
export function isPlainClick(
  event: Pick<MouseEvent, 'button' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>,
): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}
