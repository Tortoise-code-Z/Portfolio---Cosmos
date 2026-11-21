import type { ReactNode } from 'react';

import styles from './BlinkCursor.module.css';

/**
 * El cursor de bloque del teletipo de una transmisión (docs/03-diseno/design-system.md → «Transmisiones»): al final de
 * una línea, parpadea unas pocas veces cuando la transmisión se enciende y se queda quieto. Decorativo.
 */
export function BlinkCursor(): ReactNode {
  return <span className={styles.cursor} aria-hidden="true" />;
}
