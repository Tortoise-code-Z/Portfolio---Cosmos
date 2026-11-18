import type { ReactNode } from 'react';

import { CHAPTER_ANCHORS, type ChapterIndex } from '~/content/chapters';

import styles from './ChapterSection.module.css';

interface ChapterSectionProps {
  readonly index: ChapterIndex;
  /** Id del título que da nombre a la sección (`aria-labelledby`). */
  readonly labelledBy: string;
  /**
   * Deja pasar el ratón a la capa de las etiquetas de la escena, debajo de `<main>`: solo lo recogen sus hijos
   * directos (el panel). Lo usa Skills (F4.3c; docs/04-escena/constelaciones-y-placas.md → «Etiquetas»).
   */
  readonly passThrough?: boolean;
  readonly children: ReactNode;
}

/**
 * Un capítulo del viaje: `<section>` con su ancla (`#about`…) y su altura de recorrido
 * (docs/02-experiencia/scroll-y-escena.md → «Capítulos y alturas»). La altura es mínima: si el
 * contenido no cabe, la sección crece y nunca lo recorta.
 */
export function ChapterSection({
  index,
  labelledBy,
  passThrough = false,
  children,
}: ChapterSectionProps): ReactNode {
  return (
    <section
      id={CHAPTER_ANCHORS[index] ?? undefined}
      aria-labelledby={labelledBy}
      className={styles.chapter}
      data-chapter={index}
      data-pass-through={passThrough ? '' : undefined}
    >
      {children}
    </section>
  );
}
