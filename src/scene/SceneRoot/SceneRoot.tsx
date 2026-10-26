import { Canvas, type RootState } from '@react-three/fiber';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { LEVEL_SETTINGS, type RenderLevel } from '~/lib/device/sceneLevel/sceneLevel';

import { watchContextLoss } from '../contextLoss/contextLoss';
import { useSceneShapes } from '../useSceneShapes/useSceneShapes';
import styles from './SceneRoot.module.css';

/** Por qué la escena se rinde y pide el modo sin WebGL. */
export type SceneFailure =
  | 'context-lost-twice'
  | 'context-not-restored'
  | 'shader-error'
  /** Ni el worker ni el reintento en el hilo principal dieron las formas. */
  | 'shapes-failed';

export interface SceneRootProps {
  /** Nivel (lo eligió `SceneMount`; puede bajar): fija el DPR máximo y cuántas partículas se generan. */
  readonly level: RenderLevel;
  /**
   * La escena no puede seguir: `SceneMount` pasa a sin WebGL y la desmonta. Un error al crear el contexto
   * o al renderizar con React no llega aquí: se lanza y lo recoge el `ErrorBoundary` de la escena. Un error
   * dentro del bucle de frames (`useFrame`, `gl.render`) no lo recoge ningún boundary: corre en el
   * `requestAnimationFrame` de R3F (docs/04-escena/rendimiento.md → «Robustez»).
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
 * lienzo vacío, fijo detrás del contenido, decorativo (`aria-hidden`) y sin puntero. Al montar pide las
 * formas (`useSceneShapes`: worker y, si falla, reintento) y las guarda; F3.3 las pinta. Pinta bajo demanda
 * (`frameloop="demand"`): sin nada que animar, un solo frame.
 */
export default function SceneRoot({ level, onFail }: SceneRootProps): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onFailRef = useRef(onFail);
  /** El `invalidate` del lienzo (llega con `onCreated`): pide un frame al recuperar el contexto. */
  const invalidateRef = useRef<(() => void) | null>(null);
  /** El renderer existe (`onCreated`): lo esperan los e2e para dar la escena por montada. */
  const [ready, setReady] = useState(false);
  const shapes = useSceneShapes(level, (reason) => {
    onFailRef.current(reason);
  });

  useEffect(() => {
    onFailRef.current = onFail;
  }, [onFail]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return undefined;
    return watchContextLoss(canvas, {
      onGiveUp: (reason) => {
        console.error('[scene] WebGL context lost for good', reason);
        onFailRef.current(reason);
      },
      // Three rehace su estado al volver, pero no pinta: con `frameloop="demand"` hay que pedírselo.
      onRestored: () => {
        invalidateRef.current?.();
      },
    });
  }, []);

  function onCreated({ gl, invalidate }: RootState): void {
    invalidateRef.current = invalidate;
    // Un shader que no compila no lanza: Three solo lo registra, y con un `onShaderError` propio ni eso.
    // Aquí se registra todo lo que Three habría escrito (el programa y cada shader, con sus líneas) y se
    // pasa a sin WebGL.
    gl.debug.onShaderError = (context, program, vertexShader, fragmentShader) => {
      console.error('[scene] Shader failed to compile', {
        program: context.getProgramInfoLog(program),
        vertex: context.getShaderInfoLog(vertexShader),
        fragment: context.getShaderInfoLog(fragmentShader),
      });
      onFailRef.current('shader-error');
    };
    setReady(true);
  }

  return (
    <div
      className={styles.scene}
      aria-hidden="true"
      data-ready={ready ? 'true' : undefined}
      data-shapes={shapes?.source}
    >
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
