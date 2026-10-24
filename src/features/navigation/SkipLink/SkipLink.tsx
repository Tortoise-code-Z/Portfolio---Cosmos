import type { ReactNode } from 'react';

import { useT } from '~/lib/i18n/useT/useT';

import { HERO_TITLE_ID } from '../../journey/chapterDom/chapterDom';
import { onChapterLinkClick } from '../goToChapter/goToChapter';
import styles from './SkipLink.module.css';

const toStart = onChapterLinkClick(0);

/**
 * «Skip to content» (docs/02-experiencia/navegacion.md → «Teclado y foco»): lo primero que se enfoca,
 * oculto hasta entonces. Salta la barra hasta el principio de `<main>`, con el foco en el nombre. Sin
 * JavaScript es un ancla al `h1`.
 */
export function SkipLink(): ReactNode {
  const t = useT();
  return (
    <a href={`#${HERO_TITLE_ID}`} className={styles.skip} onClick={toStart}>
      {t('nav.skip')}
    </a>
  );
}
