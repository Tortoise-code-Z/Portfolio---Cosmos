import { afterEach, describe, expect, it, vi } from 'vitest';

import { detectWebGL2 } from './webgl2';

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

/** Un contexto que se puede soltar con `WEBGL_lose_context`. */
function releasableContext(loseContext: () => void) {
  return {
    getExtension: (name: string) => (name === 'WEBGL_lose_context' ? { loseContext } : null),
  };
}

const withCaveat = (attributes?: WebGLContextAttributes): boolean =>
  attributes?.failIfMajorPerformanceCaveat === true;

describe('detectWebGL2', () => {
  it('hardware: a context comes back even when asking for no major performance caveat', () => {
    const loseContext = vi.fn();
    const getContext = stubGetContext(() => releasableContext(loseContext));
    expect(detectWebGL2()).toBe('hardware');
    expect(getContext).toHaveBeenCalledExactlyOnceWith('webgl2', {
      failIfMajorPerformanceCaveat: true,
    });
    // Lo suelta enseguida: los navegadores limitan los contextos vivos.
    expect(loseContext).toHaveBeenCalledTimes(1);
  });

  it('software: a context only without the caveat (painted by the CPU), and both are released', () => {
    const loseContext = vi.fn();
    const getContext = stubGetContext((_kind, attributes) =>
      withCaveat(attributes) ? null : releasableContext(loseContext),
    );
    expect(detectWebGL2()).toBe('software');
    expect(getContext).toHaveBeenCalledTimes(2);
    expect(getContext).toHaveBeenLastCalledWith('webgl2', undefined);
    expect(loseContext).toHaveBeenCalledTimes(1);
  });

  it('a context without the extension to release it still counts', () => {
    stubGetContext(() => ({ getExtension: () => null }));
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
});
