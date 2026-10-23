import { useCallback, useEffect, useRef, type RefObject } from 'react';

import { mapM, toScrollLayout, type ChapterLayout } from '../mapM/mapM';
import { useChapterLayout } from '../useChapterLayout/useChapterLayout';

interface ScrollTargetOptions {
  /** Qué elementos de `root` son los capítulos, en orden. */
  readonly selector: string;
  /** Ventana de morph de cada capítulo (`CHAPTER_MORPH_START`). */
  readonly morphStart: readonly number[];
  /** Recibe el `m` objetivo: al montar, al cambiar las medidas y con cada scroll. */
  readonly onTarget: (m: number) => void;
}

/**
 * Lo que tapa la barra fija arriba (`scroll-padding-block-start` del documento): un ancla (`/#projects`,
 * el raíl) deja el capítulo justo debajo y `m` tiene que ser su índice exacto (`toScrollLayout`).
 */
function readingOffset(): number {
  const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingBlockStart);
  return Number.isFinite(offset) ? offset : 0;
}

/**
 * Puente scroll → `m` (docs/05-tecnico/arquitectura.md → «Puente scroll → escena»): un único escuchador
 * de scroll pasivo calcula `m = mapM(scrollY, capítulos bajo la barra)` y se lo da a `onTarget`. No pasa por
 * estado de React (ADR-004): quien lo recibe decide qué hacer (hoy, `sceneStore`).
 */
export function useScrollTarget(
  root: RefObject<HTMLElement | null>,
  { selector, morphStart, onTarget }: ScrollTargetOptions,
): void {
  const layout = useRef<ChapterLayout>([]);

  const update = useCallback((): void => {
    onTarget(mapM(window.scrollY, layout.current, morphStart));
  }, [morphStart, onTarget]);

  const onLayout = useCallback(
    (measured: ChapterLayout): void => {
      layout.current = toScrollLayout(measured, readingOffset());
      update();
    },
    [update],
  );

  useChapterLayout(root, selector, onLayout);

  useEffect(() => {
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
    };
  }, [update]);
}
