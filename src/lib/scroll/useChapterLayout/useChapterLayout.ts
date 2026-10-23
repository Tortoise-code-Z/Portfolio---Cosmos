import { useEffect, type RefObject } from 'react';

import type { ChapterLayout } from '../mapM/mapM';

/** Inicio (respecto al documento) y altura de cada elemento, en orden. */
export function measureChapters(elements: Iterable<HTMLElement>): ChapterLayout {
  return Array.from(elements, (element) => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top + window.scrollY, height: rect.height };
  });
}

/**
 * Mide los capítulos (`selector` dentro de `root`) y avisa con `onLayout` al montar, cuando cambia el
 * tamaño de `root` (texto que crece, ancho de ventana, idioma) y cuando terminan de cargar las fuentes
 * (docs/05-tecnico/arquitectura.md → «Puente scroll → escena»). Las alturas son mínimas: se mide la
 * real. Sin `ResizeObserver` ni `document.fonts` (jsdom) mide solo al montar; en el pre-render, nunca.
 */
export function useChapterLayout(
  root: RefObject<HTMLElement | null>,
  selector: string,
  onLayout: (layout: ChapterLayout) => void,
): void {
  useEffect(() => {
    const element = root.current;
    if (element === null) return undefined;
    let active = true;
    const measure = (): void => {
      if (active) onLayout(measureChapters(element.querySelectorAll<HTMLElement>(selector)));
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(element);
    // `fonts` falta en jsdom aunque el tipo diga que siempre está.
    const fonts = document.fonts as FontFaceSet | undefined;
    fonts?.ready.then(measure, (error: unknown) => {
      console.error('[scroll] Fonts failed to load; chapters measured with fallback fonts', error);
    });
    return () => {
      active = false;
      observer?.disconnect();
    };
  }, [root, selector, onLayout]);
}
