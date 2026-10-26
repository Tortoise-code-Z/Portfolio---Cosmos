import { useEffect, useRef, useState } from 'react';

import { projectEntries } from '~/content/projects/entries';
import { LEVEL_SETTINGS, type RenderLevel } from '~/lib/device/sceneLevel/sceneLevel';
import { lowerSceneLevel } from '~/stores/uiStore/uiStore';

import { assignPlates } from '../config/plateSlots/plateSlots';
import { SCENE_SEED } from '../config/sceneConfig';
import type { ShapeRequest, ShapeSet } from '../shapes/shapeContract/shapeContract';
import { loadShapes } from '../worker/loadShapes/loadShapes';

/**
 * Las formas de la escena para su nivel (docs/04-escena/rendimiento.md → «Worker de las formas»). Se piden al
 * montar y se guardan; F3.3 las pinta. Si el worker falla, se reintenta **una vez** en el hilo principal con
 * el nivel Bajo, y la escena entera baja a Bajo; si eso también falla, Apagado.
 */

/** De dónde llegaron: lo marca `SceneRoot` (`data-shapes`) para que los e2e distingan los dos caminos. */
export type ShapesSource = 'worker' | 'main';

export interface SceneShapes {
  readonly shapes: ShapeSet;
  readonly source: ShapesSource;
}

/** Las placas con proyecto (las mismas en toda la visita: el contenido es estático). */
const PLATES = assignPlates(projectEntries).map(({ label }) => label);

const requestFor = (count: number): ShapeRequest => ({ count, seed: SCENE_SEED, plates: PLATES });

export interface ObtainShapesOptions {
  readonly signal: AbortSignal;
  readonly load?: typeof loadShapes;
  /** Los generadores, en su propio chunk: solo se descargan si hay que reintentar. */
  readonly loadGenerator?: () => Promise<{ generateShapes: (request: ShapeRequest) => ShapeSet }>;
}

const importGenerator = (): Promise<{ generateShapes: (request: ShapeRequest) => ShapeSet }> =>
  import('../shapes/generateShapes/generateShapes');

/**
 * Pide las formas al worker y, si falla, las genera una vez en el hilo principal con el `count` de Bajo.
 * `'aborted'`: se canceló (desmontaje), no hay nada que hacer; `'failed'`: tampoco hubo reintento posible.
 */
export async function obtainShapes(
  count: number,
  { signal, load = loadShapes, loadGenerator = importGenerator }: ObtainShapesOptions,
): Promise<SceneShapes | 'aborted' | 'failed'> {
  const result = await load(requestFor(count), { signal });
  if (result.ok) return { shapes: result.shapes, source: 'worker' };
  if (result.reason === 'aborted') return 'aborted';
  // Degradación prevista y cubierta: se avisa, no es un error (arquitectura.md → «Gestión de errores»).
  console.warn(
    '[scene] The shapes worker failed; generating once on the main thread at the low level',
    result.reason,
    result.detail,
  );
  try {
    const { generateShapes } = await loadGenerator();
    if (signal.aborted) return 'aborted';
    const shapes = generateShapes(requestFor(LEVEL_SETTINGS.low.particles));
    return { shapes, source: 'main' };
  } catch (error) {
    // Desmontado mientras se descargaba el reintento: que su chunk falle ya no es un fallo de la escena.
    if (signal.aborted) return 'aborted';
    console.error('[scene] The shapes could not be generated; continuing without WebGL', error);
    return 'failed';
  }
}

/**
 * Pide las formas del nivel al montar, y otras solo si el nivel pide otro `count` (tras el reintento, que ya
 * las hizo para Bajo, no pide nada). `onFail` pasa a Apagado si no hay formas de ninguna manera.
 */
export function useSceneShapes(
  level: RenderLevel,
  onFail: (reason: 'shapes-failed') => void,
): SceneShapes | null {
  const count = LEVEL_SETTINGS[level].particles;
  const [loaded, setLoaded] = useState<SceneShapes | null>(null);
  const loadedCount = useRef<number | null>(null);
  const onFailRef = useRef(onFail);

  useEffect(() => {
    onFailRef.current = onFail;
  }, [onFail]);

  useEffect(() => {
    if (loadedCount.current === count) return undefined;
    const controller = new AbortController();
    void obtainShapes(count, { signal: controller.signal }).then((result) => {
      if (controller.signal.aborted || result === 'aborted') return;
      if (result === 'failed') {
        onFailRef.current('shapes-failed');
        return;
      }
      loadedCount.current = result.shapes.count;
      setLoaded(result);
      if (result.source === 'main') lowerSceneLevel('low');
    });
    return () => {
      controller.abort();
    };
  }, [count]);

  return loaded;
}
