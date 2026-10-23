import { smoothstep } from '../../math/smoothstep/smoothstep';

/** Inicio (px desde el principio del documento) y altura de un capítulo. */
export interface ChapterBox {
  readonly top: number;
  readonly height: number;
}

/** Los capítulos medidos, en orden. */
export type ChapterLayout = readonly ChapterBox[];

/**
 * Pasa los capítulos medidos a posiciones de scroll cuando una barra fija tapa `offset` px arriba:
 * cada capítulo «empieza» en el scroll que lo deja justo bajo la barra (`top − offset`, nunca antes de
 * 0) y mide hasta el siguiente. Así un ancla (`/#projects`) da su índice exacto y arriba del todo `m`
 * sigue siendo 0: la barra no adelanta la explosión. El último conserva su altura.
 */
export function toScrollLayout(layout: ChapterLayout, offset: number): ChapterLayout {
  const starts = layout.map(({ top }) => Math.max(0, top - offset));
  return layout.map(({ height }, index) => {
    const start = starts[index] ?? 0;
    const next = starts[index + 1];
    return { top: start, height: next === undefined ? height : next - start };
  });
}

/**
 * Traduce una posición de scroll `y` (px) al valor continuo `m` de 0 al último capítulo
 * (docs/02-experiencia/scroll-y-escena.md → «Cálculo de m»). En el capítulo `i` que contiene `y`,
 * `m = i + smoothstep(ventana_i, 1, f)`, con `f` la fracción recorrida: la forma se queda quieta hasta
 * su ventana y llega a la siguiente justo al empezar el capítulo siguiente. Sin capítulos, 0.
 *
 * `morphStart[i]` es la ventana del capítulo `i` (`CHAPTER_MORPH_START`); si falta, el cambio ocupa todo
 * el capítulo. Una altura de 0 cuenta como recorrida.
 */
export function mapM(y: number, layout: ChapterLayout, morphStart: readonly number[]): number {
  let index = 0;
  for (const next of layout.slice(1)) {
    if (y < next.top) break;
    index += 1;
  }
  const box = layout[index];
  if (box === undefined) return 0;
  if (index === layout.length - 1) return index;
  const fraction = box.height > 0 ? (y - box.top) / box.height : 1;
  return index + smoothstep(morphStart[index] ?? 0, 1, fraction);
}
