import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { profile } from '~/content/profile';
import { useLocale, useT } from '~/lib/i18n/useT/useT';

import { chapterHref, onChapterLinkClick } from '../goToChapter/goToChapter';
import styles from './AvailabilityChip.module.css';

const toContact = onChapterLinkClick(4);

/**
 * Chip de disponibilidad de la barra (docs/02-experiencia/navegacion.md → «Barra superior»;
 * componentes.md → «Chip de disponibilidad»): un punto turquesa que respira y «Open to work». Es un
 * enlace a Contacto, que hace el mismo salto que «Contact». Solo existe si el perfil dice que busco
 * trabajo, y solo se ve desde md (900 px): por debajo, Contacto y la misión rápida ya lo cuentan.
 */
export function AvailabilityChip(): ReactNode {
  const t = useT();
  const locale = useLocale();
  if (!profile.availability.openToWork) return null;

  return (
    <Link to={chapterHref(locale, 4)} className={styles.chip} onClick={toContact}>
      <span className={styles.dot} aria-hidden="true" />
      {t('nav.availability')}
    </Link>
  );
}
