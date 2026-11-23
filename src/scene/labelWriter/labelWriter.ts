import type { LabelBox } from '../math/labelFit/labelFit';

/**
 * Escribe en el DOM una etiqueta que la escena coloca en cada frame (las de las estrellas, F4.3, y los pins de las
 * placas, F4.4b): visibilidad, `data-live`, posición (`transform`), opacidad y `data-hot`, y solo lo que cambia
 * (cero objetos nuevos por frame, ADR-004).
 */

/** Lo último escrito en una etiqueta, y en qué elemento: solo se reescribe lo que cambia. */
export interface WrittenLabel {
  /**
   * El elemento en que se escribió. Si en un frame es otro (la capa se desmontó al ir a una ficha y nació de nuevo
   * al volver), lo escrito no vale: se olvida y se escribe entero. No depende de pintar un frame mientras no está
   * (con la misión rápida abierta a la ida y a la vuelta, la escena está en pausa todo ese rato).
   */
  element: HTMLElement | null;
  x: number;
  y: number;
  opacity: number;
  visible: boolean;
  hot: boolean;
  /** Responde al puntero, ratón o toque (`data-live`): visible y con su capítulo lo bastante presente. */
  live: boolean;
}

/** «Nada escrito» en `element`: así nace un elemento (su CSS lo oculta). */
function forgetWritten(written: WrittenLabel, element: HTMLElement | null): void {
  written.element = element;
  written.x = Number.NaN;
  written.y = Number.NaN;
  written.opacity = -1;
  written.visible = false;
  written.hot = false;
  written.live = false;
}

/** Lo escrito de una etiqueta al crearse: «nada escrito», en ningún elemento todavía (como `forgetWritten`). */
export function createWrittenLabel(): WrittenLabel {
  return {
    element: null,
    x: Number.NaN,
    y: Number.NaN,
    opacity: -1,
    visible: false,
    hot: false,
    live: false,
  };
}

/** Una etiqueta colocada: su caja de este frame (la decide `fitLabels`) y lo último escrito. */
export interface WritableLabel {
  readonly box: LabelBox;
  readonly written: WrittenLabel;
}

/**
 * Escribe la etiqueta en su elemento: la esquina de arriba a la izquierda de su caja, su opacidad, si está encendida
 * (`hot`) y si recibe el puntero (visible e `interactive`). Sin elemento (una ficha: la capa se desmonta), nada, y no
 * se retiene el que ya no está; uno nuevo (nacido al volver, oculto por su CSS) se escribe entero.
 */
export function writeLabel(
  element: HTMLElement | undefined,
  { box, written }: WritableLabel,
  opacity: number,
  hot: boolean,
  interactive: boolean,
): void {
  if (element === undefined) {
    written.element = null;
    return;
  }
  if (written.element !== element) forgetWritten(written, element);
  if (written.visible !== box.visible) {
    written.visible = box.visible;
    element.style.visibility = box.visible ? 'visible' : 'hidden';
  }
  const live = box.visible && interactive;
  if (written.live !== live) {
    written.live = live;
    element.toggleAttribute('data-live', live);
  }
  if (!box.visible) return;
  const x = Math.round(box.left);
  const y = Math.round(box.top);
  if (written.x !== x || written.y !== y) {
    written.x = x;
    written.y = y;
    element.style.transform = `translate(${String(x)}px, ${String(y)}px)`;
  }
  const rounded = Math.round(opacity * 100) / 100;
  if (written.opacity !== rounded) {
    written.opacity = rounded;
    element.style.opacity = String(rounded);
  }
  if (written.hot !== hot) {
    written.hot = hot;
    element.toggleAttribute('data-hot', hot);
  }
}
