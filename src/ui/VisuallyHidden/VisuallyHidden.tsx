import type { ReactNode } from 'react';

import styles from './VisuallyHidden.module.css';

interface VisuallyHiddenProps {
  readonly id?: string;
  /** `status`: región viva educada; lo que se escriba dentro se anuncia sin mover el foco. */
  readonly role?: 'status';
  readonly children?: ReactNode;
}

/** Texto solo para el lector de pantalla: no ocupa sitio en pantalla, pero se lee. */
export function VisuallyHidden({ id, role, children }: VisuallyHiddenProps): ReactNode {
  return (
    <span id={id} role={role} className={styles.hidden}>
      {children}
    </span>
  );
}
