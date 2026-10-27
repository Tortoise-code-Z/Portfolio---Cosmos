import { createStore } from 'zustand/vanilla';

import { CHAPTER_INDICES, type ChapterIndex } from '~/content/chapters';
import { clamp } from '~/lib/math/clamp/clamp';

/**
 * Estado que comparten el scroll, la interfaz fija (raíl, HUD) y, desde F3, la escena
 * (docs/05-tecnico/arquitectura.md → «Estado»). Es un store *vanilla*: se lee con `getState()` o con
 * suscripciones, nunca re-renderiza por sí solo; un componente solo se repinta si elige un valor
 * discreto (el capítulo activo).
 */
export interface SceneState {
  /** `m` que pide el scroll (de 0 a 4). */
  readonly mTarget: number;
  /**
   * `m` de la interfaz (raíl, HUD, idioma): `mTarget` tal cual, a saltos. La escena no lo escribe: suaviza su propia
   * copia desde `mTarget` (`SceneFrame.m`, ADR-028).
   */
  readonly m: number;
}

export const sceneStore = createStore<SceneState>()(() => ({ mTarget: 0, m: 0 }));

/** Lo que pide el scroll. `m` lo sigue sin suavizado (la escena suaviza el suyo, ADR-028). */
export function setScrollTarget(mTarget: number): void {
  if (sceneStore.getState().mTarget === mTarget) return;
  sceneStore.setState({ mTarget, m: mTarget });
}

/** Capítulo activo para un `m`: el más cercano (`round(m)`), dentro de los que hay. */
export function activeChapter(m: number): ChapterIndex {
  const last = CHAPTER_INDICES.length - 1;
  return CHAPTER_INDICES[clamp(Math.round(m), 0, last)] ?? 0;
}

/** Selector del capítulo activo, para `useStore(sceneStore, selectActiveChapter)`: re-renderiza solo al cambiar. */
export function selectActiveChapter({ m }: SceneState): ChapterIndex {
  return activeChapter(m);
}
