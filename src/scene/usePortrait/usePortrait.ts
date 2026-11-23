import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { SCENE_SEED } from '../config/sceneConfig';
import { loadPortrait } from '../worker/loadShapes/loadShapes';

/**
 * El retrato de la escena (forma 5, docs/04-escena/formas.md → «Retrato»): no se pide con las demás formas, sino
 * cuando `want()` lo pide (`Particles`, al llegar a la tortuga, un tramo antes de la Tierra: `PORTRAIT_LOAD_FROM_M`),
 * en un encargo aparte al worker que descarga sus imágenes. **Un solo encargo por visita**, con el `count` de las
 * formas que había al pedirlo: si después bajan (la degradación en caliente), también con el encargo en marcha, no se
 * pide otra vez ni se cancela; el retrato de `n` partículas es el principio del de más (`generatePortrait`), así que
 * se usa ese trozo. Si falla, no se reintenta: la forma 5 se queda en la Tierra (`uPor` 0). Solo se cancela al
 * desmontar.
 */
export interface ScenePortrait {
  /** `pPor` para el `count` de las formas que se pintan, o `null` (aún no, o falló). */
  readonly portrait: Float32Array | null;
  /** Pide el retrato (una vez basta; las siguientes no hacen nada). Siempre la misma función. */
  readonly want: () => void;
}

interface LoadedPortrait {
  readonly count: number;
  readonly data: Float32Array;
}

export function usePortrait(count: number | null): ScenePortrait {
  const [wanted, setWanted] = useState(false);
  const [loaded, setLoaded] = useState<LoadedPortrait | null>(null);
  /** El `count` del momento de pedirlo: el efecto no depende de él (bajar de nivel no vuelve a pedir). */
  const countRef = useRef(count);
  const want = useCallback(() => {
    setWanted(true);
  }, []);
  const hasCount = count !== null;

  useEffect(() => {
    countRef.current = count;
  }, [count]);

  useEffect(() => {
    const requested = countRef.current;
    if (!wanted || requested === null) return undefined;
    const controller = new AbortController();
    void loadPortrait({ count: requested, seed: SCENE_SEED }, { signal: controller.signal }).then(
      (result) => {
        if (result.ok) {
          setLoaded({ count: requested, data: result.value });
        } else if (result.reason !== 'aborted') {
          // Degradación prevista: la forma 5 se queda en la Tierra (docs/04-escena/rendimiento.md).
          console.warn(
            '[scene] The portrait did not arrive; keeping the Earth',
            result.reason,
            result.detail,
          );
        }
      },
    );
    return () => {
      controller.abort();
    };
  }, [wanted, hasCount]);

  const portrait = useMemo(() => {
    if (loaded === null || count === null || count > loaded.count) return null;
    return count === loaded.count ? loaded.data : loaded.data.subarray(0, count * 4);
  }, [loaded, count]);
  return { portrait, want };
}
