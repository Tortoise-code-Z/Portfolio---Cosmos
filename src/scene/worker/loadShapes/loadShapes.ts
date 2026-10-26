import type { ShapeRequest, ShapeSet } from '../../shapes/shapeContract/shapeContract';
import { parseShapesResponse } from '../protocol/protocol';

/**
 * Pide las formas al worker (docs/04-escena/rendimiento.md → «Worker de las formas»). Un worker por encargo
 * (rendimiento.md): se crea, responde y se cierra; también al vencer el plazo o al cancelar, y una respuesta tardía
 * se ignora. No reintenta: devuelve las formas o el motivo del fallo, y quien llama decide (el arranque
 * reintenta en el hilo principal; la degradación de F3.6, no).
 */

/** Plazo desde que se crea el worker (incluye su descarga), con la página visible u oculta. */
export const SHAPES_WORKER_TIMEOUT_MS = 3000;

export type ShapesFailure =
  /** No se pudo crear el worker (el navegador no lo deja, o no hay `Worker`). */
  | 'unavailable'
  /** El worker no cargó o lanzó (evento `error`). */
  | 'error'
  /** La respuesta no se pudo deserializar (`messageerror`). */
  | 'message-error'
  /** El worker rechazó la petición (`{ ok: false }`). */
  | 'rejected'
  /** La respuesta no trae las 5 matrices con sus longitudes. */
  | 'invalid'
  | 'timeout'
  /** Quien pidió canceló (desmontaje): no es un fallo de la escena. */
  | 'aborted';

export type LoadShapesResult =
  | { readonly ok: true; readonly shapes: ShapeSet }
  | { readonly ok: false; readonly reason: ShapesFailure; readonly detail: string };

export interface LoadShapesOptions {
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
  /** El worker real por defecto; los tests pasan uno falso. */
  readonly createWorker?: () => Worker;
}

/**
 * El worker real. Vite reconoce este patrón exacto (`new Worker(new URL(…, import.meta.url))`) y lo empaqueta
 * en su propio archivo, que se pide solo al llamar aquí.
 */
export function createShapesWorker(): Worker {
  return new Worker(new URL('../shapes.worker.ts', import.meta.url), {
    type: 'module',
    name: 'shapes',
  });
}

const failure = (reason: ShapesFailure, detail: string): LoadShapesResult => ({
  ok: false,
  reason,
  detail,
});

const describe = (error: unknown): string =>
  error instanceof Error ? `${error.name}: ${error.message}` : String(error);

export function loadShapes(
  request: ShapeRequest,
  {
    signal,
    timeoutMs = SHAPES_WORKER_TIMEOUT_MS,
    createWorker = createShapesWorker,
  }: LoadShapesOptions = {},
): Promise<LoadShapesResult> {
  return new Promise((resolve) => {
    if (signal?.aborted === true) {
      resolve(failure('aborted', 'cancelled before starting'));
      return;
    }
    let worker: Worker;
    try {
      worker = createWorker();
    } catch (error) {
      resolve(failure('unavailable', describe(error)));
      return;
    }

    let settled = false;
    function finish(result: LoadShapesResult): void {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      worker.terminate();
      resolve(result);
    }
    function onAbort(): void {
      finish(failure('aborted', 'cancelled'));
    }

    const timer = setTimeout(() => {
      finish(failure('timeout', `no answer in ${String(timeoutMs)} ms`));
    }, timeoutMs);
    signal?.addEventListener('abort', onAbort, { once: true });

    worker.onmessage = (event: MessageEvent) => {
      const data: unknown = event.data;
      const parsed = parseShapesResponse(data, request.count);
      if (parsed.ok) {
        finish({ ok: true, shapes: parsed.value });
        return;
      }
      const rejected =
        typeof data === 'object' && data !== null && 'ok' in data && data.ok === false;
      finish(failure(rejected ? 'rejected' : 'invalid', parsed.reason));
    };
    worker.onerror = (event: ErrorEvent) => {
      // Sin esto el navegador lo registra además como error no capturado: aquí se registra con contexto.
      event.preventDefault();
      finish(failure('error', event.message || 'the worker failed to load or threw'));
    };
    worker.onmessageerror = () => {
      finish(failure('message-error', 'the response could not be deserialised'));
    };

    try {
      worker.postMessage(request);
    } catch (error) {
      finish(failure('error', describe(error)));
    }
  });
}
