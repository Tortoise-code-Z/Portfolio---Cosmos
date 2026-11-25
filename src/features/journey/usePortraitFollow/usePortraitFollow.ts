import { useEffect, type RefObject } from 'react';

import { createPortraitShift, portraitShift } from '~/lib/scroll/portraitShift/portraitShift';
import { setPortraitShift } from '~/stores/sceneStore/sceneStore';

/**
 * La cara del Crew file va en su marco (ADR-042; 05-crew-file.md → «La cara sigue a su marco»): mide dónde está el
 * marco (`ref`) respecto al centro de la ventana y lo deja en `sceneStore.portraitShift`, para que la escena mueva su
 * imagen eso (`CameraRig`) y la foto fija del modo sin WebGL lo mismo (`SceneStills`). Mide en el evento del scroll
 * (antes del frame que pinta la escena: sin un frame de retraso), al cambiar de tamaño la ventana o el marco (también
 * cuando se esconde: sin tamaño, nada que seguir) y al montar. Nada en el estado de React (ADR-004). Al desmontar,
 * deja la escena sin mover.
 */
export function usePortraitFollow(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const frame = ref.current;
    if (frame === null) return undefined;
    const root = document.documentElement;
    const shift = createPortraitShift();

    const measure = (): void => {
      // El ancho, el de la caja de `<html>`: el del lienzo (`position: fixed; inset: 0`), sin el hueco de la barra de
      // scroll (`scrollbar-gutter: stable`; `clientWidth` lo cuenta en Chromium). El alto, `clientHeight`, el del
      // lienzo.
      const width = root.getBoundingClientRect().width;
      portraitShift(frame.getBoundingClientRect(), width, root.clientHeight, shift);
      setPortraitShift(shift.x, shift.y);
    };

    measure();
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    // El marco cambia de tamaño (o se esconde) sin que se mueva la ventana: la maqueta, las fuentes al llegar.
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(frame);
    observer?.observe(document.body);
    return () => {
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
      observer?.disconnect();
      setPortraitShift(0, 0);
    };
  }, [ref]);
}
