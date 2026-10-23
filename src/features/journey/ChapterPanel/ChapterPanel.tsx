import { useRef, type ReactNode } from 'react';

import { useHeightVar } from '~/lib/css/useHeightVar/useHeightVar';

import styles from './ChapterPanel.module.css';

interface ChapterPanelProps {
  /** Panel ancho (`--panel-w-wide`): el de contacto. */
  readonly wide?: boolean;
  readonly children: ReactNode;
}

/**
 * Panel de lectura de un capítulo (docs/03-diseno/componentes.md → «Panel de capítulo»): velo que
 * asegura el contraste sobre la escena, corchetes de esquina y *sticky* en escritorio. Publica su
 * altura (`--_panel-h`) para que un panel más alto que la ventana se fije por abajo y nunca deje
 * texto (ni el foco) fuera de la pantalla.
 */
export function ChapterPanel({ wide = false, children }: ChapterPanelProps): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  useHeightVar(ref, '--_panel-h');

  return (
    <div ref={ref} className={styles.panel} data-wide={wide ? '' : undefined}>
      {children}
    </div>
  );
}
