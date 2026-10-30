import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { sceneStore, setScrollTarget } from '~/stores/sceneStore/sceneStore';
import { setSceneLevel, turnSceneOff, useUiStore } from '~/stores/uiStore/uiStore';

import { SceneStills, STILL_SOURCES } from './SceneStills';
import { DESKTOP_STILL_QUERY, STILL_CHAPTERS, stillFileName } from '../stillFrames/stillFrames';

afterEach(() => {
  useUiStore.setState(useUiStore.getInitialState(), true);
  sceneStore.setState(sceneStore.getInitialState(), true);
});

/** El modo sin WebGL, en el capítulo `chapter`. */
function renderOff(chapter = 0): ReturnType<typeof render> {
  turnSceneOff();
  setScrollTarget(chapter);
  return render(<SceneStills />);
}

const stills = (container: HTMLElement): HTMLImageElement[] => [
  ...container.querySelectorAll<HTMLImageElement>('img[data-chapter]'),
];
const still = (container: HTMLElement, chapter: number): HTMLImageElement => {
  const image = container.querySelector<HTMLImageElement>(`img[data-chapter="${String(chapter)}"]`);
  if (image === null) throw new Error(`No still for chapter ${String(chapter)}`);
  return image;
};
const visible = (container: HTMLElement): string[] =>
  stills(container)
    .filter((image) => image.dataset.visible === 'true')
    .map((image) => image.dataset.chapter ?? '');

/** Va al capítulo `chapter`, como el scroll del viaje (`m = mTarget`). */
function goTo(chapter: number): void {
  act(() => {
    setScrollTarget(chapter);
  });
}

describe('SceneStills', () => {
  it('paints nothing while the scene is undecided or painting: no DOM, no downloads', () => {
    setScrollTarget(2);
    const { container } = render(<SceneStills />);
    expect(container).toBeEmptyDOMElement();
    act(() => {
      setSceneLevel('high');
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('without WebGL, at the singularity: the decorative layer, and no still (the hero has its CSS dot)', () => {
    const { container } = renderOff(0);
    const layer = container.querySelector('[data-scene-stills]');
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(stills(container)).toEqual([]);
  });

  it('shows the still of the active chapter once it has arrived, decorative', () => {
    const { container } = renderOff(2);
    const galaxy = still(container, 2);
    expect(galaxy).toHaveAttribute('alt', '');
    expect(visible(container)).toEqual([]);
    fireEvent.load(galaxy);
    expect(visible(container)).toEqual(['2']);
  });

  it('keeps the previous still until the next one arrives, then fades between them', () => {
    const { container } = renderOff(2);
    fireEvent.load(still(container, 2));
    goTo(3);
    expect(visible(container)).toEqual(['2']);
    fireEvent.load(still(container, 3));
    expect(visible(container)).toEqual(['3']);
  });

  it('only downloads the chapters the visit goes through, and keeps them: going back is immediate', () => {
    const { container } = renderOff(1);
    fireEvent.load(still(container, 1));
    goTo(4);
    fireEvent.load(still(container, 4));
    expect(stills(container).map((image) => image.dataset.chapter)).toEqual(['1', '4']);
    goTo(1);
    expect(visible(container)).toEqual(['1']);
  });

  it('back at the singularity, no still is shown (they stay, already downloaded)', () => {
    const { container } = renderOff(3);
    fireEvent.load(still(container, 3));
    goTo(0);
    expect(visible(container)).toEqual([]);
    expect(stills(container)).toHaveLength(1);
  });

  it('a still that never arrives leaves the singularity empty rather than half-shown', () => {
    const { container } = renderOff(0);
    goTo(2);
    expect(visible(container)).toEqual([]);
  });

  it('offers the desktop still from the panels width and the handheld one below, in AVIF or WebP', () => {
    const { container } = renderOff(4);
    const sources = [...container.querySelectorAll('source')].map((source) => ({
      media: source.getAttribute('media'),
      type: source.getAttribute('type'),
      srcSet: source.getAttribute('srcset'),
    }));
    const { desktop, handheld } = STILL_SOURCES[4];
    expect(sources).toEqual([
      { media: DESKTOP_STILL_QUERY, type: 'image/avif', srcSet: desktop.avif },
      { media: DESKTOP_STILL_QUERY, type: 'image/webp', srcSet: desktop.webp },
      { media: null, type: 'image/avif', srcSet: handheld.avif },
    ]);
    expect(still(container, 4)).toHaveAttribute('src', handheld.webp);
  });

  it('has the files of every chapter and frame (stillFileName)', () => {
    for (const chapter of STILL_CHAPTERS) {
      for (const frame of ['desktop', 'handheld'] as const) {
        for (const format of ['avif', 'webp'] as const) {
          expect(STILL_SOURCES[chapter][frame][format]).toContain(
            `${stillFileName(frame, chapter)}.${format}`,
          );
        }
      }
    }
  });
});
