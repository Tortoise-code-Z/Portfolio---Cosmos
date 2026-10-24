import type { ReactNode, Ref } from 'react';

import { cx } from '~/lib/css/cx/cx';

import styles from './ButtonOutline.module.css';

interface ButtonOutlineProps {
  readonly onClick: () => void;
  readonly children: ReactNode;
  readonly id?: string;
  /** Nombre accesible cuando el texto visible es una forma corta del nombre (y lo contiene). */
  readonly 'aria-label'?: string;
  /** Lo que abre el botón, para el lector de pantalla (`dialog` en «Quick mission»). */
  readonly 'aria-haspopup'?: 'dialog';
  /** Clase del dueño para colocarlo (márgenes, ancho); el aspecto es siempre el del botón. */
  readonly className?: string;
  readonly ref?: Ref<HTMLButtonElement>;
}

/**
 * Botón de contorno (docs/03-diseno/componentes.md → «Botón de contorno»): mono en mayúsculas, borde
 * fino y velo con desenfoque, con el área táctil mínima. Uso: «Quick mission», «Back to the journey»,
 * «No, thanks» y «Copy» (`CopyButton`).
 */
export function ButtonOutline({
  onClick,
  children,
  id,
  'aria-label': ariaLabel,
  'aria-haspopup': ariaHaspopup,
  className,
  ref,
}: ButtonOutlineProps): ReactNode {
  return (
    <button
      ref={ref}
      id={id}
      type="button"
      className={cx(styles.button, className)}
      aria-label={ariaLabel}
      aria-haspopup={ariaHaspopup}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
