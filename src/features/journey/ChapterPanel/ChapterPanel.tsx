import type { ReactNode } from 'react';

import styles from './ChapterPanel.module.css';

interface ChapterPanelProps {
  /** Panel ancho (`--panel-w-wide`): el de contacto. */
  readonly wide?: boolean;
  readonly children: ReactNode;
}

/**
 * Panel de lectura de un capítulo (docs/03-diseno/componentes.md → «Panel de capítulo»): velo que
 * asegura el contraste sobre la escena, corchetes de esquina y *sticky* en escritorio.
 */
export function ChapterPanel({ wide = false, children }: ChapterPanelProps): ReactNode {
  return (
    <div className={styles.panel} data-wide={wide ? '' : undefined}>
      {children}
    </div>
  );
}
