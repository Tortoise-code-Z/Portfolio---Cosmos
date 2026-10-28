/**
 * El ratón sobre la escena, en coordenadas normalizadas (NDC: de −1 a 1 dentro de la ventana, `y` hacia
 * arriba; al arrastrar fuera de ella con el botón pulsado puede salirse de ±1: quien lo use pone su tope). Lo usa
 * el paralaje de la cámara (F3.4) y lo usará la gravedad del cursor (F4, `uMouse`). Un solo objeto para toda la
 * visita: los eventos lo escriben y la escena lo lee en cada frame (cero objetos nuevos por frame, ADR-004).
 */
export interface ScenePointer {
  x: number;
  y: number;
  /** Hay un ratón dentro de la ventana. Sin él (táctil, o fuera), el paralaje vuelve al centro. */
  inside: boolean;
}

export function createScenePointer(): ScenePointer {
  return { x: 0, y: 0, inside: false };
}

/**
 * Escucha el ratón en la ventana y lo escribe en `pointer`; devuelve cómo dejar de escuchar. Solo el ratón
 * (`pointerType === 'mouse'`): en táctil y con lápiz no hay paralaje ni gravedad
 * (docs/04-escena/camara-y-encuadre.md), también en un portátil con pantalla táctil, evento a evento. Que el
 * ratón salga de la ventana (`pointerout` de ratón sin destino) lo da por fuera; el `pointerout` de un dedo o un
 * lápiz que se levanta no.
 */
export function watchPointer(pointer: ScenePointer, target: Window = window): () => void {
  const onMove = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse') return;
    pointer.x = (event.clientX / Math.max(target.innerWidth, 1)) * 2 - 1;
    pointer.y = 1 - (event.clientY / Math.max(target.innerHeight, 1)) * 2;
    pointer.inside = true;
  };
  const onOut = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse' && event.relatedTarget === null) pointer.inside = false;
  };
  target.addEventListener('pointermove', onMove, { passive: true });
  target.addEventListener('pointerout', onOut, { passive: true });
  return () => {
    target.removeEventListener('pointermove', onMove);
    target.removeEventListener('pointerout', onOut);
  };
}
