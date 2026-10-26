/**
 * Pérdida del contexto WebGL en caliente (docs/02-experiencia/estados-y-accesibilidad.md → «Sin WebGL»):
 * se intenta restaurar **una vez**. Three.js ya pide la restauración (`preventDefault` en
 * `webglcontextlost`) y rehace su estado al volver; aquí solo se decide cuándo rendirse: si el contexto no
 * vuelve en `timeoutMs`, o si se pierde una segunda vez, se llama a `onGiveUp` (modo sin WebGL).
 */

/** Lo que se espera a que el navegador devuelva el contexto antes de pasar a sin WebGL. */
export const CONTEXT_RESTORE_TIMEOUT_MS = 3000;

export type GiveUpReason = 'context-lost-twice' | 'context-not-restored';

/** Vigila el lienzo y devuelve la función que deja de vigilarlo. */
export function watchContextLoss(
  canvas: HTMLCanvasElement,
  onGiveUp: (reason: GiveUpReason) => void,
  timeoutMs: number = CONTEXT_RESTORE_TIMEOUT_MS,
): () => void {
  let losses = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let gaveUp = false;

  function giveUp(reason: GiveUpReason): void {
    if (gaveUp) return;
    gaveUp = true;
    clearTimeout(timer);
    onGiveUp(reason);
  }

  function onLost(): void {
    losses += 1;
    if (losses > 1) {
      giveUp('context-lost-twice');
      return;
    }
    timer = setTimeout(() => {
      giveUp('context-not-restored');
    }, timeoutMs);
  }

  function onRestored(): void {
    clearTimeout(timer);
    timer = undefined;
  }

  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  return () => {
    clearTimeout(timer);
    canvas.removeEventListener('webglcontextlost', onLost);
    canvas.removeEventListener('webglcontextrestored', onRestored);
  };
}
