import type { MouseEvent } from 'react';

import {
  chapterHash,
  INTERLUDE,
  isInterludeStop,
  stopChapter,
  type ChapterIndex,
  type InterludeId,
  type JourneyStop,
} from '~/content/chapters';
import type { Locale } from '~/content/types';
import { isPlainClick } from '~/lib/events/isPlainClick/isPlainClick';
import { homePath } from '~/lib/i18n/paths/paths';
import { jumpToChapter } from '~/lib/scroll/jumpToChapter/jumpToChapter';

import { findChapter, findInterlude } from '../../journey/chapterDom/chapterDom';

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

/** El ancla de un interludio (`#mission-log`). */
export function interludeHash(id: InterludeId): string {
  return `#${INTERLUDE[id].anchor}`;
}

/** La URL de un interludio en el idioma: el inicio con su ancla. */
export function interludeHref(locale: Locale, id: InterludeId): string {
  return `${homePath(locale)}${interludeHash(id)}`;
}

/**
 * La URL de una parada del raíl en el idioma: un capítulo o un interludio. Con ella el cambio de idioma te deja
 * donde estabas, también leyendo un interludio (navegacion.md → «Idioma»).
 */
export function stopHref(locale: Locale, stop: JourneyStop): string {
  return isInterludeStop(stop)
    ? interludeHref(locale, stop)
    : chapterHref(locale, stopChapter(stop));
}

/** Como `onChapterLinkClick`, para un interludio: salta a su pantalla con el foco en su título. */
export function onInterludeLinkClick(id: InterludeId): (event: MouseEvent) => void {
  return (event) => {
    if (!isPlainClick(event)) return;
    const interlude = findInterlude(id);
    if (interlude === null) return;
    event.preventDefault();
    jumpToChapter(interlude, { hash: interludeHash(id) });
  };
}
