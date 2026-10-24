import { Fragment, type ReactNode } from 'react';

import { Icon } from '../Icon/Icon';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';

/** La flecha que se escribe en el contenido («Go to Courses → All courses»). */
const ARROW = '→';

interface ArrowTextProps {
  readonly text: string;
}

/**
 * Texto con flechas (docs/03-diseno/design-system.md → «Iconos»): cada «→» se pinta con el icono SVG,
 * porque el subconjunto latino de las fuentes no trae ese carácter y saldría con la del sistema. El
 * lector de pantalla sigue leyendo la flecha (va oculta a la vista, no se dibuja con ninguna fuente).
 */
export function ArrowText({ text }: ArrowTextProps): ReactNode {
  const parts = text.split(ARROW);
  return parts.map((part, index) => (
    // El orden de los trozos no cambia nunca: el índice es una clave estable.
    <Fragment key={index}>
      {index > 0 ? (
        <>
          <Icon name="arrow-right" />
          <VisuallyHidden>{ARROW}</VisuallyHidden>
        </>
      ) : null}
      {part}
    </Fragment>
  ));
}
