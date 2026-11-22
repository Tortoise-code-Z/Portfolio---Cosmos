import { useCallback, useEffect, useMemo, useState } from 'react';

import { SCENE_SEED } from '../config/sceneConfig';
import { loadPortrait } from '../worker/loadShapes/loadShapes';

/**
 * El retrato de la escena (forma 5, docs/04-escena/formas.md → «Retrato»): no se pide con las demás formas, sino
 * cuando `want()` lo pide (`Particles`, al acercarse a la Tierra: `PORTRAIT_LOAD_FROM_M`), en un encargo aparte al
 * worker que descarga sus imágenes. Si las formas bajan de `count` (la degradación en caliente), no se pide otra vez:
 * el retrato de `n` partículas es el principio del de más (`generatePortrait`), así que se usa ese trozo. Si falla,
 * no se reintenta: la forma 5 se queda en la Tierra (`uPor` 0).
 */
export interface ScenePortrait {
  /** `pPor` para el `count` de las formas que se pintan, o `null` (aún no, o falló). */
  readonly portrait: Float32Array | null;
  /** Pide el retrato (una vez basta; las siguientes no hacen nada). Siempre la misma función. */
  readonly want: () => void;
}

export function usePortrait(count: number | null): ScenePortrait {
  const [wanted, setWanted] = useState(false);
  const [loaded, setLoaded] = useState<{ count: number; data: Float32Array } | null>(null);
  const want = useCallback(() => {
    setWanted(true);
  }, []);

  useEffect(() => {
    if (!wanted || count === null || (loaded !== null && loaded.count >= count)) return undefined;
    const controller = new AbortController();
    void loadPortrait({ count, seed: SCENE_SEED }, { signal: controller.signal }).then((result) => {
      if (result.ok) {
        setLoaded({ count, data: result.value });
      } else if (result.reason !== 'aborted') {
        // Degradación prevista: la forma 5 se queda en la Tierra (docs/04-escena/rendimiento.md).
        console.warn(
          '[scene] The portrait did not arrive; keeping the Earth',
          result.reason,
          result.detail,
        );
      }
    });
    return () => {
      controller.abort();
    };
  }, [wanted, count, loaded]);

  const portrait = useMemo(() => {
    if (loaded === null || count === null || count > loaded.count) return null;
    return count === loaded.count ? loaded.data : loaded.data.subarray(0, count * 4);
  }, [loaded, count]);
  return { portrait, want };
}
