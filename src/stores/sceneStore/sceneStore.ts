import { createStore } from 'zustand/vanilla';

import {
  CHAPTER_INDICES,
  CHAPTER_STOPS,
  INTERLUDE,
  type ChapterIndex,
  type InterludeId,
  type JourneyStop,
} from '~/content/chapters';
import { clamp } from '~/lib/math/clamp/clamp';

/**
 * Estado que comparten el scroll, la interfaz fija (raíl, HUD) y, desde F3, la escena
 * (docs/05-tecnico/arquitectura.md → «Estado»). Es un store *vanilla*: se lee con `getState()` o con
 * suscripciones, nunca re-renderiza por sí solo; un componente solo se repinta si elige un valor
 * discreto (el capítulo activo).
 */
export interface SceneState {
  /** `m` que pide el scroll (de 0 a 5). */
  readonly mTarget: number;
  /**
   * `m` de la interfaz (raíl, HUD, idioma): `mTarget` tal cual, a saltos. La escena no lo escribe: suaviza su propia
   * copia desde `mTarget` (`SceneFrame.m`, ADR-028).
   */
  readonly m: number;
  /**
   * Carga de la detonación (0–1), la del botón del hero: la escribe su bucle en cada frame mientras carga o se
   * descarga (como `mTarget` con el scroll) y la leen la escena (`uCharge`) y los efectos del Big Bang en el DOM.
   */
  readonly charge: number;
  /**
   * El interludio en cuyo tramo se lee (su pantalla o su cola), o `null`: lo escribe el scroll con `m`. Lo lee el raíl
   * y, a través del frame (`SceneFrame.transmission`, que copia el bucle de `SceneRoot`), los pins de las placas: se
   * ocultan mientras se lee Mission control. Las formas no lo necesitan (en un interludio, `m` se queda en la del
   * capítulo anterior).
   */
  readonly interlude: InterludeId | null;
}

export const sceneStore = createStore<SceneState>()(() => ({
  mTarget: 0,
  m: 0,
  charge: 0,
  interlude: null,
}));

/**
 * Lo que pide el scroll. `m` lo sigue sin suavizado (la escena suaviza el suyo, ADR-028). Un valor que no es un
 * número finito no entra: lo leen la escena, el raíl, el HUD y el bucle del Big Bang, que no sabrían qué hacer con él.
 */
export function setScrollTarget(mTarget: number): void {
  if (!Number.isFinite(mTarget) || sceneStore.getState().mTarget === mTarget) return;
  sceneStore.setState({ mTarget, m: mTarget });
}

/** El interludio que se está leyendo (o `null`), con el scroll. */
export function setReadingInterlude(interlude: InterludeId | null): void {
  if (sceneStore.getState().interlude === interlude) return;
  sceneStore.setState({ interlude });
}

/** La carga de la detonación (se queda entre 0 y 1). */
export function setCharge(value: number): void {
  const charge = Number.isFinite(value) ? clamp(value, 0, 1) : 0;
  if (sceneStore.getState().charge === charge) return;
  sceneStore.setState({ charge });
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

/**
 * Lo que marca el raíl: el interludio mientras se lee (su pantalla y la primera mitad de su cola, mientras la forma
 * sigue siendo la del capítulo de antes) o, si no, el capítulo activo. Una cadena: re-renderiza solo al cambiar.
 */
export function selectActiveStop({ m, interlude }: SceneState): JourneyStop {
  const chapter = activeChapter(m);
  if (interlude !== null && INTERLUDE[interlude].after === chapter) return interlude;
  return CHAPTER_STOPS[chapter];
}
