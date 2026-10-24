import type { ReactNode } from 'react';

import styles from './ProjectSection.module.css';

interface ProjectSectionProps {
  /** Id del título: la sección se nombra con él (`aria-labelledby`). Único en la página. */
  readonly titleId: string;
  readonly title: string;
  readonly children: ReactNode;
}

/** Sección de la página de proyecto: un `h2` que la nombra y su contenido debajo. */
export function ProjectSection({ titleId, title, children }: ProjectSectionProps): ReactNode {
  return (
    <section aria-labelledby={titleId} className={styles.section}>
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      {children}
    </section>
  );
}
