import { useEffect, useRef, useState } from 'react';

import {
  isHandheld,
  nextLowerLevel,
  readHandheldSignals,
  type RenderLevel,
} from '~/lib/device/sceneLevel/sceneLevel';

import { HOT_DEGRADATION } from '../config/sceneConfig';
import { createFpsMeter, type FpsMeter } from '../fpsMeter/fpsMeter';
import type { LowerResult } from '../useSceneShapes/useSceneShapes';

/** Lo que el bucle de frames le pasa a la degradación en caliente. */
export interface HotDegradation {
  /** Un frame pintado a los `seconds` del bucle. Sin asignaciones. */
  sample(seconds: number): void;
  /** La escena se pausa: la ventana en curso no cuenta. */
  discardWindow(): void;
}

export interface HotDegradationOptions {
  /** El nivel actual: se mide si hay uno debajo. */
  readonly level: RenderLevel;
  /** Hay partículas pintadas: sin ellas, los fps no dicen nada de la escena. */
  readonly active: boolean;
  /** Baja un nivel (`useSceneShapes`): pide las formas y, si llegan, formas y nivel cambian en el mismo turno. */
  readonly lowerTo: (level: RenderLevel) => Promise<LowerResult>;
}

/**
 * Degradación en caliente (docs/04-escena/rendimiento.md → «Degradación en caliente»): con partículas pintadas y
 * un nivel por debajo, mide los fps de cada frame (`scene/fpsMeter`); con `slowWindows` ventanas de `windowS`
 * seguidas por debajo de `minFps` (escritorio o móvil; las cifras, en `HOT_DEGRADATION`), pide el nivel de debajo.
 * Mientras llegan sus formas no mide; con el nivel nuevo, empieza de cero (con su calentamiento). Si las formas no
 * llegan, deja de medir el resto de la visita. Nunca sube.
 */
export function useHotDegradation({
  level,
  active,
  lowerTo,
}: HotDegradationOptions): HotDegradation {
  const meter = useRef<FpsMeter | null>(null);
  const levelRef = useRef(level);
  const lowerToRef = useRef(lowerTo);
  /** Una bajada falló: no se mide más en esta visita. */
  const gaveUp = useRef(false);

  useEffect(() => {
    lowerToRef.current = lowerTo;
  }, [lowerTo]);

  useEffect(() => {
    levelRef.current = level;
    meter.current =
      active && !gaveUp.current && nextLowerLevel(level) !== null
        ? createFpsMeter({
            // ¿Móvil? El mismo criterio que la elección inicial, leído al empezar a medir cada nivel.
            minFps: isHandheld(readHandheldSignals())
              ? HOT_DEGRADATION.minFps.handheld
              : HOT_DEGRADATION.minFps.desktop,
            windowS: HOT_DEGRADATION.windowS,
            slowWindows: HOT_DEGRADATION.slowWindows,
            warmupS: HOT_DEGRADATION.warmupS,
          })
        : null;
  }, [level, active]);

  const [degradation] = useState<HotDegradation>(() => ({
    sample(seconds) {
      if (meter.current?.sample(seconds) !== true) return;
      const target = nextLowerLevel(levelRef.current);
      // Mientras llegan las formas no se mide: el nivel nuevo trae su propio medidor.
      meter.current = null;
      if (target === null) return;
      void lowerToRef.current(target).then((result) => {
        if (result === 'kept') gaveUp.current = true;
      });
    },
    discardWindow() {
      meter.current?.discardWindow();
    },
  }));

  return degradation;
}
