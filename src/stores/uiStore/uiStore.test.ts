import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  closeQuickMission,
  openQuickMission,
  selectLanguageNoticeOpen,
  selectQuickMissionOpen,
  selectSceneLevel,
  setLanguageNoticeOpen,
  setSceneLevel,
  setVisitedProject,
  takeVisitedProject,
  turnSceneOff,
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

  it('starts with the scene level undecided', () => {
    expect(selectSceneLevel(useUiStore.getState())).toBeNull();
  });

  it('sets the scene level and can still change it while the scene is on', () => {
    setSceneLevel('high');
    expect(selectSceneLevel(useUiStore.getState())).toBe('high');
    setSceneLevel('medium');
    expect(selectSceneLevel(useUiStore.getState())).toBe('medium');
  });

  it('once off, the scene stays off for the rest of the visit', () => {
    setSceneLevel('low');
    turnSceneOff();
    setSceneLevel('high');
    expect(selectSceneLevel(useUiStore.getState())).toBe('off');
  });

  it('does not notify when the scene level or the language notice did not change', () => {
    const listener = vi.fn();
    const unsubscribe = useUiStore.subscribe(listener);
    setSceneLevel('high');
    setSceneLevel('high');
    turnSceneOff();
    turnSceneOff();
    setLanguageNoticeOpen(false);
    setLanguageNoticeOpen(true);
    setLanguageNoticeOpen(true);
    expect(listener).toHaveBeenCalledTimes(3);
    unsubscribe();
  });

  it('knows whether the language suggestion is showing', () => {
    expect(selectLanguageNoticeOpen(useUiStore.getState())).toBe(false);
    setLanguageNoticeOpen(true);
    expect(selectLanguageNoticeOpen(useUiStore.getState())).toBe(true);
  });
});
