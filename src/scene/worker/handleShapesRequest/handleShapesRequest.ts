import { generateShapes } from '../../shapes/generateShapes/generateShapes';
import { parseShapesRequest, type ShapesResponse, transferablesOf } from '../protocol/protocol';

/**
 * Lo que hace el worker con cada mensaje (función pura; la entrada, `shapes.worker.ts`, solo la conecta): valida
 * la petición, genera y responde con las matrices transferibles. Nunca lanza: un fallo vuelve como
 * `{ ok: false, reason }`.
 */
export function handleShapesRequest(data: unknown): {
  readonly message: ShapesResponse;
  readonly transfer: ArrayBuffer[];
} {
  const parsed = parseShapesRequest(data);
  if (!parsed.ok) return { message: { ok: false, reason: parsed.reason }, transfer: [] };
  try {
    const shapes = generateShapes(parsed.value);
    return { message: { ok: true, shapes }, transfer: transferablesOf(shapes) };
  } catch (error) {
    return {
      message: { ok: false, reason: error instanceof Error ? error.message : String(error) },
      transfer: [],
    };
  }
}
