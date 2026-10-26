import { Canvas, type RootState } from '@react-three/fiber';
import { useEffect, useRef, type ReactNode } from 'react';

import { LEVEL_SETTINGS, type RenderLevel } from '~/lib/device/sceneLevel/sceneLevel';

import { watchContextLoss } from '../contextLoss/contextLoss';
import styles from './SceneRoot.module.css';

/** Por qué la escena se rinde y pide el modo sin WebGL. */
export type SceneFailure = 'context-lost-twice' | 'context-not-restored' | 'shader-error';

export interface SceneRootProps {
  /** Nivel con el que se monta (lo eligió `SceneMount`): fija el DPR máximo y, desde F3.2, las partículas. */
  readonly level: RenderLevel;
  /**
   * La escena no puede seguir: `SceneMount` pasa a sin WebGL y la desmonta. Un error al crear el contexto
   * o al pintar no llega aquí: se lanza y lo recoge el `ErrorBoundary` de la escena.
   */
  readonly onFail: (reason: SceneFailure) => void;
}

/** El DPR mínimo: nunca por debajo de 1 píxel por píxel CSS. */
const MIN_DPR = 1;

/**
 * React Three Fiber pone `pointer-events: auto` en línea al envoltorio del lienzo (para sus eventos):
 * taparía los enlaces de debajo. La escena no recibe puntero (el de la gravedad llegará de `window`, F4).
 */
const NO_POINTER = { pointerEvents: 'none' } as const;

/**
 * Raíz de la escena (docs/05-tecnico/arquitectura.md → «Carga de la escena»). Llega en su propio chunk,
 * con Three.js y React Three Fiber, después de la primera pintura: el JS inicial no la incluye. Hoy es el
 * lienzo vacío, fijo detrás del contenido, decorativo (`aria-hidden`) y sin puntero; las formas llegan en
 * F3.2–F3.3. Pinta bajo demanda (`frameloop="demand"`): sin nada que animar, un solo frame.
 */
export default function SceneRoot({ level, onFail }: SceneRootProps): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onFailRef = useRef(onFail);

  useEffect(() => {
    onFailRef.current = onFail;
  }, [onFail]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return undefined;
    return watchContextLoss(canvas, (reason) => {
      console.error('[scene] WebGL context lost for good', reason);
      onFailRef.current(reason);
    });
  }, []);

  function onCreated({ gl }: RootState): void {
    // Un shader que no compila no lanza: Three solo lo registra. Aquí se registra y se pasa a sin WebGL.
    gl.debug.onShaderError = (context, program) => {
      console.error('[scene] Shader failed to compile', context.getProgramInfoLog(program));
      onFailRef.current('shader-error');
    };
  }

  return (
    <div className={styles.scene} aria-hidden="true">
      <Canvas
        ref={canvasRef}
        style={NO_POINTER}
        dpr={[MIN_DPR, LEVEL_SETTINGS[level].maxDpr]}
        frameloop="demand"
        gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
        onCreated={onCreated}
      />
    </div>
  );
}
