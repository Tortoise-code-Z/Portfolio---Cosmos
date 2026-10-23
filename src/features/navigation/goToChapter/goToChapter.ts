import { CHAPTER_ANCHORS, type ChapterIndex } from '~/content/chapters';
import { jumpToChapter } from '~/lib/scroll/jumpToChapter/jumpToChapter';

import { findChapter } from '../../journey/ChapterSection/ChapterSection';

/**
 * Viaja a un capítulo desde la navegación (raíl, barra superior) y deja su ancla en la URL; el inicio,
 * sin ancla (docs/02-experiencia/navegacion.md → «Rutas y URLs»). Devuelve si lo ha encontrado: fuera
 * del viaje no hay capítulos y quien llama deja que el enlace navegue.
 */
export function goToChapter(index: ChapterIndex): boolean {
  const chapter = findChapter(index);
  if (chapter === null) return false;
  const anchor = CHAPTER_ANCHORS[index];
  jumpToChapter(chapter, { hash: anchor === null ? '' : `#${anchor}` });
  return true;
}
