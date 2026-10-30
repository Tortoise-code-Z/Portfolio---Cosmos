import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  FAKE_GPU_RENDERER,
  RENDERER_PARAMETER,
  SWIFTSHADER_RENDERER,
  UNMASKED_RENDERER_PARAMETER,
} from '../../../../tests/e2e/support/renderers';
import { detectWebGL2, isSoftwareRenderer } from './webgl2';

afterEach(() => {
  vi.restoreAllMocks();
});

type GetContext = (kind: string, attributes?: WebGLContextAttributes) => unknown;

/** `getContext` falso para los lienzos que se creen mientras dure el test. */
function stubGetContext(implementation: GetContext) {
  return vi
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockImplementation(implementation as HTMLCanvasElement['getContext']);
}

/** Las constantes de WebGL que lee la detección (los números del estándar, los mismos que el disfraz de los e2e). */
const RENDERER = RENDERER_PARAMETER;
const UNMASKED_RENDERER_WEBGL = UNMASKED_RENDERER_PARAMETER;

interface FakeContextOptions {
  /** Lo que da `getParameter(RENDERER)`. Por defecto, el genérico de Chromium. */
  readonly renderer?: unknown;
  /** Lo que da `WEBGL_debug_renderer_info` (`null`: el navegador no tiene la extensión). */
  readonly unmasked?: unknown;
  /** Se llama al soltar el contexto (`WEBGL_lose_context`); sin ella, no hay extensión para soltarlo. */
  readonly loseContext?: () => void;
}

/** Un contexto WebGL2 falso con lo justo para la detección. */
function fakeContext({
  renderer = 'WebKit WebGL',
  unmasked = null,
  loseContext,
}: FakeContextOptions = {}) {
  return {
    RENDERER,
    getParameter: vi.fn((name: number) => {
      if (name === RENDERER) return renderer;
      return name === UNMASKED_RENDERER_WEBGL ? unmasked : null;
    }),
    getExtension: vi.fn((name: string) => {
      const debugInfo = unmasked === null ? null : { UNMASKED_RENDERER_WEBGL };
      if (name === 'WEBGL_lose_context') return loseContext === undefined ? null : { loseContext };
      return name === 'WEBGL_debug_renderer_info' ? debugInfo : null;
    }),
  };
}

const withCaveat = (attributes?: WebGLContextAttributes): boolean =>
  attributes?.failIfMajorPerformanceCaveat === true;

/**
 * Nombres reales de `renderer` (los de Chromium, tal cual los da `WEBGL_debug_renderer_info`). El de SwiftShader es
 * el mismo con el que se disfrazan los e2e de «por software» (`tests/e2e/support/renderers.ts`).
 */
const SWIFTSHADER = SWIFTSHADER_RENDERER;
const NVIDIA =
  'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 (0x00002503) Direct3D11 vs_5_0 ps_5_0, D3D11)';

describe('isSoftwareRenderer', () => {
  it.each([
    SWIFTSHADER,
    'Google SwiftShader',
    'llvmpipe (LLVM 15.0.7, 256 bits)',
    'ANGLE (Mesa, llvmpipe (LLVM 17.0.6 256 bits), OpenGL 4.5)',
    'softpipe',
    'lavapipe',
    'Microsoft Basic Render Driver',
    'ANGLE (Microsoft, Microsoft Basic Render Driver (0x0000008C) Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'Software Rasterizer',
  ])('%s → painted by the CPU', (renderer) => {
    expect(isSoftwareRenderer(renderer)).toBe(true);
  });

  it.each([
    NVIDIA,
    'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x00009A49) Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon RX 6700 XT (0x000073DF) Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'Apple GPU',
    'ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)',
    'Adreno (TM) 740',
    'Mali-G78 MC14',
    'Mesa Intel(R) UHD Graphics 620 (KBL GT2)',
    // El inventado de los e2e que se presentan como GPU: si cayera en software, irían al modo sin WebGL.
    FAKE_GPU_RENDERER,
  ])('%s → a graphics card', (renderer) => {
    expect(isSoftwareRenderer(renderer)).toBe(false);
  });
});

describe('detectWebGL2', () => {
  it('hardware: a context even with the caveat and a GPU renderer, released at once', () => {
    const loseContext = vi.fn();
    const getContext = stubGetContext(() => fakeContext({ unmasked: NVIDIA, loseContext }));
    expect(detectWebGL2()).toBe('hardware');
    expect(getContext).toHaveBeenCalledExactlyOnceWith('webgl2', {
      failIfMajorPerformanceCaveat: true,
    });
    // Lo suelta enseguida: los navegadores limitan los contextos vivos.
    expect(loseContext).toHaveBeenCalledTimes(1);
  });

  it('software: the renderer is SwiftShader although the caveat gave a context (Chromium without a GPU)', () => {
    const loseContext = vi.fn();
    const getContext = stubGetContext(() => fakeContext({ unmasked: SWIFTSHADER, loseContext }));
    expect(detectWebGL2()).toBe('software');
    expect(getContext).toHaveBeenCalledTimes(1);
    expect(loseContext).toHaveBeenCalledTimes(1);
  });

  it('reads RENDERER first when it is not the masked one, without asking for the debug extension (Firefox)', () => {
    const context = fakeContext({ renderer: 'llvmpipe, or similar' });
    stubGetContext(() => context);
    expect(detectWebGL2()).toBe('software');
    expect(context.getExtension).not.toHaveBeenCalledWith('WEBGL_debug_renderer_info');
  });

  it.each(['WebKit WebGL', 'Mozilla'])(
    'with the masked RENDERER «%s», the name comes from WEBGL_debug_renderer_info',
    (renderer) => {
      stubGetContext(() => fakeContext({ renderer, unmasked: 'Google SwiftShader' }));
      expect(detectWebGL2()).toBe('software');
    },
  );

  it('hardware when the name cannot be read (masked RENDERER and no debug extension)', () => {
    stubGetContext(() => fakeContext());
    expect(detectWebGL2()).toBe('hardware');
  });

  it('hardware when the browser gives something other than a string for the name', () => {
    stubGetContext(() => fakeContext({ renderer: null, unmasked: 42 }));
    expect(detectWebGL2()).toBe('hardware');
  });

  it('software: a context only without the caveat (painted by the CPU), released, without reading its name', () => {
    const loseContext = vi.fn();
    const context = fakeContext({ unmasked: NVIDIA, loseContext });
    const getContext = stubGetContext((_kind, attributes) =>
      withCaveat(attributes) ? null : context,
    );
    expect(detectWebGL2()).toBe('software');
    expect(getContext).toHaveBeenCalledTimes(2);
    expect(getContext).toHaveBeenLastCalledWith('webgl2');
    expect(loseContext).toHaveBeenCalledTimes(1);
    // Sin GPU usable el nombre ya no cambia nada: ni se lee ni se pide la extensión.
    expect(context.getParameter).not.toHaveBeenCalled();
    expect(context.getExtension).not.toHaveBeenCalledWith('WEBGL_debug_renderer_info');
  });

  it('a context without the extension to release it still counts', () => {
    stubGetContext(() => fakeContext({ unmasked: NVIDIA }));
    expect(detectWebGL2()).toBe('hardware');
  });

  it('none when the browser gives no context at all (WebGL off or blocklisted)', () => {
    stubGetContext(() => null);
    expect(detectWebGL2()).toBe('none');
  });

  it('none, and logs it, when asking throws', () => {
    const failure = new Error('GPU process crashed');
    stubGetContext(() => {
      throw failure;
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(detectWebGL2()).toBe('none');
    expect(consoleError).toHaveBeenCalledWith('[scene] WebGL2 detection failed', failure);
  });

  it('none, and logs it, when reading the renderer throws (Three.js would break too), still releasing it', () => {
    const failure = new Error('getParameter blocked');
    const loseContext = vi.fn();
    const context = fakeContext({ loseContext });
    context.getParameter.mockImplementation(() => {
      throw failure;
    });
    stubGetContext(() => context);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(detectWebGL2()).toBe('none');
    expect(loseContext).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith('[scene] WebGL2 detection failed', failure);
  });
});
