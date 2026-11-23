import { handlePortraitRequest } from './handlePortraitRequest/handlePortraitRequest';
import { handleShapesRequest } from './handleShapesRequest/handleShapesRequest';
import { isPortraitMessage, type PortraitResponse, type ShapesResponse } from './protocol/protocol';

/**
 * Entrada del worker de las formas (docs/04-escena/rendimiento.md → «Worker de las formas»). Solo conecta el
 * mensaje con `handleShapesRequest` o, si es el encargo del retrato, con `handlePortraitRequest`, que es donde
 * está la lógica (y sus tests), y responde con un fallo si algo se rompe al contestar: por eso queda fuera de la cobertura (vitest.config.ts), como `root.tsx`. Cada
 * encargo es un worker nuevo.
 */
const scope = self as unknown as {
  onmessage: ((event: MessageEvent) => void) | null;
  postMessage: (message: unknown, transfer: Transferable[]) => void;
};

scope.onmessage = (event) => {
  const data: unknown = event.data;
  void (
    isPortraitMessage(data)
      ? handlePortraitRequest(data)
      : Promise.resolve(handleShapesRequest(data))
  )
    .then(({ message, transfer }) => {
      scope.postMessage(message, transfer);
    })
    .catch((error: unknown) => {
      // Si falla al responder (p. ej. al transferir), el hilo principal lo sabe ya, no al vencer su plazo.
      const reason = error instanceof Error ? error.message : String(error);
      scope.postMessage({ ok: false, reason } satisfies ShapesResponse & PortraitResponse, []);
    });
};
