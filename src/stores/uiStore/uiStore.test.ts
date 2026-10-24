import { afterEach, describe, expect, it, vi } from 'vitest';

import { closeQuickMission, openQuickMission, selectQuickMissionOpen, useUiStore } from './uiStore';

afterEach(() => {
  useUiStore.setState(useUiStore.getInitialState(), true);
});

describe('uiStore', () => {
  it('starts with the quick mission closed', () => {
    expect(selectQuickMissionOpen(useUiStore.getState())).toBe(false);
  });

  it('opens and closes the quick mission', () => {
    openQuickMission();
    expect(selectQuickMissionOpen(useUiStore.getState())).toBe(true);
    closeQuickMission();
    expect(selectQuickMissionOpen(useUiStore.getState())).toBe(false);
  });

  it('does not notify when nothing changed', () => {
    const listener = vi.fn();
    const unsubscribe = useUiStore.subscribe(listener);
    closeQuickMission();
    openQuickMission();
    openQuickMission();
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
