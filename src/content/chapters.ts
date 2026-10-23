// Capítulos del viaje en orden (docs/02-experiencia/navegacion.md → «Rutas y URLs»): el ancla es la
// misma en los dos idiomas y el inicio no lleva. Lo leen los capítulos, el raíl y el mapeo de scroll.

/** Posición del capítulo en el viaje: también es el valor de `m` en reposo (scroll-y-escena.md). */
export type ChapterIndex = 0 | 1 | 2 | 3 | 4;

export type ChapterAnchor = 'about' | 'skills' | 'projects' | 'contact';

export const CHAPTER_ANCHORS: Readonly<Record<ChapterIndex, ChapterAnchor | null>> = {
  0: null,
  1: 'about',
  2: 'skills',
  3: 'projects',
  4: 'contact',
};
