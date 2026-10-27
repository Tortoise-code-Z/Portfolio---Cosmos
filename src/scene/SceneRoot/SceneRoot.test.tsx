import { act, render } from '@testing-library/react';
import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import type { Color } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sceneStore, setScrollTarget } from '~/stores/sceneStore/sceneStore';
import { closeQuickMission, openQuickMission, useUiStore } from '~/stores/uiStore/uiStore';

import { CONTEXT_RESTORE_TIMEOUT_MS } from '../contextLoss/contextLoss';
import { MAX_STEP_S } from '../sceneClock/sceneClock';
import { useSceneShapes } from '../useSceneShapes/useSceneShapes';
import SceneRoot from './SceneRoot';

// Las formas tienen sus propios tests (worker, reintento): aquí solo se mira cómo las usa SceneRoot.
vi.mock('../useSceneShapes/useSceneShapes', () => ({
  useSceneShapes: vi.fn(() => ({ shapes: null, lowerTo: () => Promise.resolve('kept') })),
}));

/** Las piezas de Three necesitan WebGL: aquí solo se mira qué reciben (y las partículas «pintan» al montar). */
const seen = vi.hoisted((): { frame: unknown; stars: number[]; cameraFrame: unknown } => ({
  frame: null,
  stars: [],
  cameraFrame: null,
}));
vi.mock('../CameraRig/CameraRig', () => ({
  CameraRig: function FakeCameraRig({ frame }: { readonly frame: unknown }) {
    seen.cameraFrame = frame;
    return null;
  },
}));
vi.mock('../Particles/Particles', async () => {
  const { useEffect } = await import('react');
  return {
    Particles: function FakeParticles({
      frame,
      onFirstFrame,
    }: {
      readonly frame: unknown;
      readonly onFirstFrame: () => void;
    }) {
      // Como las de verdad: «pintan» una vez, en su primer frame.
      useEffect(() => {
        seen.frame = frame;
        onFirstFrame();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return <i data-particles="" />;
    },
  };
});
vi.mock('../BackgroundStars/BackgroundStars', () => ({
  BackgroundStars: function FakeStars({ count }: { readonly count: number }) {
    seen.stars.push(count);
    return null;
  },
}));

interface FakeGl {
  readonly getProgramInfoLog: (program: object) => string;
  readonly getShaderInfoLog: (shader: object) => string;
}
/** La firma real de Three 0.186: `(gl, program, glVertexShader, glFragmentShader)`. */
type ShaderErrorHandler = (
  context: FakeGl,
  program: object,
  vertexShader: object,
  fragmentShader: object,
) => void;

/** El renderer falso y el estado de R3F que recibe `onCreated`: solo lo que toca SceneRoot. */
const renderer = vi.hoisted(() => ({
  debug: { onShaderError: null as ShaderErrorHandler | null },
  setClearColor: vi.fn<(colour: Color, alpha: number) => void>(),
  /** El lienzo del renderer: lo pone el `<Canvas>` falso antes de `onCreated`. */
  domElement: null as HTMLCanvasElement | null,
}));
const advance = vi.hoisted(() => vi.fn());
const r3fState = vi.hoisted(() => ({
  viewport: { dpr: 2 },
  size: { width: 1600, height: 1000 },
  advance,
}));

// El `<Canvas>` de verdad necesita WebGL: este pinta un `<canvas>` con sus props a la vista.
vi.mock('@react-three/fiber', () => ({
  Canvas: function FakeCanvas({
    ref,
    dpr,
    frameloop,
    flat,
    linear,
    camera,
    gl,
    onCreated,
    children,
  }: {
    readonly ref: RefObject<HTMLCanvasElement | null>;
    readonly dpr: readonly number[];
    readonly frameloop: string;
    readonly flat: boolean;
    readonly linear: boolean;
    readonly camera: { readonly fov: number; readonly position?: readonly number[] };
    readonly gl: { readonly alpha: boolean };
    readonly onCreated: (state: { gl: typeof renderer; get: () => typeof r3fState }) => void;
    readonly children: ReactNode;
  }): ReactNode {
    const own = useRef<HTMLCanvasElement | null>(null);
    useEffect(() => {
      renderer.domElement = own.current;
      onCreated({ gl: renderer, get: () => r3fState });
      // Solo al montar, como el `onCreated` de verdad.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (
      <>
        <canvas
          ref={(node) => {
            own.current = node;
            ref.current = node;
          }}
          data-dpr={dpr.join(',')}
          data-frameloop={frameloop}
          data-flat={String(flat)}
          data-linear={String(linear)}
          data-alpha={String(gl.alpha)}
          data-camera={`${String(camera.fov)}@${camera.position?.join(',') ?? 'rig'}`}
        />
        {children}
      </>
    );
  },
}));

beforeEach(() => {
  // El color del espacio de `tokens.css` (jsdom no carga los estilos).
  document.documentElement.style.setProperty('--color-void', '#04050b');
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  renderer.debug.onShaderError = null;
  renderer.setClearColor.mockReset();
  renderer.domElement = null;
  advance.mockReset();
  seen.frame = null;
  seen.stars = [];
  seen.cameraFrame = null;
  vi.unstubAllGlobals();
  setScrollTarget(0);
  useUiStore.setState(useUiStore.getInitialState(), true);
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  document.documentElement.style.removeProperty('--color-void');
  // `restoreAllMocks` solo deshace los `spyOn`: lo que un test le haga devolver al simulacro de `vi.mock` se
  // quedaría para los siguientes (vuelve a «sin formas»).
  vi.mocked(useSceneShapes).mockReset();
});

function renderScene(level: 'high' | 'medium' | 'low' = 'high'): {
  canvas: HTMLCanvasElement;
  onFail: ReturnType<typeof vi.fn>;
  onPainted: ReturnType<typeof vi.fn>;
  unmount: () => void;
} {
  const onFail = vi.fn();
  const onPainted = vi.fn();
  const { container, unmount } = render(
    <SceneRoot level={level} onFail={onFail} onPainted={onPainted} />,
  );
  const canvas = container.querySelector('canvas');
  if (canvas === null) throw new Error('No canvas');
  return { canvas, onFail, onPainted, unmount };
}

type MediaListener = (event: { matches: boolean }) => void;

/**
 * `matchMedia` falso con las consultas que casan en `matching`: guarda los oyentes de `change` de cada consulta
 * (otro tipo de evento no avisaría nunca) para poder cambiar la respuesta a mano.
 */
function stubMatchMedia(matching: readonly string[]) {
  const listeners = new Map<string, Set<MediaListener>>();
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => {
      const own = listeners.get(query) ?? new Set<MediaListener>();
      listeners.set(query, own);
      return {
        matches: matching.includes(query),
        addEventListener: (type: string, listener: MediaListener) => {
          if (type === 'change') own.add(listener);
        },
        removeEventListener: (type: string, listener: MediaListener) => {
          if (type === 'change') own.delete(listener);
        },
      };
    }),
  );
  return {
    listeners: (query: string): number => listeners.get(query)?.size ?? 0,
    change(query: string, matches: boolean): void {
      for (const listener of listeners.get(query) ?? []) listener({ matches });
    },
  };
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/** `requestAnimationFrame` a mano: cada `tick` da un frame con esa hora (ms). */
function manualFrames() {
  let pending: FrameRequestCallback | null = null;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    pending = callback;
    return 1;
  });
  const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {
    pending = null;
  });
  return {
    cancel,
    tick(timestamp: number): void {
      const callback = pending;
      pending = null;
      callback?.(timestamp);
    },
  };
}

describe('SceneRoot', () => {
  it('is decorative: hidden from assistive technology', () => {
    const { canvas } = renderScene();
    expect(canvas.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('caps the pixel ratio and the stars by level; its own frame loop, an opaque canvas, no colour management', () => {
    expect(renderScene('high').canvas).toHaveAttribute('data-dpr', '1,2');
    expect(seen.stars.at(-1)).toBe(5000);
    expect(renderScene('medium').canvas).toHaveAttribute('data-dpr', '1,1.5');
    expect(seen.stars.at(-1)).toBe(3500);
    const { canvas } = renderScene('low');
    expect(canvas).toHaveAttribute('data-dpr', '1,1');
    expect(seen.stars.at(-1)).toBe(2000);
    expect(canvas).toHaveAttribute('data-frameloop', 'never');
    expect(canvas).toHaveAttribute('data-alpha', 'false');
    expect(canvas).toHaveAttribute('data-flat', 'true');
    expect(canvas).toHaveAttribute('data-linear', 'true');
    // La lente; la posición la pone `CameraRig` en cada frame.
    expect(canvas).toHaveAttribute('data-camera', '55@rig');
  });

  it('clears with the void colour of the tokens, numbers as they are, and again when the context comes back', () => {
    const { canvas, unmount } = renderScene();
    expect(renderer.setClearColor).toHaveBeenCalledTimes(1);
    const [colour, alpha] = renderer.setClearColor.mock.calls[0] ?? [];
    // Los números del hex, sin linealizar (con salida lineal, Three los escribe tal cual).
    expect(colour?.r).toBeCloseTo(4 / 255, 6);
    expect(colour?.b).toBeCloseTo(11 / 255, 6);
    expect(alpha).toBe(1);
    // Three rehace su fondo en negro al recuperar el contexto.
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    expect(renderer.setClearColor).toHaveBeenCalledTimes(2);
    expect(renderer.setClearColor).toHaveBeenLastCalledWith(colour, 1);
    unmount();
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    expect(renderer.setClearColor).toHaveBeenCalledTimes(2);
  });

  it('a void token that is not #rrggbb is logged and leaves the clear colour alone', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    document.documentElement.style.setProperty('--color-void', 'oklch(0.1 0.02 270)');
    const { canvas } = renderScene();
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    expect(renderer.setClearColor).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledExactlyOnceWith(
      '[scene] --color-void is not a #rrggbb colour; the canvas keeps its default',
      'oklch(0.1 0.02 270)',
    );
  });

  it('with shapes: paints its particles, says so once (data-particles, onPainted) and feeds them each frame', () => {
    const frames = manualFrames();
    vi.mocked(useSceneShapes).mockReturnValue({
      shapes: {
        source: 'worker',
        shapes: {
          count: 1,
          nebula: new Float32Array(3),
          galaxy: new Float32Array(3),
          turtle: new Float32Array(3),
          earth: new Float32Array(3),
          rand: new Float32Array(4),
        },
      },
      lowerTo: () => Promise.resolve('kept'),
    });
    const { canvas, onPainted } = renderScene('low');
    expect(onPainted).toHaveBeenCalledTimes(1);
    expect(canvas.closest('[aria-hidden="true"]')).toHaveAttribute('data-particles', 'painted');
    setScrollTarget(2.25);
    // Un hueco de 1 s (más que el tope): el frame lleva el reloj de la escena, no los segundos del bucle.
    frames.tick(1000);
    frames.tick(2000);
    expect(seen.frame).toEqual({
      m: 2.25,
      time: MAX_STEP_S,
      delta: MAX_STEP_S,
      reducedMotion: false,
      pixelRatio: 2,
      aspect: 1.6,
      extras: false,
      wide: false,
      pointer: { x: 0, y: 0, inside: false },
    });
    // La cámara lee el mismo frame.
    expect(seen.cameraFrame).toBe(seen.frame);
    expect(advance).toHaveBeenCalledTimes(2);
    // R3F avanza con los segundos del bucle (sus `useFrame` leen el reloj del frame compartido).
    expect(advance).toHaveBeenLastCalledWith(1);
  });

  it('its m starts at the scroll target and then follows it smoothly; the store keeps the target for the interface', () => {
    const frames = manualFrames();
    setScrollTarget(3);
    renderScene();
    const frame = seen.cameraFrame as { m: number };
    // Quien llega a mitad del viaje no ve la explosión otra vez.
    frames.tick(1000);
    expect(frame.m).toBe(3);
    setScrollTarget(1);
    frames.tick(1050);
    // 0,05 s a ritmo 3,4: el 17 % del camino.
    expect(frame.m).toBeCloseTo(3 - 2 * 0.05 * 3.4, 10);
    expect(sceneStore.getState().m).toBe(1);
    // Un frame largo (tope 0,1 s del reloj) no se pasa; al final llega y se queda.
    for (let t = 1100; t < 5000; t += 100) frames.tick(t);
    expect(frame.m).toBe(1);
  });

  it('with reduced motion its m follows faster (almost no inertia)', () => {
    stubMatchMedia([REDUCED_MOTION]);
    const frames = manualFrames();
    renderScene();
    const frame = seen.cameraFrame as { m: number };
    frames.tick(1000);
    setScrollTarget(1);
    frames.tick(1050);
    expect(frame.m).toBeCloseTo(0.05 * 12, 10);
  });

  it('pauses its loop while the quick mission is open or the page is hidden (data-paused), and goes on after', () => {
    const frames = manualFrames();
    const { canvas } = renderScene();
    const wrapper = canvas.closest('[aria-hidden="true"]');
    frames.tick(0);
    expect(advance).toHaveBeenCalledTimes(1);
    act(() => {
      openQuickMission();
    });
    expect(wrapper).toHaveAttribute('data-paused', 'true');
    frames.tick(16);
    expect(advance).toHaveBeenCalledTimes(1);
    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
      closeQuickMission();
    });
    // Aún oculta: sigue en pausa.
    frames.tick(32);
    expect(advance).toHaveBeenCalledTimes(1);
    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(wrapper).not.toHaveAttribute('data-paused');
    frames.tick(48);
    expect(advance).toHaveBeenCalledTimes(2);
  });

  it('a page that is hidden when the renderer is created starts paused', () => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    const frames = manualFrames();
    const { canvas } = renderScene();
    expect(canvas.closest('[aria-hidden="true"]')).toHaveAttribute('data-paused', 'true');
    frames.tick(0);
    expect(advance).not.toHaveBeenCalled();
  });

  it('obeys reduced motion: the clock stands still, goes on without a jump, and it stops listening when unmounted', () => {
    const media = stubMatchMedia([REDUCED_MOTION]);
    const frames = manualFrames();
    const { unmount } = renderScene();
    const frame = seen.cameraFrame as { time: number; delta: number; reducedMotion: boolean };
    expect(media.listeners(REDUCED_MOTION)).toBe(1);
    frames.tick(1000);
    frames.tick(1050);
    expect(frame.reducedMotion).toBe(true);
    expect(frame.time).toBe(0);
    // El tiempo real sigue para los suavizados.
    expect(frame.delta).toBeCloseTo(0.05, 10);
    media.change(REDUCED_MOTION, false);
    frames.tick(1100);
    expect(frame.reducedMotion).toBe(false);
    expect(frame.time).toBeCloseTo(0.05, 10);
    unmount();
    expect(media.listeners(REDUCED_MOTION)).toBe(0);
  });

  it('a frame that throws stops the loop, is logged and gives up once', () => {
    const frames = manualFrames();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new TypeError('Cannot read properties of undefined');
    advance.mockImplementation(() => {
      throw failure;
    });
    const { onFail } = renderScene();
    frames.tick(0);
    frames.tick(16);
    expect(consoleError).toHaveBeenCalledExactlyOnceWith(
      '[scene] A frame failed; continuing without WebGL',
      failure,
    );
    expect(onFail).toHaveBeenCalledExactlyOnceWith('frame-error');
    expect(advance).toHaveBeenCalledTimes(1);
  });

  it('stops its frame loop when unmounted', () => {
    const frames = manualFrames();
    const { unmount } = renderScene();
    unmount();
    expect(frames.cancel).toHaveBeenCalled();
    frames.tick(0);
    expect(advance).not.toHaveBeenCalled();
  });

  it('tells its camera whether the layout is the desktop one and where the mouse is, until unmounted', () => {
    const media = stubMatchMedia(['(width >= 900px)']);
    vi.stubGlobal('innerWidth', 1000);
    vi.stubGlobal('innerHeight', 500);
    const { unmount } = renderScene();
    const frame = seen.cameraFrame as { wide: boolean; pointer: object };
    expect(media.listeners('(width >= 900px)')).toBe(1);
    expect(frame.wide).toBe(true);
    media.change('(width >= 900px)', false);
    expect(frame.wide).toBe(false);
    const move = (clientX: number): void => {
      const event = new MouseEvent('pointermove', { clientX, clientY: 250 });
      Object.defineProperty(event, 'pointerType', { value: 'mouse' });
      window.dispatchEvent(event);
    };
    move(750);
    expect(frame.pointer).toEqual({ x: 0.5, y: 0, inside: true });
    unmount();
    move(0);
    expect(frame.pointer).toEqual({ x: 0.5, y: 0, inside: true });
    expect(media.listeners('(width >= 900px)')).toBe(0);
  });

  it('says when the renderer exists (data-ready), so the e2e know the scene is mounted', () => {
    const { canvas } = renderScene();
    expect(canvas.closest('[aria-hidden="true"]')).toHaveAttribute('data-ready', 'true');
  });

  it('a shader that does not compile is logged with what Three would have logged, and gives up', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { onFail } = renderScene();
    const program = {};
    const vertexShader = {};
    const fragmentShader = {};
    const gl: FakeGl = {
      getProgramInfoLog: (p) => (p === program ? 'Program not compiled' : ''),
      getShaderInfoLog: (shader) =>
        shader === vertexShader ? 'ERROR: 0:12: undeclared identifier' : 'ERROR: 0:3: syntax error',
    };
    renderer.debug.onShaderError?.(gl, program, vertexShader, fragmentShader);
    expect(consoleError).toHaveBeenCalledExactlyOnceWith('[scene] Shader failed to compile', {
      program: 'Program not compiled',
      vertex: 'ERROR: 0:12: undeclared identifier',
      fragment: 'ERROR: 0:3: syntax error',
    });
    expect(onFail).toHaveBeenCalledExactlyOnceWith('shader-error');
  });

  it('a WebGL context that comes back in time keeps the scene (its loop paints the next frame)', () => {
    vi.useFakeTimers();
    const frames = manualFrames();
    const { canvas, onFail } = renderScene();
    frames.tick(0);
    canvas.dispatchEvent(new Event('webglcontextlost'));
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    vi.advanceTimersByTime(CONTEXT_RESTORE_TIMEOUT_MS);
    expect(onFail).not.toHaveBeenCalled();
    advance.mockClear();
    frames.tick(16);
    expect(advance).toHaveBeenCalledTimes(1);
  });

  it('a WebGL context that does not come back gives up, and is logged', () => {
    vi.useFakeTimers();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { canvas, onFail } = renderScene();
    canvas.dispatchEvent(new Event('webglcontextlost'));
    vi.advanceTimersByTime(CONTEXT_RESTORE_TIMEOUT_MS);
    expect(onFail).toHaveBeenCalledExactlyOnceWith('context-not-restored');
    expect(consoleError).toHaveBeenCalledWith(
      '[scene] WebGL context lost for good',
      'context-not-restored',
    );
  });

  it('marks its level (data-level) and, painting too slowly, asks for the level below; a pause in between does not count', () => {
    const frames = manualFrames();
    const lowerTo = vi.fn(() => new Promise<'lowered'>(() => undefined));
    vi.mocked(useSceneShapes).mockReturnValue({
      shapes: {
        source: 'worker',
        shapes: {
          count: 1,
          nebula: new Float32Array(3),
          galaxy: new Float32Array(3),
          turtle: new Float32Array(3),
          earth: new Float32Array(3),
          rand: new Float32Array(4),
        },
      },
      lowerTo,
    });
    const { canvas } = renderScene('high');
    expect(canvas.closest('[aria-hidden="true"]')).toHaveAttribute('data-level', 'high');
    /** Frames a `fps` desde `from` ms durante `seconds`; devuelve la hora del último. */
    const run = (from: number, seconds: number, fps: number): number => {
      const step = 1000 / fps;
      const count = Math.round(seconds * fps);
      for (let i = 0; i <= count; i += 1) frames.tick(from + i * step);
      return from + count * step;
    };
    // 7 s lentos (calentamiento y dos ventanas y media), una pausa de un minuto y, al volver, rápido: nada.
    let at = run(0, 7, 30);
    act(() => {
      openQuickMission();
    });
    act(() => {
      closeQuickMission();
    });
    at = run(at + 60_000, 10, 60);
    expect(lowerTo).not.toHaveBeenCalled();
    // Lento otra vez: tres ventanas de 2 s seguidas.
    run(at + 1000 / 30, 6.1, 30);
    expect(lowerTo).toHaveBeenCalledExactlyOnceWith('medium');
  });

  it('asks for the shapes of its level, marks where they came from and gives up without them', () => {
    const { canvas, onFail } = renderScene('medium');
    const wrapper = canvas.closest('[aria-hidden="true"]');
    expect(wrapper).not.toHaveAttribute('data-shapes');
    const [askedLevel, onShapesFail] = vi.mocked(useSceneShapes).mock.calls.at(-1) ?? [];
    expect(askedLevel).toBe('medium');
    onShapesFail?.('shapes-failed');
    expect(onFail).toHaveBeenCalledExactlyOnceWith('shapes-failed');

    vi.mocked(useSceneShapes).mockReturnValue({
      shapes: {
        source: 'main',
        shapes: {
          count: 1,
          nebula: new Float32Array(3),
          galaxy: new Float32Array(3),
          turtle: new Float32Array(3),
          earth: new Float32Array(3),
          rand: new Float32Array(4),
        },
      },
      lowerTo: () => Promise.resolve('kept'),
    });
    const again = renderScene('low');
    expect(again.canvas.closest('[aria-hidden="true"]')).toHaveAttribute('data-shapes', 'main');
  });

  it('stops watching the canvas when unmounted', () => {
    vi.useFakeTimers();
    const { canvas, onFail, unmount } = renderScene();
    canvas.dispatchEvent(new Event('webglcontextlost'));
    unmount();
    vi.advanceTimersByTime(CONTEXT_RESTORE_TIMEOUT_MS);
    expect(onFail).not.toHaveBeenCalled();
  });
});
