import { afterEach, describe, expect, it, vi } from 'vitest';

import { closeQuickMission, openQuickMission, useUiStore } from '~/stores/uiStore/uiStore';

import { watchScenePause } from './pause';

/** Un documento falso: solo lo que lee `watchScenePause` (su visibilidad y el evento que la avisa). */
function fakeDocument(initial: DocumentVisibilityState = 'visible') {
  const target = new EventTarget();
  let state = initial;
  Object.defineProperty(target, 'visibilityState', { get: () => state });
  const doc = target as unknown as Document;
  return {
    doc,
    /** La página pasa a oculta o a la vista, como al cambiar de pestaña. */
    setVisibility(next: DocumentVisibilityState): void {
      state = next;
      target.dispatchEvent(new Event('visibilitychange'));
    },
  };
}

afterEach(() => {
  useUiStore.setState(useUiStore.getInitialState(), true);
});

describe('watchScenePause', () => {
  it('says now whether to pause: not with the page in view and the quick mission closed', () => {
    const onChange = vi.fn<(paused: boolean) => void>();
    watchScenePause(onChange, fakeDocument().doc)();
    expect(onChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('pauses while the page is hidden', () => {
    const page = fakeDocument();
    const onChange = vi.fn<(paused: boolean) => void>();
    const stop = watchScenePause(onChange, page.doc);
    page.setVisibility('hidden');
    expect(onChange).toHaveBeenLastCalledWith(true);
    page.setVisibility('visible');
    expect(onChange).toHaveBeenLastCalledWith(false);
    stop();
  });

  it('pauses while the quick mission is open', () => {
    const onChange = vi.fn<(paused: boolean) => void>();
    const stop = watchScenePause(onChange, fakeDocument().doc);
    openQuickMission();
    expect(onChange).toHaveBeenLastCalledWith(true);
    closeQuickMission();
    expect(onChange).toHaveBeenLastCalledWith(false);
    stop();
  });

  it('both reasons together: it goes on only when neither is left, and only tells changes', () => {
    const page = fakeDocument();
    const onChange = vi.fn<(paused: boolean) => void>();
    const stop = watchScenePause(onChange, page.doc);
    openQuickMission();
    page.setVisibility('hidden');
    closeQuickMission();
    expect(onChange.mock.calls.map(([paused]) => paused)).toEqual([false, true]);
    page.setVisibility('visible');
    expect(onChange.mock.calls.map(([paused]) => paused)).toEqual([false, true, false]);
    stop();
  });

  it('a page that starts hidden starts paused', () => {
    const onChange = vi.fn<(paused: boolean) => void>();
    watchScenePause(onChange, fakeDocument('hidden').doc)();
    expect(onChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('a quick mission already open (entering by #quick) starts paused', () => {
    openQuickMission();
    const onChange = vi.fn<(paused: boolean) => void>();
    watchScenePause(onChange, fakeDocument().doc)();
    expect(onChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('listens to the document it is given (the real one by default)', () => {
    const onChange = vi.fn<(paused: boolean) => void>();
    const stop = watchScenePause(onChange, fakeDocument().doc);
    // El `document` de verdad no le dice nada.
    document.dispatchEvent(new Event('visibilitychange'));
    expect(onChange).toHaveBeenCalledTimes(1);
    stop();
    const real = vi.fn<(paused: boolean) => void>();
    const stopReal = watchScenePause(real);
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(real).toHaveBeenLastCalledWith(true);
    stopReal();
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });

  it('stops listening to both when asked', () => {
    const page = fakeDocument();
    const onChange = vi.fn<(paused: boolean) => void>();
    watchScenePause(onChange, page.doc)();
    page.setVisibility('hidden');
    openQuickMission();
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
