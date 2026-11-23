import type { FocusEvent, PointerEvent } from 'react';

/** Los manejadores con que un elemento del panel enciende algo de la escena (un grupo de skills, un proyecto). */
export interface PointGestureHandlers {
  readonly onPointerEnter: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerLeave: (event: PointerEvent<HTMLElement>) => void;
  readonly onFocus: (event: FocusEvent<HTMLElement>) => void;
  readonly onBlur: (event: FocusEvent<HTMLElement>) => void;
  readonly onClick: () => void;
}

/**
 * Los gestos que encienden y sueltan lo de un elemento del panel (docs/03-diseno/componentes.md → «Grupo de
 * habilidades» y «Fila de proyecto»): el ratón (solo `mouse`: entrar enciende, salir suelta), el foco del teclado y el
 * toque (`click`). Solo el foco del teclado enciende (`:focus-visible` en lo que lo recibe, el propio elemento o uno de
 * sus enlaces): el del puntero ya lo cubren `pointerenter` y `click`, y el que devuelve el navegador al volver a la
 * pestaña no es un gesto (recuerda la modalidad). El foco que se mueve dentro del elemento no suelta, ni irse a otra
 * ventana o pestaña (el foco sigue ahí). Lo comparten Skills y Projects.
 */
export function pointGestures(point: () => void, release: () => void): PointGestureHandlers {
  return {
    onPointerEnter: (event) => {
      if (event.pointerType === 'mouse') point();
    },
    onPointerLeave: (event) => {
      if (event.pointerType === 'mouse') release();
    },
    onFocus: (event) => {
      if (event.target.matches(':focus-visible')) point();
    },
    onBlur: (event) => {
      if (!document.hasFocus()) return;
      if (!event.currentTarget.contains(event.relatedTarget)) release();
    },
    onClick: point,
  };
}
