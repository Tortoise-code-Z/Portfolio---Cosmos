import { generatePortrait, type PortraitPixels } from '../../shapes/portrait/portrait';
import { mulberry32, subSeed } from '../../shapes/prng/prng';
import { decodePortrait } from '../decodePortrait/decodePortrait';
import { parsePortraitRequest, type PortraitResponse } from '../protocol/protocol';

/**
 * Lo que hace el worker con el encargo del retrato (como `handleShapesRequest`): valida, descarga y lee las
 * imágenes (`decode`; los tests pasan unas hechas a mano), genera y responde con `pPor` transferible. Nunca
 * lanza: un fallo vuelve como `{ ok: false, reason }`.
 */
export async function handlePortraitRequest(
  data: unknown,
  decode: () => Promise<PortraitPixels> = decodePortrait,
): Promise<{ readonly message: PortraitResponse; readonly transfer: ArrayBuffer[] }> {
  const parsed = parsePortraitRequest(data);
  if (!parsed.ok) return { message: { ok: false, reason: parsed.reason }, transfer: [] };
  try {
    const { count, seed } = parsed.value;
    const portrait = new Float32Array(count * 4);
    generatePortrait(count, mulberry32(subSeed(seed, 'portrait')), await decode(), portrait);
    return { message: { ok: true, portrait }, transfer: [portrait.buffer] };
  } catch (error) {
    return {
      message: { ok: false, reason: error instanceof Error ? error.message : String(error) },
      transfer: [],
    };
  }
}
