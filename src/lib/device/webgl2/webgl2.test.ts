import { afterEach, describe, expect, it, vi } from 'vitest';

import { hasWebGL2 } from './webgl2';

afterEach(() => {
  vi.restoreAllMocks();
});

/** `getContext` falso para los lienzos que se creen mientras dure el test. */
function stubGetContext(implementation: (kind: string) => unknown) {
  return vi
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockImplementation(implementation as HTMLCanvasElement['getContext']);
}

describe('hasWebGL2', () => {
  it('says yes when a WebGL2 context comes back, and releases it at once', () => {
    const loseContext = vi.fn();
    const getExtension = vi.fn((name: string) =>
      name === 'WEBGL_lose_context' ? { loseContext } : null,
    );
    const getContext = stubGetContext(() => ({ getExtension }));
    expect(hasWebGL2()).toBe(true);
    expect(getContext).toHaveBeenCalledWith('webgl2');
    expect(loseContext).toHaveBeenCalledTimes(1);
  });

  it('says yes without the extension to release the context', () => {
    stubGetContext(() => ({ getExtension: () => null }));
    expect(hasWebGL2()).toBe(true);
  });

  it('says no when the browser gives no context (WebGL off or blocklisted)', () => {
    stubGetContext(() => null);
    expect(hasWebGL2()).toBe(false);
  });

  it('says no, and logs it, when asking throws', () => {
    const failure = new Error('GPU process crashed');
    stubGetContext(() => {
      throw failure;
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(hasWebGL2()).toBe(false);
    expect(consoleError).toHaveBeenCalledWith('[scene] WebGL2 detection failed', failure);
  });
});
