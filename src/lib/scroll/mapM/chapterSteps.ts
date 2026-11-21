import type { JourneyStep } from './mapM';

/**
 * Ayuda de los tests de scroll (no la usa la web): los tramos de un viaje solo de capítulos, sin interludios. El
 * capítulo `i` es la forma `i` y cambia desde `windows[i]`; sin ventana, se queda quieto.
 */
export function chapterSteps(windows: readonly number[], count: number): JourneyStep[] {
  return Array.from({ length: count }, (_, index) => ({
    base: index,
    morphStart: windows[index] ?? null,
  }));
}
