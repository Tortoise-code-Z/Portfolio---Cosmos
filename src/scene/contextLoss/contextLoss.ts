/**
 * Pérdida del contexto WebGL en caliente (docs/02-experiencia/estados-y-accesibilidad.md → «Sin WebGL» y
 * docs/04-escena/rendimiento.md → «Robustez»): se intenta restaurar **una vez**. Three.js ya pide la
 * restauración (`preventDefault` en `webglcontextlost`) y rehace su estado al volver; aquí solo se decide
 * cuándo rendirse: si el contexto no vuelve en `timeoutMs` **con la página a la vista**, o si se pierde una
 * segunda vez con la página a la vista, se llama a `onGiveUp` (modo sin WebGL). Cuando vuelve no hay nada que
 * hacer aquí: con el bucle de frames de la escena (ADR-027) se pinta el siguiente frame, o el primero al salir de
 * la pausa, y el color de fondo se repone en `onCreated` (este oyente puede ir antes que el de Three).
 *
 * Con la página oculta el plazo no corre: un móvil libera la GPU al pasar a otra app y no la devuelve hasta
 * que la página se vuelve a ver. Esa pérdida no gasta el intento; el plazo arranca (entero) al volver a la
 * vista, y se para si la página se oculta antes de que el contexto vuelva.
 */

/** Lo que se espera, con la página a la vista, a que el navegador devuelva el contexto. */
export const CONTEXT_RESTORE_TIMEOUT_MS = 3000;

export type GiveUpReason = 'context-lost-twice' | 'context-not-restored';

export interface ContextLossHandlers {
  /** El contexto no va a volver: hay que pasar a sin WebGL. Se llama como mucho una vez. */
  readonly onGiveUp: (reason: GiveUpReason) => void;
  readonly timeoutMs?: number;
}

/** Vigila el lienzo y devuelve la función que deja de vigilarlo. */
export function watchContextLoss(
  canvas: HTMLCanvasElement,
  { onGiveUp, timeoutMs = CONTEXT_RESTORE_TIMEOUT_MS }: ContextLossHandlers,
): () => void {
  const doc = canvas.ownerDocument;
  /** Pérdidas con la página a la vista: la segunda agota el intento. */
  let visibleLosses = 0;
  /** El contexto está perdido y aún no ha vuelto. */
  let lost = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let gaveUp = false;

  const isHidden = (): boolean => doc.visibilityState === 'hidden';

  function stopClock(): void {
    clearTimeout(timer);
    timer = undefined;
  }

  function startClock(): void {
    stopClock();
    timer = setTimeout(() => {
      giveUp('context-not-restored');
    }, timeoutMs);
  }

  function giveUp(reason: GiveUpReason): void {
    if (gaveUp) return;
    gaveUp = true;
    stopClock();
    onGiveUp(reason);
  }

  function onLost(): void {
    if (gaveUp) return;
    lost = true;
    // Oculta: lo provoca el sistema al esconder la página. El plazo arranca al volver a la vista.
    if (isHidden()) return;
    visibleLosses += 1;
    if (visibleLosses > 1) {
      giveUp('context-lost-twice');
      return;
    }
    startClock();
  }

  function onContextRestored(): void {
    lost = false;
    stopClock();
  }

  function onVisibilityChange(): void {
    if (!lost || gaveUp) return;
    if (isHidden()) stopClock();
    else startClock();
  }

  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);
  doc.addEventListener('visibilitychange', onVisibilityChange);
  return () => {
    stopClock();
    canvas.removeEventListener('webglcontextlost', onLost);
    canvas.removeEventListener('webglcontextrestored', onContextRestored);
    doc.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
