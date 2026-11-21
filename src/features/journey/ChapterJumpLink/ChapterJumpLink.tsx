import type { MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router';

import { chapterHash, type ChapterIndex } from '~/content/chapters';
import { isPlainClick } from '~/lib/events/isPlainClick/isPlainClick';
import { homePath } from '~/lib/i18n/paths/paths';
import { useLocale } from '~/lib/i18n/useT/useT';
import { jumpToChapter } from '~/lib/scroll/jumpToChapter/jumpToChapter';

import { findChapter } from '../chapterDom/chapterDom';

interface ChapterJumpLinkProps {
  /** El capítulo al que lleva. */
  readonly chapter: ChapterIndex;
  readonly className?: string | undefined;
  readonly children: ReactNode;
}

/**
 * Un enlace de verdad a un capítulo del viaje (`/es#contact`) desde dentro del viaje: «Skip transmission» de una
 * transmisión y «Touchdown» de Mission control. Un clic normal salta al capítulo con el foco en su título, como el
 * raíl; con Ctrl/Cmd, otro botón o sin el capítulo en la página, el enlace hace lo suyo (abrir pestaña, navegar).
 */
export function ChapterJumpLink({ chapter, className, children }: ChapterJumpLinkProps): ReactNode {
  const locale = useLocale();
  const hash = chapterHash(chapter);

  const onClick = (event: MouseEvent): void => {
    if (!isPlainClick(event)) return;
    const target = findChapter(chapter);
    if (target === null) return;
    event.preventDefault();
    jumpToChapter(target, { hash });
  };

  return (
    <Link to={`${homePath(locale)}${hash}`} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
