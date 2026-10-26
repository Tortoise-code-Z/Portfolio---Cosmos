/**
 * El bucle de frames de la escena (docs/04-escena/rendimiento.md → «Robustez», ADR-027). El lienzo va con
 * `frameloop="never"` y este bucle pide cada frame y llama a `step` (que hace `advance()` de React Three Fiber:
 * todos los `useFrame` y `gl.render`) dentro de un solo `try`. Lo que lanza un frame se registraría en cada
 * `requestAnimationFrame` sin que lo recogiera ningún *error boundary*: aquí el primer error para el bucle y
 * avisa una vez. La pausa (F3.5) será no pedir el frame siguiente.
 */

export interface FrameLoopOptions {
  /** Un frame: los segundos desde que arrancó el bucle. */
  readonly step: (seconds: number) => void;
  /** El primer error de un frame. El bucle ya está parado. */
  readonly onError: (error: unknown) => void;
  readonly request?: (callback: FrameRequestCallback) => number;
  readonly cancel?: (handle: number) => void;
}

const MS_PER_SECOND = 1000;

/** Arranca el bucle y devuelve cómo pararlo. */
export function startFrameLoop({
  step,
  onError,
  request = (callback) => window.requestAnimationFrame(callback),
  cancel = (handle) => {
    window.cancelAnimationFrame(handle);
  },
}: FrameLoopOptions): () => void {
  let start: number | null = null;
  let running = true;
  let handle: number | null = null;

  function stop(): void {
    running = false;
    if (handle !== null) cancel(handle);
    handle = null;
  }

  function frame(timestamp: number): void {
    if (!running) return;
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
  return stop;
}
