import { render } from '@testing-library/react';
import { useEffect, type ReactNode, type Ref } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setScrollTarget, sceneStore } from '~/stores/sceneStore/sceneStore';

import { CONTEXT_RESTORE_TIMEOUT_MS } from '../contextLoss/contextLoss';
import { useSceneShapes } from '../useSceneShapes/useSceneShapes';
import SceneRoot from './SceneRoot';

// Las formas tienen sus propios tests (worker, reintento): aquí solo se mira cómo las usa SceneRoot.
vi.mock('../useSceneShapes/useSceneShapes', () => ({ useSceneShapes: vi.fn(() => null) }));

/** Las piezas de Three necesitan WebGL: aquí solo se mira qué reciben (y las partículas «pintan» al montar). */
const seen = vi.hoisted((): { frame: unknown; stars: number[] } => ({ frame: null, stars: [] }));
vi.mock('../Particles', async () => {
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
vi.mock('../BackgroundStars', () => ({
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
  setClearColor: vi.fn<(colour: { getHexString: () => string }, alpha: number) => void>(),
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
    readonly ref: Ref<HTMLCanvasElement>;
    readonly dpr: readonly number[];
    readonly frameloop: string;
    readonly flat: boolean;
    readonly linear: boolean;
    readonly camera: { readonly fov: number; readonly position: readonly number[] };
    readonly gl: { readonly alpha: boolean };
    readonly onCreated: (state: { gl: typeof renderer; get: () => typeof r3fState }) => void;
    readonly children: ReactNode;
  }): ReactNode {
    useEffect(() => {
      onCreated({ gl: renderer, get: () => r3fState });
      // Solo al montar, como el `onCreated` de verdad.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (
      <>
        <canvas
          ref={ref}
          data-dpr={dpr.join(',')}
          data-frameloop={frameloop}
          data-flat={String(flat)}
          data-linear={String(linear)}
          data-alpha={String(gl.alpha)}
          data-camera={`${String(camera.fov)}@${camera.position.join(',')}`}
        />
        {children}
      </>
    );
  },
}));

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  renderer.debug.onShaderError = null;
  renderer.setClearColor.mockReset();
  advance.mockReset();
  seen.frame = null;
  seen.stars = [];
  setScrollTarget(0);
  document.documentElement.style.removeProperty('--color-void');
  // `restoreAllMocks` solo deshace los `spyOn`: lo que un test le haga devolver al simulacro de `vi.mock` se
  // quedaría para los siguientes (vuelve a `() => null`).
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
    expect(renderScene('medium').canvas).toHaveAttribute('data-dpr', '1,1.5');
    const { canvas } = renderScene('low');
    expect(canvas).toHaveAttribute('data-dpr', '1,1');
    expect(seen.stars).toEqual(expect.arrayContaining([5000, 3500, 2000]));
    expect(canvas).toHaveAttribute('data-frameloop', 'never');
    expect(canvas).toHaveAttribute('data-alpha', 'false');
    expect(canvas).toHaveAttribute('data-flat', 'true');
    expect(canvas).toHaveAttribute('data-linear', 'true');
    // Cámara provisional hasta F3.4: el keyframe del capítulo 0.
    expect(canvas).toHaveAttribute('data-camera', '55@0,0,14');
  });

  it('clears with the void colour of the tokens', () => {
    document.documentElement.style.setProperty('--color-void', '#04050b');
    renderScene();
    expect(renderer.setClearColor).toHaveBeenCalledTimes(1);
    const [colour, alpha] = renderer.setClearColor.mock.calls[0] ?? [];
    expect(colour?.getHexString()).toBe('04050b');
    expect(alpha).toBe(1);
  });

  it('with shapes: paints its particles, says so once (data-particles, onPainted) and feeds them each frame', () => {
    const frames = manualFrames();
    vi.mocked(useSceneShapes).mockReturnValue({
      source: 'worker',
      shapes: {
        count: 1,
        nebula: new Float32Array(3),
        galaxy: new Float32Array(3),
        turtle: new Float32Array(3),
        earth: new Float32Array(3),
        rand: new Float32Array(4),
      },
    });
    const { canvas, onPainted } = renderScene('low');
    expect(onPainted).toHaveBeenCalledTimes(1);
    expect(canvas.closest('[aria-hidden="true"]')).toHaveAttribute('data-particles', 'painted');
    setScrollTarget(2.25);
    frames.tick(1000);
    frames.tick(1050);
    expect(seen.frame).toEqual({
      m: sceneStore.getState().m,
      time: expect.closeTo(0.05, 10) as unknown,
      reducedMotion: false,
      pixelRatio: 2,
      aspect: 1.6,
      extras: false,
    });
    expect(advance).toHaveBeenCalledTimes(2);
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
    const { canvas, onFail } = renderScene();
    canvas.dispatchEvent(new Event('webglcontextlost'));
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    vi.advanceTimersByTime(CONTEXT_RESTORE_TIMEOUT_MS);
    expect(onFail).not.toHaveBeenCalled();
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

  it('asks for the shapes of its level, marks where they came from and gives up without them', () => {
    const { canvas, onFail } = renderScene('medium');
    const wrapper = canvas.closest('[aria-hidden="true"]');
    expect(wrapper).not.toHaveAttribute('data-shapes');
    const [askedLevel, onShapesFail] = vi.mocked(useSceneShapes).mock.calls.at(-1) ?? [];
    expect(askedLevel).toBe('medium');
    onShapesFail?.('shapes-failed');
    expect(onFail).toHaveBeenCalledExactlyOnceWith('shapes-failed');

    vi.mocked(useSceneShapes).mockReturnValue({
      source: 'main',
      shapes: {
        count: 1,
        nebula: new Float32Array(3),
        galaxy: new Float32Array(3),
        turtle: new Float32Array(3),
        earth: new Float32Array(3),
        rand: new Float32Array(4),
      },
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
