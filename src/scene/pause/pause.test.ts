import { afterEach, describe, expect, it, vi } from 'vitest';

import { closeQuickMission, openQuickMission, useUiStore } from '~/stores/uiStore/uiStore';

import { watchScenePause } from './pause';

/** La página pasa a oculta o a la vista, como al cambiar de pestaña. */
function setVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

afterEach(() => {
  setVisibility('visible');
  useUiStore.setState(useUiStore.getInitialState(), true);
});

describe('watchScenePause', () => {
  it('says now whether to pause: not with the page in view and the quick mission closed', () => {
    const onChange = vi.fn<(paused: boolean) => void>();
    watchScenePause(onChange)();
    expect(onChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('pauses while the page is hidden', () => {
    const onChange = vi.fn<(paused: boolean) => void>();
    const stop = watchScenePause(onChange);
    setVisibility('hidden');
    expect(onChange).toHaveBeenLastCalledWith(true);
    setVisibility('visible');
    expect(onChange).toHaveBeenLastCalledWith(false);
    stop();
  });

  it('pauses while the quick mission is open', () => {
    const onChange = vi.fn<(paused: boolean) => void>();
    const stop = watchScenePause(onChange);
    openQuickMission();
    expect(onChange).toHaveBeenLastCalledWith(true);
    closeQuickMission();
    expect(onChange).toHaveBeenLastCalledWith(false);
    stop();
  });

  it('both reasons together: it goes on only when neither is left, and only tells changes', () => {
    const onChange = vi.fn<(paused: boolean) => void>();
    const stop = watchScenePause(onChange);
    openQuickMission();
    setVisibility('hidden');
    closeQuickMission();
    expect(onChange.mock.calls.map(([paused]) => paused)).toEqual([false, true]);
    setVisibility('visible');
    expect(onChange.mock.calls.map(([paused]) => paused)).toEqual([false, true, false]);
    stop();
  });

  it('a page that starts hidden starts paused', () => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    const onChange = vi.fn<(paused: boolean) => void>();
    watchScenePause(onChange)();
    expect(onChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('stops listening to both when asked', () => {
    const onChange = vi.fn<(paused: boolean) => void>();
    watchScenePause(onChange)();
    setVisibility('hidden');
    openQuickMission();
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
