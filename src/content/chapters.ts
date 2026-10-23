// Capítulos del viaje en orden (docs/02-experiencia/navegacion.md → «Rutas y URLs»): el ancla es la
// misma en los dos idiomas y el inicio no lleva. Lo leen los capítulos, el raíl y el mapeo de scroll.

/** Posición del capítulo en el viaje: también es el valor de `m` en reposo (scroll-y-escena.md). */
export type ChapterIndex = 0 | 1 | 2 | 3 | 4;

export type ChapterAnchor = 'about' | 'skills' | 'projects' | 'contact';

/** Los capítulos en orden de lectura. */
export const CHAPTER_INDICES: readonly ChapterIndex[] = [0, 1, 2, 3, 4];

export const CHAPTER_ANCHORS: Readonly<Record<ChapterIndex, ChapterAnchor | null>> = {
  0: null,
  1: 'about',
  2: 'skills',
  3: 'projects',
  4: 'contact',
};

/**
 * Dónde empieza, en cada capítulo, el cambio hacia la forma siguiente: fracción de su altura
 * (scroll-y-escena.md → «Capítulos y alturas», columna «Ventana de morph»). Antes de ese punto la forma
 * se queda quieta; el cambio acaba al empezar el capítulo siguiente. El último no cambia.
 */
export const CHAPTER_MORPH_START: readonly number[] = [0, 0.52, 0.52, 0.55];
