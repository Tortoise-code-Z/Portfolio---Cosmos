import type { MouseEvent, ReactNode } from 'react';

import { useT } from '~/lib/i18n/useT/useT';

import { HERO_TITLE_ID } from '../../journey/chapterDom/chapterDom';
import { isPlainClick, onChapterLinkClick } from '../goToChapter/goToChapter';
import styles from './SkipLink.module.css';

const toStart = onChapterLinkClick(0);

interface SkipLinkProps {
  /**
   * Id del título al que salta fuera del viaje (el nombre del proyecto, con `tabindex="-1"`). Sin él,
   * salta al principio del viaje.
   */
  readonly targetId?: string;
}

/** Fuera del viaje: lleva el foco al título (que se desplaza a la vista) sin dejar ancla en la URL. */
function focusTarget(targetId: string): (event: MouseEvent) => void {
  return (event) => {
    if (!isPlainClick(event)) return;
    const target = document.getElementById(targetId);
    if (target === null) return;
    event.preventDefault();
    target.focus();
  };
}

/**
 * «Skip to content» (docs/02-experiencia/navegacion.md → «Teclado y foco»): lo primero que se enfoca,
 * oculto hasta entonces. Salta la barra hasta el principio de `<main>`, con el foco en el título: en el
 * viaje, el nombre del hero; en una página de proyecto, el nombre del proyecto. Sin JavaScript es un
 * ancla a ese título.
 */
export function SkipLink({ targetId }: SkipLinkProps): ReactNode {
  const t = useT();
  const target = targetId ?? HERO_TITLE_ID;
  return (
    <a
      href={`#${target}`}
      className={styles.skip}
      onClick={targetId === undefined ? toStart : focusTarget(targetId)}
    >
      {t('nav.skip')}
    </a>
  );
}
