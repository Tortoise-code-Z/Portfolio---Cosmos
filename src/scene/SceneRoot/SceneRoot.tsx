import { Canvas, type RootState } from '@react-three/fiber';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { watchMediaQuery } from '~/lib/device/mediaQuery/mediaQuery';
import { watchReducedMotion } from '~/lib/device/reducedMotion/reducedMotion';
import { LEVEL_SETTINGS, type RenderLevel } from '~/lib/device/sceneLevel/sceneLevel';
import { smoothM } from '~/lib/scroll/smoothM/smoothM';
import { sceneStore } from '~/stores/sceneStore/sceneStore';
import { useUiStore } from '~/stores/uiStore/uiStore';

import { BackgroundStars } from '../BackgroundStars/BackgroundStars';
import { CameraRig } from '../CameraRig/CameraRig';
import {
  ConstellationLabels,
  createStarLabelElements,
} from '../ConstellationLabels/ConstellationLabels';
import { Constellations } from '../Constellations/Constellations';
import { plateLabelOf, plateSlugOf } from '../config/plateSlots/plateSlots';
import { CAMERA_LENS, WIDE_LAYOUT_QUERY } from '../config/sceneConfig';
import { watchContextLoss } from '../contextLoss/contextLoss';
import { startFrameLoop, type FrameLoop } from '../frameLoop/frameLoop';
import { Particles } from '../Particles/Particles';
import { createPinElements, PlatePins, PlatePinsFrame } from '../PlatePins/PlatePins';
import { watchScenePause } from '../pause/pause';
import { watchPointer } from '../pointer/pointer';
import { followGravity } from '../math/gravity/gravity';
import {
  createPlateCycle,
  createPlateStep,
  stepPlates,
  type PlateCycle,
  type PlateStep,
} from '../math/plateCycle/plateCycle';
import { createSceneClock } from '../sceneClock/sceneClock';
import { createSceneFrame, type SceneFrame } from '../sceneMaterials/sceneMaterials';
import { Sun } from '../Sun/Sun';
import { useHotDegradation } from '../useHotDegradation/useHotDegradation';
import { usePortrait } from '../usePortrait/usePortrait';
import { SCENE_PLATE_LABELS, SCENE_PLATES, useSceneShapes } from '../useSceneShapes/useSceneShapes';
import { readVoidColour } from '../voidColour/voidColour';
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
  /**
   * Nivel (lo eligió `SceneMount`; puede bajar: el reintento de las formas y la degradación en caliente): fija el
   * DPR máximo y cuántas partículas se generan. `data-level` para los e2e.
   */
  readonly level: RenderLevel;
  /**
   * La escena no puede seguir: `SceneMount` pasa a sin WebGL y la desmonta. Un error al crear el contexto
   * o al renderizar con React no llega aquí: se lanza y lo recoge el `ErrorBoundary` de la escena. Un error
   * dentro de un frame (`useFrame`, `gl.render`) no lo recoge ningún boundary (corre en el bucle de la escena,
   * `scene/frameLoop`): el bucle se para y llega aquí como `frame-error` (docs/04-escena/rendimiento.md →
   * «Robustez»).
   */
  readonly onFail: (reason: SceneFailure) => void;
  /** La escena ha pintado su primer frame con partículas: `SceneMount` funde el punto CSS del hero. */
  readonly onPainted?: () => void;
  /**
   * El texto de la etiqueta de cada estrella de las constelaciones, por `Skill.id`, en el idioma de la página
   * (`SceneMount`: la escena solo lee del contenido los ids y el orden). `null` (u omitido) fuera del viaje: sin
   * etiquetas.
   */
  readonly skillLabels?: Readonly<Record<string, string>> | null;
  /**
   * El nombre de cada proyecto, por slug, para los pins de las placas (F4.4b). `null` (u omitido) fuera del viaje:
   * sin pins.
   */
  readonly projectNames?: Readonly<Record<string, string>> | null;
  /** Un pin pide abrir la ficha de su proyecto (`SceneMount` navega, en el idioma de la página). */
  readonly onOpenProject?: (slug: string) => void;
}

/** Sin `onOpenProject`, un pin no abre nada. */
const OPEN_NOTHING = (): void => undefined;

/**
 * La placa que se ilumina en este frame (docs/04-escena/constelaciones-y-placas.md → «Resaltado»): la del proyecto
 * señalado en `uiStore` (`activeProject`, que el bucle lee una vez por frame) o la del ciclo automático
 * (`stepPlates`, quieto en un interludio), en `frame.plate` (de ahí, `uPlate`). Cuando cambia, el envoltorio lo marca
 * con el slug de su proyecto (`data-plate`, para los e2e); sin placa, sin atributo.
 */
function followPlates(
  frame: SceneFrame,
  activeProject: string | null,
  cycle: PlateCycle,
  step: PlateStep,
  scene: HTMLElement | null,
): void {
  step.m = frame.m;
  step.delta = frame.delta;
  step.reducedMotion = frame.reducedMotion;
  step.transmission = frame.transmission;
  step.pointing = activeProject !== null;
  step.pointed = plateLabelOf(SCENE_PLATES, activeProject);
  const plate = stepPlates(cycle, SCENE_PLATE_LABELS, step);
  if (plate === frame.plate) return;
  frame.plate = plate;
  const slug = plateSlugOf(SCENE_PLATES, plate);
  if (slug === null) scene?.removeAttribute('data-plate');
  else scene?.setAttribute('data-plate', slug);
}

/** Las partículas ya están pintadas: lo que va con las formas (los pins, el Sol) deja de esperar. */
function markPainted(frame: SceneFrame): void {
  frame.painted = true;
}

/** El DPR mínimo: nunca por debajo de 1 píxel por píxel CSS. */
const MIN_DPR = 1;

/**
 * React Three Fiber pone `pointer-events: auto` en línea al envoltorio del lienzo (para sus eventos):
 * taparía los enlaces de debajo. Sin eventos de puntero en el lienzo: el ratón se lee de `window` (`watchPointer`:
 * el paralaje y la gravedad del cursor).
 */
const NO_POINTER = { pointerEvents: 'none' } as const;

/**
 * Raíz de la escena (docs/05-tecnico/arquitectura.md → «Carga de la escena»). Llega en su propio chunk,
 * con Three.js y React Three Fiber, después de la primera pintura: el JS inicial no la incluye. Fija detrás del
 * contenido, decorativa (`aria-hidden`) y sin puntero. Pide las formas al montar (`useSceneShapes`: worker y,
 * si falla, reintento) y las pinta (`Particles`), con las estrellas de fondo, las constelaciones (con sus etiquetas
 * en una capa del DOM aparte, `ConstellationLabels`), los pins de las placas (`PlatePins`) y el Sol (`Sun`); la cámara la lleva
 * `CameraRig`, que se mueve antes que las demás piezas por la prioridad de su `useFrame` (`CAMERA_RIG_PRIORITY`), no
 * por su sitio en el JSX.
 *
 * Los frames los pide su propio bucle (`frameloop="never"` + `startFrameLoop`, ADR-027): antes de cada `advance()`
 * rellena el frame compartido (`m` suavizado, la carga de la detonación, si se lee una transmisión, el grupo de Skills
 * encendido, la gravedad del cursor, la placa iluminada, reloj, densidad de píxeles…: lo que necesita de un store lo
 * lee aquí, una vez por frame; el ratón y si es escritorio los escriben sus observadores, `watchPointer` y
 * `watchMediaQuery`) y, si un frame lanza, para y pasa a sin WebGL. La `m` de la escena es suya: persigue a `mTarget`
 * con un amortiguado (`M_SMOOTHING`, con el tiempo real del frame) y arranca en él (sin repetir la explosión a mitad
 * del viaje); `sceneStore` sigue con `m = mTarget` para la interfaz (ADR-028). Con la página oculta o la misión rápida
 * abierta, el bucle se pausa (`watchScenePause`; `data-paused` para los e2e). Si los fps se quedan cortos, baja un
 * nivel (`useHotDegradation`: mide en cada frame y descarta la ventana en curso al pausar). El lienzo es opaco, del
 * color del espacio, y sin gestión de color ni mapeo de tonos (`linear`, `flat`): los shaders suman la luz tal cual,
 * como el prototipo (particulas-y-shaders.md → «Colores»).
 */
export default function SceneRoot({
  level,
  onFail,
  onPainted,
  skillLabels = null,
  projectNames = null,
  onOpenProject = OPEN_NOTHING,
}: SceneRootProps): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const onFailRef = useRef(onFail);
  const onPaintedRef = useRef(onPainted);
  /** El renderer existe (`onCreated`): lo esperan los e2e para dar la escena por montada. */
  const [ready, setReady] = useState(false);
  /** Las partículas ya se han pintado: lo esperan los e2e (`data-particles`). */
  const [painted, setPainted] = useState(false);
  /** El retrato ya se ha pintado entero: lo esperan los e2e, las capturas y las fotos fijas (`data-portrait`). */
  const [portraitPainted, setPortraitPainted] = useState(false);
  /** El bucle está en pausa: lo miran los e2e (`data-paused`). */
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [clock] = useState(createSceneClock);
  const [frame] = useState(createSceneFrame);
  const [plateCycle] = useState(createPlateCycle);
  const [plateStep] = useState(createPlateStep);
  const [labelElements] = useState(createStarLabelElements);
  const [pinElements] = useState(createPinElements);
  const levelRef = useRef(level);
  const loopRef = useRef<FrameLoop | null>(null);
  const stopVoidRef = useRef<(() => void) | null>(null);
  const { shapes, lowerTo } = useSceneShapes(level, (reason) => {
    onFailRef.current(reason);
  });
  const degradation = useHotDegradation({ level, active: painted, lowerTo });
  const { portrait, want: wantPortrait } = usePortrait(shapes?.shapes.count ?? null);

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
    () =>
      watchScenePause((value) => {
        pausedRef.current = value;
        if (value) degradation.discardWindow();
        loopRef.current?.setPaused(value);
        setPaused(value);
      }),
    [degradation],
  );

  useEffect(
    () => () => {
      loopRef.current?.stop();
      loopRef.current = null;
      stopVoidRef.current?.();
      stopVoidRef.current = null;
    },
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return undefined;
    // Al volver el contexto, Three rehace su estado (el fondo lo repone `onCreated`) y el bucle pinta el frame
    // siguiente (o el primero al salir de la pausa).
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
    // El fondo, del color del espacio (`--color-void`). Al recuperar el contexto, Three rehace su fondo en
    // negro: se vuelve a poner. Se escucha aquí, en el lienzo y después del oyente de Three (que se registra al
    // crear el renderer), para ir detrás de él; `watchContextLoss` puede registrarse antes.
    const voidColour = readVoidColour(document.documentElement);
    if (voidColour !== null) {
      const paintVoid = (): void => {
        gl.setClearColor(voidColour, 1);
      };
      paintVoid();
      const canvas = gl.domElement;
      stopVoidRef.current?.();
      canvas.addEventListener('webglcontextrestored', paintVoid);
      stopVoidRef.current = () => {
        canvas.removeEventListener('webglcontextrestored', paintVoid);
      };
    }

    loopRef.current?.stop();
    // El primer frame arranca en `mTarget`: quien llega a mitad del viaje no ve la explosión otra vez. Una `m`
    // que no es finita (un `mTarget` roto) vuelve a empezar igual en el frame siguiente, en vez de quedarse así.
    let first = true;
    const loop = startFrameLoop({
      step: (seconds) => {
        clock.tick(seconds);
        degradation.sample(seconds);
        const state = get();
        // Cada store, una vez por frame: los `useFrame` leen el frame, nunca un store (ADR-027).
        const { mTarget, charge, interlude } = sceneStore.getState();
        const { activeSkillGroup, activeProject } = useUiStore.getState();
        frame.m =
          first || !Number.isFinite(frame.m)
            ? mTarget
            : smoothM(frame.m, mTarget, clock.delta, clock.reduced);
        first = false;
        frame.charge = charge;
        frame.transmission = interlude !== null;
        frame.skillGroup = activeSkillGroup;
        frame.time = clock.time;
        frame.delta = clock.delta;
        frame.reducedMotion = clock.reduced;
        frame.pixelRatio = state.viewport.dpr;
        frame.aspect = state.size.width / Math.max(state.size.height, 1);
        frame.extras = LEVEL_SETTINGS[levelRef.current].extras;
        followGravity(frame.gravity, frame.pointer, !clock.reduced, clock.delta);
        followPlates(frame, activeProject, plateCycle, plateStep, sceneRef.current);
        state.advance(seconds);
      },
      onError: (error) => {
        loopRef.current = null;
        console.error('[scene] A frame failed; continuing without WebGL', error);
        onFailRef.current('frame-error');
      },
    });
    loop.setPaused(pausedRef.current);
    loopRef.current = loop;
    setReady(true);
  }

  function onPortraitPainted(): void {
    setPortraitPainted(true);
  }

  function onFirstFrame(): void {
    markPainted(frame);
    setPainted(true);
    onPaintedRef.current?.();
  }

  return (
    <div
      ref={sceneRef}
      className={styles.scene}
      aria-hidden="true"
      data-ready={ready ? 'true' : undefined}
      data-shapes={shapes?.source}
      data-particles={painted ? 'painted' : undefined}
      data-paused={paused ? 'true' : undefined}
      data-portrait={portraitPainted ? 'painted' : undefined}
      data-level={level}
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
          <Particles
            shapes={shapes.shapes}
            frame={frame}
            onFirstFrame={onFirstFrame}
            portrait={portrait}
            onPortraitWanted={wantPortrait}
            onPortraitPainted={onPortraitPainted}
          />
        )}
        <BackgroundStars count={LEVEL_SETTINGS[level].stars} frame={frame} />
        <Constellations frame={frame} texts={skillLabels} labels={labelElements} />
        <Sun frame={frame} />
        <PlatePinsFrame frame={frame} names={projectNames} elements={pinElements} />
      </Canvas>
      <ConstellationLabels texts={skillLabels} elements={labelElements} />
      <PlatePins names={projectNames} elements={pinElements} onOpen={onOpenProject} />
    </div>
  );
}
