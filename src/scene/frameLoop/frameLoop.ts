/**
 * El bucle de frames de la escena (docs/04-escena/rendimiento.md → «Robustez», ADR-027). El lienzo va con
 * `frameloop="never"` y este bucle pide cada frame y llama a `step` (que hace `advance()` de React Three Fiber:
 * todos los `useFrame` y `gl.render`) dentro de un solo `try`. Lo que lanza un frame se registraría en cada
 * `requestAnimationFrame` sin que lo recogiera ningún *error boundary*: aquí el primer error para el bucle y
 * avisa una vez. La pausa (pestaña oculta, misión rápida: `scene/pause`) es no pedir el frame siguiente.
 */

export interface FrameLoopOptions {
  /** Un frame: los segundos desde que arrancó el bucle. */
  readonly step: (seconds: number) => void;
  /** El primer error de un frame. El bucle ya está parado. */
  readonly onError: (error: unknown) => void;
  readonly request?: (callback: FrameRequestCallback) => number;
  readonly cancel?: (handle: number) => void;
}

export interface FrameLoop {
  /** Para el bucle para siempre (desmontaje, error). */
  readonly stop: () => void;
  /**
   * En pausa no se pide el frame siguiente (y se cancela el pendiente); al salir de ella se pide uno. Repetir el
   * mismo valor no hace nada, y tras `stop` tampoco. Los segundos siguen contando desde el arranque: el reloj de
   * la escena limita el salto al volver (`sceneClock`).
   */
  readonly setPaused: (paused: boolean) => void;
}

const MS_PER_SECOND = 1000;

/** Arranca el bucle y devuelve cómo pararlo o pausarlo. */
export function startFrameLoop({
  step,
  onError,
  request = (callback) => window.requestAnimationFrame(callback),
  cancel = (handle) => {
    window.cancelAnimationFrame(handle);
  },
}: FrameLoopOptions): FrameLoop {
  let start: number | null = null;
  let running = true;
  let paused = false;
  let handle: number | null = null;

  function stop(): void {
    running = false;
    if (handle !== null) cancel(handle);
    handle = null;
  }

  function setPaused(value: boolean): void {
    if (!running || value === paused) return;
    paused = value;
    if (paused) {
      if (handle !== null) cancel(handle);
      handle = null;
    } else {
      handle = request(frame);
    }
  }

  function frame(timestamp: number): void {
    // Un frame ya pedido que llega tras parar o pausar (un `cancel` que no llegó a tiempo) no hace nada.
    if (!running || paused) return;
    start ??= timestamp;
    // El siguiente se pide antes: si `step` para el bucle (desmontaje durante el frame), lo cancela.
    handle = request(frame);
    try {
      step((timestamp - start) / MS_PER_SECOND);
    } catch (error) {
      stop();
      onError(error);
    }
  }

  handle = request(frame);
  return { stop, setPaused };
}
