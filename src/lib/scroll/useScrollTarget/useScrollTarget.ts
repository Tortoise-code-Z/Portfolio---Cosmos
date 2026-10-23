import { useCallback, useEffect, useRef, type RefObject } from 'react';

import { mapM, type ChapterLayout } from '../mapM/mapM';
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
 * Lo que tapa la barra fija arriba (`scroll-padding-block-start` del documento): la lectura empieza
 * debajo. Así, al caer en un ancla (`/#projects`, el raíl) el capítulo empieza justo en la línea de
 * lectura y `m` es su índice exacto.
 */
function readingOffset(): number {
  const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingBlockStart);
  return Number.isFinite(offset) ? offset : 0;
}

/**
 * Puente scroll → `m` (docs/05-tecnico/arquitectura.md → «Puente scroll → escena»): un único escuchador
 * de scroll pasivo calcula `m = mapM(scrollY + barra, capítulos)` y se lo da a `onTarget`. No pasa por
 * estado de React (ADR-004): quien lo recibe decide qué hacer (hoy, `sceneStore`).
 */
export function useScrollTarget(
  root: RefObject<HTMLElement | null>,
  { selector, morphStart, onTarget }: ScrollTargetOptions,
): void {
  const layout = useRef<ChapterLayout>([]);
  const offset = useRef(0);

  const update = useCallback((): void => {
    onTarget(mapM(window.scrollY + offset.current, layout.current, morphStart));
  }, [morphStart, onTarget]);

  const onLayout = useCallback(
    (measured: ChapterLayout): void => {
      layout.current = measured;
      offset.current = readingOffset();
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
