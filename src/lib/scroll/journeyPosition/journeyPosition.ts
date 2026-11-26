import { clamp } from '../../math/clamp/clamp';
import { segmentAt, stepAt, type ChapterLayout, type JourneyStep } from '../mapM/mapM';

/**
 * La posición en los tramos (C.7 · naves; ADR-041; docs/02-experiencia/scroll-y-escena.md → «Posición en los
 * tramos»): el tramo en el que se lee y lo recorrido de él, en línea recta (`j = i + f`, con `f` de 0 a 1). Es la
 * segunda coordenada del viaje, junto a `m`: en la llegada y la salida de una nave `m` se queda quieta (la cámara, el
 * HUD y el raíl no se mueven) y `j` sigue avanzando. De ella salen las formas y el avance de la nave
 * (`journeyValue`, con los pasos de `lib/scroll/shapeTrack`). Se mide sobre los mismos tramos que `m` (`mapM`, bajo
 * la barra): un tramo que mide 0 (los huecos de las naves con movimiento reducido) se salta. Sin tramos, 0.
 */
export function journeyPosition(y: number, layout: ChapterLayout): number {
  const index = segmentAt(y, layout);
  const box = layout[index];
  if (box === undefined) return 0;
  return index + (box.height > 0 ? clamp((y - box.top) / box.height, 0, 1) : 1);
}

/**
 * Lo que vale en la posición `j` una cifra que se mide por tramos (`steps`, uno por tramo, como los de `mapM`): la del
 * tramo `floor(j)` a su fracción (`stepAt`). El último tramo se queda en su `base`, como en `mapM`. Una `j` que no es un
 * número cuenta como el principio; más allá de los tramos, el último. Sin pasos, 0.
 */
export function journeyValue(j: number, steps: readonly JourneyStep[]): number {
  const last = steps.length - 1;
  const lastStep = steps[last];
  if (lastStep === undefined) return 0;
  const at = clamp(Number.isNaN(j) ? 0 : j, 0, steps.length);
  const index = Math.floor(at);
  // Más allá del último tramo (`j` = número de tramos), el último.
  const step = steps[index] ?? lastStep;
  return index >= last ? lastStep.base : stepAt(step, at - index);
}
