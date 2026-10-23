import { afterEach, describe, expect, it, vi } from 'vitest';

import { jumpBehavior, prefersReducedMotion } from './reducedMotion';

function stubMatchMedia(matches: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({ matches: matches && query.includes('reduce'), media: query })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('prefersReducedMotion', () => {
  it('reads prefers-reduced-motion: reduce', () => {
    stubMatchMedia(true);
    expect(prefersReducedMotion()).toBe(true);
    expect(jumpBehavior()).toBe('instant');
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
