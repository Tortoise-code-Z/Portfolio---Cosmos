import type { MouseEvent } from 'react';

import { CHAPTER_ANCHORS, type ChapterIndex } from '~/content/chapters';
import type { Locale } from '~/content/types';
import { homePath } from '~/lib/i18n/paths/paths';
import { jumpToChapter } from '~/lib/scroll/jumpToChapter/jumpToChapter';

import { findChapter } from '../../journey/ChapterSection/ChapterSection';

/** Ancla de un capítulo en la URL (`#projects`); el inicio no lleva. */
export function chapterHash(index: ChapterIndex): string {
  const anchor = CHAPTER_ANCHORS[index];
  return anchor === null ? '' : `#${anchor}`;
}

/** Dirección de un capítulo del viaje en un idioma: `/#projects`, `/es#contact`, `/es`. */
export function chapterHref(locale: Locale, index: ChapterIndex): string {
  return `${homePath(locale)}${chapterHash(index)}`;
}

/**
 * Viaja a un capítulo desde la navegación (raíl, barra superior) y deja su ancla en la URL; el inicio,
 * sin ancla (docs/02-experiencia/navegacion.md → «Rutas y URLs»). Devuelve si lo ha encontrado: fuera
 * del viaje no hay capítulos y quien llama deja que el enlace navegue.
 */
export function goToChapter(index: ChapterIndex): boolean {
  const chapter = findChapter(index);
  if (chapter === null) return false;
  jumpToChapter(chapter, { hash: chapterHash(index) });
  return true;
}

/** Clic normal: botón principal y sin teclas que pidan otra pestaña o ventana. */
function isPlainClick(event: MouseEvent): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

/**
 * `onClick` de un enlace a un capítulo (`href="/#projects"`): en el viaje hace el mismo salto que el
 * raíl, con el foco en el título. Con Ctrl/Cmd/Shift/Alt, con otro botón o fuera del viaje, el enlace
 * hace lo suyo (abrir pestaña, navegar).
 */
export function onChapterLinkClick(index: ChapterIndex): (event: MouseEvent) => void {
  return (event) => {
    if (!isPlainClick(event)) return;
    if (goToChapter(index)) event.preventDefault();
  };
}
