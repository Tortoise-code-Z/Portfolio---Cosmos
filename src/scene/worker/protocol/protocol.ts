import {
  type PortraitRequest,
  POSITION_KEYS,
  type ShapeRequest,
  shapeRequestProblem,
  type ShapeSet,
} from '../../shapes/shapeContract/shapeContract';

/**
 * Lo que cruza la frontera del worker de las formas (docs/04-escena/rendimiento.md → «Worker de las formas»).
 * `postMessage` copia o transfiere sin que TypeScript garantice nada al otro lado, así que se valida a los dos
 * lados, a mano: el worker, la petición; el hilo principal, la respuesta.
 */

export type ShapesResponse =
  | { readonly ok: true; readonly shapes: ShapeSet }
  | { readonly ok: false; readonly reason: string };

/** El encargo del retrato (`kind` lo distingue del de las formas, que va sin él). */
export interface PortraitMessage extends PortraitRequest {
  readonly kind: 'portrait';
}

export type PortraitResponse =
  | { readonly ok: true; readonly portrait: Float32Array }
  | { readonly ok: false; readonly reason: string };

export type Parsed<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly reason: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** Lo que llega al worker: una petición válida, o por qué no lo es. */
export function parseShapesRequest(data: unknown): Parsed<ShapeRequest> {
  if (!isRecord(data)) return { ok: false, reason: 'the request is not an object' };
  const { count, seed, plates } = data;
  if (typeof count !== 'number' || typeof seed !== 'number') {
    return { ok: false, reason: 'count and seed must be numbers' };
  }
  if (!Array.isArray(plates) || !plates.every((label) => typeof label === 'number')) {
    return { ok: false, reason: 'plates must be an array of numbers' };
  }
  const request: ShapeRequest = { count, seed, plates };
  const problem = shapeRequestProblem(request);
  return problem === null ? { ok: true, value: request } : { ok: false, reason: problem };
}

/** ¿Es un encargo del retrato? (Lo demás se trata como encargo de las formas.) */
export function isPortraitMessage(data: unknown): boolean {
  return isRecord(data) && data.kind === 'portrait';
}

/** Lo que llega al worker con `kind: 'portrait'`: un `count` y una semilla que valen, o por qué no. */
export function parsePortraitRequest(data: unknown): Parsed<PortraitRequest> {
  if (!isRecord(data)) return { ok: false, reason: 'the request is not an object' };
  const { count, seed } = data;
  if (typeof count !== 'number' || typeof seed !== 'number') {
    return { ok: false, reason: 'count and seed must be numbers' };
  }
  const problem = shapeRequestProblem({ count, seed, plates: [] });
  return problem === null ? { ok: true, value: { count, seed } } : { ok: false, reason: problem };
}

/** Lo que vuelve del worker para el retrato de `count` partículas: su `pPor` (4 por partícula), o por qué no. */
export function parsePortraitResponse(data: unknown, count: number): Parsed<Float32Array> {
  if (!isRecord(data)) return { ok: false, reason: 'the response is not an object' };
  if (data.ok === false) {
    return { ok: false, reason: typeof data.reason === 'string' ? data.reason : 'rejected' };
  }
  return data.ok === true && isArrayOfLength(data.portrait, count * 4)
    ? { ok: true, value: data.portrait }
    : { ok: false, reason: 'the portrait array has the wrong type or length' };
}

/** Lo que vuelve del worker para un `count` pedido: las 5 matrices con sus longitudes, o por qué no. */
export function parseShapesResponse(data: unknown, count: number): Parsed<ShapeSet> {
  if (!isRecord(data)) return { ok: false, reason: 'the response is not an object' };
  if (data.ok === false) {
    return { ok: false, reason: typeof data.reason === 'string' ? data.reason : 'rejected' };
  }
  if (data.ok !== true || !isRecord(data.shapes)) {
    return { ok: false, reason: 'the response has no shapes' };
  }
  const shapes = data.shapes;
  if (shapes.count !== count) return { ok: false, reason: 'the shapes have another count' };
  const lengthsMatch =
    POSITION_KEYS.every((key) => isArrayOfLength(shapes[key], count * 3)) &&
    isArrayOfLength(shapes.rand, count * 4);
  if (!lengthsMatch) return { ok: false, reason: 'the shape arrays have the wrong type or length' };
  return { ok: true, value: shapes as unknown as ShapeSet };
}

function isArrayOfLength(value: unknown, length: number): value is Float32Array {
  return value instanceof Float32Array && value.length === length;
}

/** Los buffers que se transfieren (sin copiar) con una respuesta. */
export function transferablesOf(shapes: ShapeSet): ArrayBuffer[] {
  return [...POSITION_KEYS.map((key) => shapes[key].buffer), shapes.rand.buffer].filter(
    (buffer): buffer is ArrayBuffer => buffer instanceof ArrayBuffer,
  );
}
