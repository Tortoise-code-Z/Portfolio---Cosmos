import { afterEach, describe, expect, it, vi } from 'vitest';

import { jumpBehavior, prefersReducedMotion, watchReducedMotion } from './reducedMotion';

/** `matchMedia` falso que solo casa la consulta exacta de movimiento reducido. */
function stubMatchMedia(matches: boolean): ReturnType<typeof vi.fn> {
  const matchMedia = vi.fn((query: string) => ({
    matches: matches && query === '(prefers-reduced-motion: reduce)',
    media: query,
  }));
  vi.stubGlobal('matchMedia', matchMedia);
  return matchMedia;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('prefersReducedMotion', () => {
  it('reads prefers-reduced-motion: reduce', () => {
    const matchMedia = stubMatchMedia(true);
    expect(prefersReducedMotion()).toBe(true);
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(jumpBehavior()).toBe('auto');
  });

  it('defaults to full motion', () => {
    stubMatchMedia(false);
    expect(prefersReducedMotion()).toBe(false);
    expect(jumpBehavior()).toBe('smooth');
  });

  it('answers no without matchMedia (pre-render, jsdom)', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe('watchReducedMotion', () => {
  it('tells the current preference, then every change, until it stops listening', () => {
    const listeners = new Set<(event: { matches: boolean }) => void>();
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: true,
        addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
          listeners.add(listener);
        },
        removeEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
          listeners.delete(listener);
        },
      })),
    );
    const onChange = vi.fn();
    const stop = watchReducedMotion(onChange);
    expect(onChange).toHaveBeenLastCalledWith(true);
    for (const listener of listeners) listener({ matches: false });
    expect(onChange).toHaveBeenLastCalledWith(false);
    stop();
    expect(listeners.size).toBe(0);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('without matchMedia: full motion, once', () => {
    vi.stubGlobal('matchMedia', undefined);
    const onChange = vi.fn();
    watchReducedMotion(onChange)();
    expect(onChange).toHaveBeenCalledExactlyOnceWith(false);
  });
});
