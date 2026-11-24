import type { ChapterIndex, InterludeId } from '~/content/chapters';
import { LANDING_SELECTOR } from '~/lib/scroll/jumpToChapter/jumpToChapter';

/**
 * El contrato del viaje con el DOM: cómo se encuentran sus capítulos y su nombre. Lo pintan los
 * componentes de `features/journey` y lo leen la navegación (raíl, barra, Skip) y el mapeo de scroll
 * de la ruta. Vive aparte para que quien lo lea no arrastre ningún componente
 * (docs/05-tecnico/arquitectura.md → «Capas»).
 */

/** Cómo se encuentran los capítulos en el DOM. */
export const CHAPTER_SELECTOR = '[data-chapter]';

/**
 * Cómo se encuentran los tramos del viaje en el DOM, en el orden de `JOURNEY_SEGMENTS`: los capítulos, de cada
 * interludio su pantalla y su cola, y de un capítulo con llegada (el epílogo) el final de la llegada (lo usa el mapeo
 * de scroll; la sección del capítulo mide su llegada).
 */
export const JOURNEY_SEGMENT_SELECTOR = `[data-chapter], [data-interlude], [data-interlude-tail], ${LANDING_SELECTOR}`;

/** Id del nombre (el `h1`): destino de «Skip to content» sin JavaScript. */
export const HERO_TITLE_ID = 'hero-title';

/** La pantalla del interludio `id` en el DOM, o `null` si no está. */
export function findInterlude(id: InterludeId): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-interlude="${id}"]`);
}

/** El capítulo `index` en el DOM (también el inicio, que no tiene ancla), o `null` si no está. */
export function findChapter(index: ChapterIndex): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-chapter="${String(index)}"]`);
}
