import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  closeQuickMission,
  openQuickMission,
  releaseActiveSkillGroup,
  selectActiveSkillGroup,
  selectLanguageNoticeOpen,
  selectQuickMissionOpen,
  selectSceneLevel,
  selectSceneOn,
  setActiveSkillGroup,
  setLanguageNoticeOpen,
  lowerSceneLevel,
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

  it('lowering the level only ever goes down, and does nothing before a level is chosen or once off', () => {
    const level = (): string | null => selectSceneLevel(useUiStore.getState());
    lowerSceneLevel('low');
    expect(level()).toBeNull();
    setSceneLevel('high');
    lowerSceneLevel('medium');
    expect(level()).toBe('medium');
    lowerSceneLevel('high');
    expect(level()).toBe('medium');
    lowerSceneLevel('medium');
    expect(level()).toBe('medium');
    lowerSceneLevel('low');
    expect(level()).toBe('low');
    turnSceneOff();
    lowerSceneLevel('low');
    expect(level()).toBe('off');
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

  it('the scene is on only with a chosen level and WebGL', () => {
    expect(selectSceneOn(useUiStore.getState())).toBe(false);
    setSceneLevel('low');
    expect(selectSceneOn(useUiStore.getState())).toBe(true);
    turnSceneOff();
    expect(selectSceneOn(useUiStore.getState())).toBe(false);
  });

  it('knows whether the language suggestion is showing', () => {
    expect(selectLanguageNoticeOpen(useUiStore.getState())).toBe(false);
    setLanguageNoticeOpen(true);
    expect(selectLanguageNoticeOpen(useUiStore.getState())).toBe(true);
  });

  it('keeps the lit skill group (none at first), and does not notify when it did not change', () => {
    expect(selectActiveSkillGroup(useUiStore.getState())).toBeNull();
    const listener = vi.fn();
    const unsubscribe = useUiStore.subscribe(listener);
    setActiveSkillGroup('tools');
    setActiveSkillGroup('tools');
    expect(selectActiveSkillGroup(useUiStore.getState())).toBe('tools');
    setActiveSkillGroup(null);
    expect(selectActiveSkillGroup(useUiStore.getState())).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it('releases a skill group only while it is still the lit one (the last gesture wins)', () => {
    setActiveSkillGroup('web');
    setActiveSkillGroup('ai');
    const listener = vi.fn();
    const unsubscribe = useUiStore.subscribe(listener);
    releaseActiveSkillGroup('web');
    expect(selectActiveSkillGroup(useUiStore.getState())).toBe('ai');
    expect(listener).not.toHaveBeenCalled();
    releaseActiveSkillGroup('ai');
    expect(selectActiveSkillGroup(useUiStore.getState())).toBeNull();
    releaseActiveSkillGroup('ai');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
