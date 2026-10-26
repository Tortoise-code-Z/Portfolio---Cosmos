import { render } from '@testing-library/react';
import { useEffect, type ReactNode, type Ref } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CONTEXT_RESTORE_TIMEOUT_MS } from '../contextLoss/contextLoss';
import { useSceneShapes } from '../useSceneShapes/useSceneShapes';
import SceneRoot from './SceneRoot';

// Las formas tienen sus propios tests (worker, reintento): aquí solo se mira cómo las usa SceneRoot.
vi.mock('../useSceneShapes/useSceneShapes', () => ({ useSceneShapes: vi.fn(() => null) }));

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

/** El renderer falso y el `invalidate` que recibe `onCreated`: solo lo que toca SceneRoot. */
const renderer = vi.hoisted(() => ({
  debug: { onShaderError: null as ShaderErrorHandler | null },
}));
const invalidate = vi.hoisted(() => vi.fn());

// El `<Canvas>` de verdad necesita WebGL: este pinta un `<canvas>` con sus props a la vista.
vi.mock('@react-three/fiber', () => ({
  Canvas: function FakeCanvas({
    ref,
    dpr,
    frameloop,
    onCreated,
  }: {
    readonly ref: Ref<HTMLCanvasElement>;
    readonly dpr: readonly number[];
    readonly frameloop: string;
    readonly onCreated: (state: { gl: typeof renderer; invalidate: () => void }) => void;
  }): ReactNode {
    useEffect(() => {
      onCreated({ gl: renderer, invalidate });
    }, [onCreated]);
    return <canvas ref={ref} data-dpr={dpr.join(',')} data-frameloop={frameloop} />;
  },
}));

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  renderer.debug.onShaderError = null;
  invalidate.mockReset();
});

function renderScene(level: 'high' | 'medium' | 'low' = 'high'): {
  canvas: HTMLCanvasElement;
  onFail: ReturnType<typeof vi.fn>;
  unmount: () => void;
} {
  const onFail = vi.fn();
  const { container, unmount } = render(<SceneRoot level={level} onFail={onFail} />);
  const canvas = container.querySelector('canvas');
  if (canvas === null) throw new Error('No canvas');
  return { canvas, onFail, unmount };
}

describe('SceneRoot', () => {
  it('is decorative: hidden from assistive technology', () => {
    const { canvas } = renderScene();
    expect(canvas.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('caps the pixel ratio by level and paints on demand', () => {
    expect(renderScene('high').canvas).toHaveAttribute('data-dpr', '1,2');
    expect(renderScene('medium').canvas).toHaveAttribute('data-dpr', '1,1.5');
    const { canvas } = renderScene('low');
    expect(canvas).toHaveAttribute('data-dpr', '1,1');
    expect(canvas).toHaveAttribute('data-frameloop', 'demand');
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

  it('asks for a frame when the WebGL context comes back (it paints on demand)', () => {
    vi.useFakeTimers();
    const { canvas, onFail } = renderScene();
    canvas.dispatchEvent(new Event('webglcontextlost'));
    expect(invalidate).not.toHaveBeenCalled();
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    expect(invalidate).toHaveBeenCalledTimes(1);
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
