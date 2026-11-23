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
 * sus enlaces): el del puntero ya lo cubren `pointerenter` y `click`. El que devuelve el navegador al volver a la
 * pestaña enciende solo si era del teclado (el navegador recuerda la modalidad: el foco del teclado sigue ahí). El foco
 * que se mueve dentro del elemento no suelta, ni irse a otra ventana o pestaña (el foco sigue ahí). Lo comparten Skills
 * y Projects.
 *
 * Se reparten con `{...pointGestures(…)}`: jsx-a11y ya no ve los manejadores en el elemento (por eso Skills y
 * ProjectRow no llevan `eslint-disable`). Aceptado: son `<li>` con su alternativa de teclado en los enlaces y el foco;
 * un manejador nuevo en esos `<li>` hay que revisarlo a mano.
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
