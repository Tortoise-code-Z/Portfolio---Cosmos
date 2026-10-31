import type { ReactNode } from 'react';

import styles from './BigBangFlash.module.css';

/**
 * Destello del Big Bang (docs/03-diseno/movimiento.md → «Coreografía del Big Bang»): un velo radial blanco-ámbar
 * a toda la ventana, entre el lienzo y el contenido (`--z-flash`), decorativo y sin puntero. Su opacidad la
 * escribe `useBigBang` (`--_bang-flash`); solo se ve con escena (acompaña a la explosión de partículas).
 */
export function BigBangFlash(): ReactNode {
  return <div className={styles.flash} aria-hidden="true" data-big-bang="flash" />;
}
