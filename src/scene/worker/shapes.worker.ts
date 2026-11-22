import { handlePortraitRequest } from './handlePortraitRequest/handlePortraitRequest';
import { handleShapesRequest } from './handleShapesRequest/handleShapesRequest';
import { isPortraitMessage } from './protocol/protocol';

/**
 * Entrada del worker de las formas (docs/04-escena/rendimiento.md → «Worker de las formas»). Solo conecta el
 * mensaje con `handleShapesRequest` o, si es el encargo del retrato, con `handlePortraitRequest`, que es donde
 * está la lógica (y sus tests): por eso queda fuera de la cobertura (vitest.config.ts), como `root.tsx`. Cada
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
  ).then(({ message, transfer }) => {
    scope.postMessage(message, transfer);
  });
};
