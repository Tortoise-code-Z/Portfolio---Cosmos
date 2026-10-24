import type { ReactNode } from 'react';

import styles from './Notice.module.css';

interface NoticeProps {
  /** Si se ve. La región viva existe siempre: lo que aparece dentro se anuncia sin mover el foco. */
  readonly open: boolean;
  /** Idioma del aviso si no es el de la página (la sugerencia de idioma habla en el que ofrece). */
  readonly lang?: string | undefined;
  /** Texto y acciones (un enlace, «No, thanks»). */
  readonly children: ReactNode;
}

/**
 * Aviso (docs/03-diseno/componentes.md → «Aviso»): barra flotante abajo, en mono, con velo y borde, y
 * descartable por quien lo usa. No roba el foco ni tapa la barra superior. Uso: sugerencia de idioma y,
 * desde F3, «sin WebGL».
 */
export function Notice({ open, lang, children }: NoticeProps): ReactNode {
  return (
    <div role="status" lang={lang}>
      {open ? <div className={styles.notice}>{children}</div> : null}
    </div>
  );
}
