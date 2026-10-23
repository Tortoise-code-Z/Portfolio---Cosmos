import type { ReactNode } from 'react';

import styles from './Eyebrow.module.css';

const SEPARATOR = ' · ';

interface EyebrowProps {
  /** Texto completo del eyebrow: «About · nebula · t ≈ 200 million years». */
  readonly text: string;
}

/**
 * Eyebrow de capítulo (docs/03-diseno/componentes.md → «Eyebrow»): la sección en ámbar y el resto
 * (`· escena · tiempo`) atenuado. Se parte por el primer « · » del texto.
 */
export function Eyebrow({ text }: EyebrowProps): ReactNode {
  const cut = text.indexOf(SEPARATOR);
  const section = cut === -1 ? text : text.slice(0, cut);
  const rest = cut === -1 ? '' : text.slice(cut);

  return (
    <p className={styles.eyebrow}>
      <span className={styles.section}>{section}</span>
      {rest === '' ? null : <span className={styles.rest}>{rest}</span>}
    </p>
  );
}
