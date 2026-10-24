import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { useT } from '~/lib/i18n/useT/useT';

import { Icon, type IconName } from '../Icon/Icon';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import styles from './ActionLink.module.css';

type ActionLinkKind = 'internal' | 'external' | 'download' | 'mail';

interface ActionLinkProps {
  /**
   * Ruta del sitio (`internal`, navega sin recargar), URL completa / archivo (`external`, `download`) o
   * dirección de correo sin `mailto:` (`mail`).
   */
  readonly href: string;
  readonly kind: ActionLinkKind;
  /** Icono final de los enlaces internos (los externos y las descargas llevan el suyo). */
  readonly icon?: IconName;
  /** Icono delante del texto de un enlace interno («← Back to the shell»). */
  readonly leadingIcon?: IconName;
  readonly children: ReactNode;
}

/**
 * Enlace de acción en mono y mayúsculas (docs/03-diseno/componentes.md → «Enlace de acción»).
 * Los externos se abren en pestaña nueva con `rel="noopener noreferrer"` y lo dicen al lector de
 * pantalla; el de correo abre el programa de correo en la misma pestaña. El área pulsable mide al
 * menos `--target-min` aunque el texto sea pequeño.
 */
export function ActionLink({
  href,
  kind,
  icon,
  leadingIcon,
  children,
}: ActionLinkProps): ReactNode {
  const t = useT();

  if (kind === 'internal') {
    return (
      <Link to={href} className={styles.link}>
        {leadingIcon === undefined ? null : <Icon name={leadingIcon} />}
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

  if (kind === 'mail') {
    return (
      <a href={`mailto:${href}`} className={styles.link}>
        <span className={styles.text}>{children}</span>
      </a>
    );
  }

  return (
    <a href={href} className={styles.link} target="_blank" rel="noopener noreferrer">
      <span className={styles.text}>{children}</span>{' '}
      <VisuallyHidden>{t('link.newTab')}</VisuallyHidden>
      <Icon name="external" />
    </a>
  );
}
