import { Canvas, type RootState } from '@react-three/fiber';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Color } from 'three';

import { watchMediaQuery } from '~/lib/device/mediaQuery/mediaQuery';
import { watchReducedMotion } from '~/lib/device/reducedMotion/reducedMotion';
import { LEVEL_SETTINGS, type RenderLevel } from '~/lib/device/sceneLevel/sceneLevel';
import { sceneStore } from '~/stores/sceneStore/sceneStore';

import { BackgroundStars } from '../BackgroundStars';
import { CameraRig } from '../CameraRig/CameraRig';
import { CAMERA_LENS, WIDE_LAYOUT_QUERY } from '../config/sceneConfig';
import { watchContextLoss } from '../contextLoss/contextLoss';
import { startFrameLoop } from '../frameLoop/frameLoop';
import { Particles } from '../Particles';
import { watchPointer } from '../pointer/pointer';
import { createSceneClock } from '../sceneClock/sceneClock';
import { createSceneFrame } from '../sceneMaterials/sceneMaterials';
import { useSceneShapes } from '../useSceneShapes/useSceneShapes';
import styles from './SceneRoot.module.css';

/** Por qué la escena se rinde y pide el modo sin WebGL. */
export type SceneFailure =
  | 'context-lost-twice'
  | 'context-not-restored'
  | 'shader-error'
  /** Un frame lanzó (en un `useFrame` o en `gl.render`): el bucle se para (ADR-027). */
  | 'frame-error'
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
  /** La escena ha pintado su primer frame con partículas: `SceneMount` funde el punto CSS del hero. */
  readonly onPainted?: () => void;
}

/** El DPR mínimo: nunca por debajo de 1 píxel por píxel CSS. */
const MIN_DPR = 1;

/**
 * React Three Fiber pone `pointer-events: auto` en línea al envoltorio del lienzo (para sus eventos):
 * taparía los enlaces de debajo. La escena no recibe puntero (el de la gravedad llegará de `window`, F4).
 */
const NO_POINTER = { pointerEvents: 'none' } as const;

/** El color de fondo del lienzo: el del espacio (`--color-void`), leído del token (ADR-005). */
const VOID_TOKEN = '--color-void';

/**
 * Raíz de la escena (docs/05-tecnico/arquitectura.md → «Carga de la escena»). Llega en su propio chunk,
 * con Three.js y React Three Fiber, después de la primera pintura: el JS inicial no la incluye. Fija detrás del
 * contenido, decorativa (`aria-hidden`) y sin puntero. Pide las formas al montar (`useSceneShapes`: worker y,
 * si falla, reintento) y las pinta (`Particles`), con las estrellas de fondo; la cámara la lleva `CameraRig`.
 *
 * Los frames los pide su propio bucle (`frameloop="never"` + `startFrameLoop`, ADR-027): antes de cada
 * `advance()` rellena el frame compartido (`m`, reloj, densidad de píxeles…; el ratón y si es escritorio los
 * escriben sus observadores, `watchPointer` y `watchMediaQuery`) y, si un frame lanza, para y pasa a
 * sin WebGL. El lienzo es opaco, del color del espacio, y sin gestión de color ni mapeo de tonos (`linear`,
 * `flat`): los shaders suman la luz tal cual, como el prototipo (particulas-y-shaders.md → «Colores»).
 */
export default function SceneRoot({ level, onFail, onPainted }: SceneRootProps): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onFailRef = useRef(onFail);
  const onPaintedRef = useRef(onPainted);
  /** El renderer existe (`onCreated`): lo esperan los e2e para dar la escena por montada. */
  const [ready, setReady] = useState(false);
  /** Las partículas ya se han pintado: lo esperan los e2e (`data-particles`). */
  const [painted, setPainted] = useState(false);
  const [clock] = useState(createSceneClock);
  const [frame] = useState(createSceneFrame);
  const levelRef = useRef(level);
  const stopLoopRef = useRef<(() => void) | null>(null);
  const shapes = useSceneShapes(level, (reason) => {
    onFailRef.current(reason);
  });

  useEffect(() => {
    onFailRef.current = onFail;
    onPaintedRef.current = onPainted;
    levelRef.current = level;
  }, [onFail, onPainted, level]);

  useEffect(
    () =>
      watchReducedMotion((reduced) => {
        clock.setReduced(reduced);
      }),
    [clock],
  );

  useEffect(
    () =>
      watchMediaQuery(WIDE_LAYOUT_QUERY, (wide) => {
        frame.wide = wide;
      }),
    [frame],
  );

  useEffect(() => watchPointer(frame.pointer), [frame]);

  useEffect(
    () => () => {
      stopLoopRef.current?.();
      stopLoopRef.current = null;
    },
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return undefined;
    // Al volver el contexto, Three rehace su estado y el bucle (continuo) pinta el frame siguiente.
    return watchContextLoss(canvas, {
      onGiveUp: (reason) => {
        console.error('[scene] WebGL context lost for good', reason);
        onFailRef.current(reason);
      },
    });
  }, []);

  function onCreated({ gl, get }: RootState): void {
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
    const voidColour = getComputedStyle(document.documentElement)
      .getPropertyValue(VOID_TOKEN)
      .trim();
    if (voidColour !== '') gl.setClearColor(new Color(voidColour), 1);

    stopLoopRef.current?.();
    stopLoopRef.current = startFrameLoop({
      step: (seconds) => {
        clock.tick(seconds);
        const state = get();
        frame.m = sceneStore.getState().m;
        frame.time = clock.time;
        frame.delta = clock.delta;
        frame.reducedMotion = clock.reduced;
        frame.pixelRatio = state.viewport.dpr;
        frame.aspect = state.size.width / Math.max(state.size.height, 1);
        frame.extras = LEVEL_SETTINGS[levelRef.current].extras;
        state.advance(seconds);
      },
      onError: (error) => {
        stopLoopRef.current = null;
        console.error('[scene] A frame failed; continuing without WebGL', error);
        onFailRef.current('frame-error');
      },
    });
    setReady(true);
  }

  function onFirstFrame(): void {
    setPainted(true);
    onPaintedRef.current?.();
  }

  return (
    <div
      className={styles.scene}
      aria-hidden="true"
      data-ready={ready ? 'true' : undefined}
      data-shapes={shapes?.source}
      data-particles={painted ? 'painted' : undefined}
    >
      <Canvas
        ref={canvasRef}
        style={NO_POINTER}
        dpr={[MIN_DPR, LEVEL_SETTINGS[level].maxDpr]}
        frameloop="never"
        flat
        linear
        camera={CAMERA_LENS}
        gl={{ alpha: false, antialias: false, powerPreference: 'high-performance' }}
        onCreated={onCreated}
      >
        <CameraRig frame={frame} />
        {shapes === null ? null : (
          <Particles shapes={shapes.shapes} frame={frame} onFirstFrame={onFirstFrame} />
        )}
        <BackgroundStars count={LEVEL_SETTINGS[level].stars} frame={frame} />
      </Canvas>
    </div>
  );
}
