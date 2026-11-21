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
 * Lo que hace la escena en un tramo del viaje (un capítulo o una parte de un interludio): su forma (`base`, la `m` en
 * reposo) y desde qué fracción del tramo cambia hacia la siguiente (`morphStart`), o `null` si se queda quieta todo el
 * tramo (docs/02-experiencia/scroll-y-escena.md → «Tramos del viaje»).
 */
export interface JourneyStep {
  readonly base: number;
  readonly morphStart: number | null;
}

/**
 * Hasta dónde puede quedarse corto un ancla: el navegador redondea el scroll a píxeles enteros y un tramo puede
 * empezar en `2725,4`. Sin margen, `/#mission-log` se leería en About (a diferencia de un capítulo, que en ese píxel ya
 * tiene la `m` del siguiente, un interludio se nota: el raíl).
 */
const ANCHOR_SLACK_PX = 1;

/** El tramo que contiene la posición de scroll `y` (el primero antes de empezar; 0 sin tramos). */
export function segmentAt(y: number, layout: ChapterLayout): number {
  let index = 0;
  for (const next of layout.slice(1)) {
    if (y < next.top - ANCHOR_SLACK_PX) break;
    index += 1;
  }
  return index;
}

/**
 * Traduce una posición de scroll `y` (px) al valor continuo `m` (docs/02-experiencia/scroll-y-escena.md → «Cálculo
 * de m»). En el tramo `i` que contiene `y`, `m = base_i + smoothstep(morphStart_i, 1, f)`, con `f` la fracción
 * recorrida: la forma se queda quieta hasta su ventana y llega a la siguiente justo al empezar el tramo siguiente. Un
 * tramo sin ventana (`null`, o el último) se queda en su `base` (un interludio que para la escena). Un tramo sin
 * paso en `steps` es su propio índice y cambia en todo su recorrido. Sin tramos, 0. Una altura de 0 cuenta como
 * recorrida.
 */
export function mapM(y: number, layout: ChapterLayout, steps: readonly JourneyStep[]): number {
  const index = segmentAt(y, layout);
  const box = layout[index];
  if (box === undefined) return 0;
  const step = steps[index] ?? { base: index, morphStart: 0 };
  if (index === layout.length - 1 || step.morphStart === null) return step.base;
  const fraction = box.height > 0 ? (y - box.top) / box.height : 1;
  return step.base + smoothstep(step.morphStart, 1, fraction);
}
