import type { ChapterIndex } from '~/content/chapters';

/**
 * El contrato del viaje con el DOM: cómo se encuentran sus capítulos y su nombre. Lo pintan los
 * componentes de `features/journey` y lo leen la navegación (raíl, barra, Skip) y el mapeo de scroll
 * de la ruta. Vive aparte para que quien lo lea no arrastre ningún componente
 * (docs/05-tecnico/arquitectura.md → «Capas»).
 */

/** Cómo se encuentran los capítulos en el DOM (lo usan el mapeo de scroll y sus tests). */
export const CHAPTER_SELECTOR = '[data-chapter]';

/** Id del nombre (el `h1`): destino de «Skip to content» sin JavaScript. */
export const HERO_TITLE_ID = 'hero-title';

/** El capítulo `index` en el DOM (también el inicio, que no tiene ancla), o `null` si no está. */
export function findChapter(index: ChapterIndex): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-chapter="${String(index)}"]`);
}
