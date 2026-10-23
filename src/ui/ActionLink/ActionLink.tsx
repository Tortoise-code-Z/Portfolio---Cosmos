import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { useT } from '~/lib/i18n/useT/useT';

import { Icon, type IconName } from '../Icon/Icon';
import styles from './ActionLink.module.css';

type ActionLinkKind = 'internal' | 'external' | 'download';

interface ActionLinkProps {
  /** Ruta del sitio (`internal`, navega sin recargar) o URL completa / archivo (`external`, `download`). */
  readonly href: string;
  readonly kind: ActionLinkKind;
  /** Icono final de los enlaces internos (los externos y las descargas llevan el suyo). */
  readonly icon?: IconName;
  readonly children: ReactNode;
}

/**
 * Enlace de acción en mono y mayúsculas (docs/03-diseno/componentes.md → «Enlace de acción»).
 * Los externos se abren en pestaña nueva con `rel="noopener noreferrer"` y lo dicen al lector de
 * pantalla; el área pulsable mide al menos `--target-min` aunque el texto sea pequeño.
 */
export function ActionLink({ href, kind, icon, children }: ActionLinkProps): ReactNode {
  const t = useT();

  if (kind === 'internal') {
    return (
      <Link to={href} className={styles.link}>
        <span className={styles.text}>{children}</span>
        {icon === undefined ? null : <Icon name={icon} />}
      </Link>
    );
  }

  if (kind === 'download') {
    return (
      <a href={href} className={styles.link} download>
        <span className={styles.text}>{children}</span>
        <Icon name="download" />
      </a>
    );
  }

  return (
    <a href={href} className={styles.link} target="_blank" rel="noopener noreferrer">
      <span className={styles.text}>{children}</span>{' '}
      <span className={styles.hidden}>{t('link.newTab')}</span>
      <Icon name="external" />
    </a>
  );
}
