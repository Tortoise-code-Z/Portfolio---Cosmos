import { afterEach, describe, expect, it, vi } from 'vitest';

import { jumpBehavior, prefersReducedMotion } from './reducedMotion';

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
