import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { profile } from '~/content/profile';
import { useLocale, useT } from '~/lib/i18n/useT/useT';

import { chapterHref, onChapterLinkClick } from '../goToChapter/goToChapter';
import { LanguageSwitch } from '../LanguageSwitch/LanguageSwitch';
import styles from './TopBar.module.css';

/** Logotipo (docs/03-diseno/design-system.md → «Logotipo»): la marca, igual en los dos idiomas. */
const LOGO = 'TORTOISE_CODE';

const toStart = onChapterLinkClick(0);
const toProjects = onChapterLinkClick(3);
const toContact = onChapterLinkClick(4);

/**
 * Barra superior fija (docs/02-experiencia/navegacion.md → «Barra superior»; componentes.md): logo,
 * Projects y Contact (ocultos en móvil: el raíl los sustituye), CV si existe el PDF del idioma y
 * EN / ES. Son enlaces de verdad (`/#projects`): sin JavaScript también llevan a su sitio; en el viaje
 * hacen el mismo salto que el raíl, con el foco en el título. El modo misión rápida y el chip de
 * disponibilidad llegan en F2.6.
 */
export function TopBar(): ReactNode {
  const t = useT();
  const locale = useLocale();
  const cv = profile.cv[locale];

  return (
    <header className={styles.bar}>
      <Link to={chapterHref(locale, 0)} className={styles.logo} onClick={toStart}>
        <span className={styles.logoText}>{LOGO}</span>
      </Link>
      <div className={styles.actions}>
        <Link to={chapterHref(locale, 3)} className={styles.chapterLink} onClick={toProjects}>
          {t('nav.projects')}
        </Link>
        <Link to={chapterHref(locale, 4)} className={styles.chapterLink} onClick={toContact}>
          {t('nav.contact')}
        </Link>
        {cv !== null && (
          <a href={cv} className={styles.link}>
            {t('nav.cv')}
          </a>
        )}
        <LanguageSwitch />
      </div>
    </header>
  );
}
