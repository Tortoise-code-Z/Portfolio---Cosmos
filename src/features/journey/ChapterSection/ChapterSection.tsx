import type { ReactNode } from 'react';

import { CHAPTER_ANCHORS, type ChapterIndex } from '~/content/chapters';

import styles from './ChapterSection.module.css';

interface ChapterSectionProps {
  readonly index: ChapterIndex;
  /** Id del título que da nombre a la sección (`aria-labelledby`). */
  readonly labelledBy: string;
  readonly children: ReactNode;
}

/**
 * Un capítulo del viaje: `<section>` con su ancla (`#about`…) y su altura de recorrido
 * (docs/02-experiencia/scroll-y-escena.md → «Capítulos y alturas»). La altura es mínima: si el
 * contenido no cabe, la sección crece y nunca lo recorta. La sección deja pasar el ratón a las etiquetas de la
 * escena; lo recogen sus hijos directos (ChapterSection.module.css → «Puntero del viaje»).
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
