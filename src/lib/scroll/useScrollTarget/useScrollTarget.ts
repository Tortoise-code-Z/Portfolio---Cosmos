import { useCallback, useEffect, useRef, type RefObject } from 'react';

import {
  mapM,
  segmentAt,
  toScrollLayout,
  type ChapterLayout,
  type JourneyStep,
} from '../mapM/mapM';
import { journeyPosition } from '../journeyPosition/journeyPosition';
import { useChapterLayout } from '../useChapterLayout/useChapterLayout';

interface ScrollTargetOptions {
  /** Qué elementos de `root` son los tramos del viaje (capítulos y partes de los interludios), en orden. */
  readonly selector: string;
  /** Lo que hace la escena en cada tramo (`JOURNEY_SEGMENTS`). */
  readonly steps: readonly JourneyStep[];
  /**
   * Recibe el `m` objetivo, el tramo en el que se lee (su índice) y la posición en los tramos (`journeyPosition`): al
   * montar, al cambiar las medidas y con cada scroll.
   */
  readonly onTarget: (m: number, segment: number, j: number) => void;
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
 * de scroll pasivo calcula `m = mapM(scrollY, tramos bajo la barra)` y se lo da a `onTarget` con el tramo y la
 * posición en los tramos (`journeyPosition`). No pasa por
 * estado de React (ADR-004): quien lo recibe decide qué hacer (hoy, `sceneStore`).
 */
export function useScrollTarget(
  root: RefObject<HTMLElement | null>,
  { selector, steps, onTarget }: ScrollTargetOptions,
): void {
  const layout = useRef<ChapterLayout>([]);

  const update = useCallback((): void => {
    const y = window.scrollY;
    onTarget(
      mapM(y, layout.current, steps),
      segmentAt(y, layout.current),
      journeyPosition(y, layout.current),
    );
  }, [steps, onTarget]);

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
