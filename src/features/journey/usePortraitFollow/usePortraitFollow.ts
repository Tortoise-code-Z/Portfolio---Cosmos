import { useEffect, type RefObject } from 'react';

import { createPortraitShift, portraitShift } from '~/lib/scroll/portraitShift/portraitShift';
import { setPortraitShift } from '~/stores/sceneStore/sceneStore';

/**
 * Lo cerca que tiene que estar el marco para seguirlo con el scroll: una ventana por arriba y otra por abajo. Más lejos,
 * la escena no lo usa (fuera del epílogo no se mueve) y no se lee el layout en cada scroll de toda la página.
 */
export const PORTRAIT_FOLLOW_MARGIN = '100% 0px';

/**
 * La cara del Crew file va en su marco (ADR-042; 05-crew-file.md → «Layout»): mide dónde está el marco (`ref`)
 * respecto al centro de la ventana y lo deja en `sceneStore.portraitShift`, para que la escena mueva su imagen eso
 * (`CameraRig`) y la foto fija del modo sin WebGL lo mismo (`SceneStills`). Mide en el evento del scroll (antes del
 * frame que pinta la escena: sin un frame de retraso) mientras el marco está cerca (`PORTRAIT_FOLLOW_MARGIN`), al
 * cambiar de tamaño la ventana o el marco (también cuando se esconde: sin tamaño, nada que seguir) y al montar. Sin
 * `IntersectionObserver` no sigue el scroll (como las transmisiones sin él: lo justo). Nada en el estado de React
 * (ADR-004). Al desmontar, deja la escena sin mover.
 */
export function usePortraitFollow(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const frame = ref.current;
    if (frame === null) return undefined;
    const root = document.documentElement;
    const shift = createPortraitShift();
    let near = false;

    const measure = (): void => {
      // El ancho, el de la caja de `<html>`: el del lienzo (`position: fixed; inset: 0`), sin el hueco de la barra de
      // scroll (`scrollbar-gutter: stable`; `clientWidth` lo cuenta en Chromium). El alto, `clientHeight`, el del
      // lienzo.
      const width = root.getBoundingClientRect().width;
      portraitShift(frame.getBoundingClientRect(), width, root.clientHeight, shift);
      setPortraitShift(shift.x, shift.y);
    };
    const onScroll = (): void => {
      if (near) measure();
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    // El marco cambia de tamaño (o se esconde) sin que se mueva la ventana: la maqueta, las fuentes al llegar.
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    resize?.observe(frame);
    resize?.observe(document.body);
    const intersection =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            (entries) => {
              near = entries.at(-1)?.isIntersecting ?? near;
              if (near) measure();
            },
            { rootMargin: PORTRAIT_FOLLOW_MARGIN },
          );
    intersection?.observe(frame);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      resize?.disconnect();
      intersection?.disconnect();
      setPortraitShift(0, 0);
    };
  }, [ref]);
}
