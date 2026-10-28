import { afterEach, describe, expect, it, vi } from 'vitest';

import { activeChapter, sceneStore, selectActiveChapter, setScrollTarget } from './sceneStore';

afterEach(() => {
  sceneStore.setState(sceneStore.getInitialState(), true);
});

describe('sceneStore', () => {
  it('starts at the singularity', () => {
    expect(sceneStore.getState()).toEqual({ mTarget: 0, m: 0 });
  });

  it('m follows the scroll target as is (the scene smooths its own)', () => {
    setScrollTarget(2.4);
    expect(sceneStore.getState()).toEqual({ mTarget: 2.4, m: 2.4 });
  });

  it('does not notify when the target has not changed', () => {
    const listener = vi.fn();
    const unsubscribe = sceneStore.subscribe(listener);
    setScrollTarget(1);
    setScrollTarget(1);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});

describe('activeChapter', () => {
  it('is the nearest chapter: round(m)', () => {
    expect(activeChapter(0)).toBe(0);
    expect(activeChapter(0.49)).toBe(0);
    expect(activeChapter(0.5)).toBe(1);
    expect(activeChapter(2.999)).toBe(3);
    expect(activeChapter(4)).toBe(4);
  });

  it('stays within the chapters that exist', () => {
    expect(activeChapter(-1)).toBe(0);
    expect(activeChapter(9)).toBe(4);
    expect(activeChapter(Number.NaN)).toBe(0);
  });
});

describe('selectActiveChapter', () => {
  it('reads the active chapter from the state', () => {
    expect(selectActiveChapter({ mTarget: 3.2, m: 3.2 })).toBe(3);
  });
});
