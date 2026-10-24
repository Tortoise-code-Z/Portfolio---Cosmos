import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  closeQuickMission,
  openQuickMission,
  selectQuickMissionOpen,
  setVisitedProject,
  takeVisitedProject,
  useUiStore,
} from './uiStore';

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

  it('remembers the last project page seen until the journey takes it, once', () => {
    expect(takeVisitedProject()).toBeNull();
    setVisitedProject('chessmate');
    setVisitedProject('astrohub');
    expect(takeVisitedProject()).toBe('astrohub');
    expect(takeVisitedProject()).toBeNull();
  });

  it('does not notify when the same project is set again or nothing is taken', () => {
    setVisitedProject('cosmos');
    const listener = vi.fn();
    const unsubscribe = useUiStore.subscribe(listener);
    setVisitedProject('cosmos');
    takeVisitedProject();
    takeVisitedProject();
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
