import type { ReactNode } from 'react';

import { CHAPTER_ANCHORS, type ChapterIndex } from '~/content/chapters';

import styles from './ChapterSection.module.css';

/** Cómo se encuentran los capítulos en el DOM (lo usan el mapeo de scroll y sus tests). */
export const CHAPTER_SELECTOR = '[data-chapter]';

interface ChapterSectionProps {
  readonly index: ChapterIndex;
  /** Id del título que da nombre a la sección (`aria-labelledby`). */
  readonly labelledBy: string;
  readonly children: ReactNode;
}

/**
 * Un capítulo del viaje: `<section>` con su ancla (`#about`…) y su altura de recorrido
 * (docs/02-experiencia/scroll-y-escena.md → «Capítulos y alturas»). La altura es mínima: si el
 * contenido no cabe, la sección crece y nunca lo recorta.
 */
export function ChapterSection({ index, labelledBy, children }: ChapterSectionProps): ReactNode {
  return (
    <section
      id={CHAPTER_ANCHORS[index] ?? undefined}
      aria-labelledby={labelledBy}
      className={styles.chapter}
      data-chapter={index}
    >
      {children}
    </section>
  );
}
