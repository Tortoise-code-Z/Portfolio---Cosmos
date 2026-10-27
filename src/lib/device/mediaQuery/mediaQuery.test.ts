import { afterEach, describe, expect, it, vi } from 'vitest';

import { watchMediaQuery } from './mediaQuery';

type Listener = (event: { matches: boolean }) => void;

/** `matchMedia` falso: casa lo que diga `matches` y guarda los oyentes de cada consulta. */
function stubMatchMedia(matches: boolean) {
  const listeners = new Map<string, Set<Listener>>();
  const matchMedia = vi.fn((query: string) => {
    const own = listeners.get(query) ?? new Set<Listener>();
    listeners.set(query, own);
    return {
      matches,
      media: query,
      // Solo `change`: otro tipo de evento no avisaría nunca.
      addEventListener: (type: string, listener: Listener) => {
        if (type === 'change') own.add(listener);
      },
      removeEventListener: (type: string, listener: Listener) => {
        if (type === 'change') own.delete(listener);
      },
    };
  });
  vi.stubGlobal('matchMedia', matchMedia);
  return { matchMedia, listeners };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('watchMediaQuery', () => {
  it('asks for that query once, tells the current answer, then every change, until it stops', () => {
    const { matchMedia, listeners } = stubMatchMedia(true);
    const onChange = vi.fn();
    const stop = watchMediaQuery('(width >= 900px)', onChange);
    expect(matchMedia).toHaveBeenCalledExactlyOnceWith('(width >= 900px)');
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(listeners.get('(width >= 900px)')?.size).toBe(1);
    for (const listener of listeners.get('(width >= 900px)') ?? []) listener({ matches: false });
    expect(onChange).toHaveBeenLastCalledWith(false);
    stop();
    expect(listeners.get('(width >= 900px)')?.size).toBe(0);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('without matchMedia: no, once', () => {
    vi.stubGlobal('matchMedia', undefined);
    const onChange = vi.fn();
    watchMediaQuery('(width >= 900px)', onChange)();
    expect(onChange).toHaveBeenCalledExactlyOnceWith(false);
  });
});
