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
   * La posición en los tramos que pide el scroll (`lib/scroll/journeyPosition`: el tramo y lo recorrido de él), o
   * `null` mientras la página no ha medido los tramos (y en las maquetas y los tests que solo dan `m`). De ella salen
   * las formas y la nave (C.7 · naves); sin ella, la escena saca las formas de `m`, sin naves. Como `mTarget`, la
   * escena la suaviza en su frame.
   */
  readonly jTarget: number | null;
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
  /**
   * El capítulo que está llegando (su tramo de llegada, ADR-039: hoy, el epílogo), o `null`: lo escribe el scroll con
   * `m`. El raíl lo marca desde que empieza a llegar, aunque `m` aún esté más cerca del capítulo de antes.
   */
  readonly arriving: ChapterIndex | null;
  /**
   * Cuánto se separa el marco del retrato del Crew file del centro de la ventana, en px (y, hacia abajo): lo mide la
   * página (`usePortraitFollow`) y la escena mueve la imagen eso para que la cara vaya en su marco (ADR-042). 0, 0 sin
   * marco en la maqueta.
   */
  readonly portraitShift: { readonly x: number; readonly y: number };
}

export const sceneStore = createStore<SceneState>()(() => ({
  mTarget: 0,
  m: 0,
  jTarget: null,
  charge: 0,
  interlude: null,
  arriving: null,
  portraitShift: { x: 0, y: 0 },
}));

/**
 * Lo que pide el scroll: `m` y, si la página ya ha medido los tramos, la posición en ellos (`jTarget`; sin ella, se
 * queda como estaba). `m` lo sigue sin suavizado (la escena suaviza el suyo, ADR-028). Un valor que no es un número
 * finito no entra: lo leen la escena, el raíl, el HUD y el bucle del Big Bang, que no sabrían qué hacer con él.
 */
export function setScrollTarget(mTarget: number, jTarget?: number): void {
  const state = sceneStore.getState();
  const m = Number.isFinite(mTarget) ? mTarget : state.mTarget;
  const j = jTarget !== undefined && Number.isFinite(jTarget) ? jTarget : state.jTarget;
  if (state.mTarget === m && state.jTarget === j) return;
  sceneStore.setState({ mTarget: m, m, jTarget: j });
}

/** El interludio que se está leyendo (o `null`), con el scroll. */
export function setReadingInterlude(interlude: InterludeId | null): void {
  if (sceneStore.getState().interlude === interlude) return;
  sceneStore.setState({ interlude });
}

/** El capítulo que está llegando (o `null`), con el scroll. */
export function setReadingArrival(arriving: ChapterIndex | null): void {
  if (sceneStore.getState().arriving === arriving) return;
  sceneStore.setState({ arriving });
}

/** Dónde está el marco del retrato (`portraitShift`). Una cifra que no es un número finito cuenta como 0. */
export function setPortraitShift(x: number, y: number): void {
  const next = { x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0 };
  const { portraitShift } = sceneStore.getState();
  if (portraitShift.x === next.x && portraitShift.y === next.y) return;
  sceneStore.setState({ portraitShift: next });
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

/**
 * Lo que marca el raíl: el capítulo que está llegando (toda su llegada), el interludio mientras se lee (su pantalla y
 * la primera mitad de su cola, mientras la forma sigue siendo la del capítulo de antes) o, si no, el capítulo activo.
 * Una cadena: re-renderiza solo al cambiar.
 */
export function selectActiveStop({ m, interlude, arriving }: SceneState): JourneyStop {
  if (arriving !== null) return CHAPTER_STOPS[arriving];
  const chapter = activeChapter(m);
  if (interlude !== null && INTERLUDE[interlude].after === chapter) return interlude;
  return CHAPTER_STOPS[chapter];
}
