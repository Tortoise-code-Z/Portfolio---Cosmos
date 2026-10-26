import {
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

type Parsed<T> =
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
