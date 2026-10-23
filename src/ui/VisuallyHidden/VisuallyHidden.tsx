import type { ReactNode } from 'react';

import styles from './VisuallyHidden.module.css';

interface VisuallyHiddenProps {
  readonly id?: string;
  readonly children: ReactNode;
}

/** Texto solo para el lector de pantalla: no ocupa sitio en pantalla, pero se lee. */
export function VisuallyHidden({ id, children }: VisuallyHiddenProps): ReactNode {
  return (
    <span id={id} className={styles.hidden}>
      {children}
    </span>
  );
}
