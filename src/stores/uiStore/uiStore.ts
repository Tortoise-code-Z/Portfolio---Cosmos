import { create } from 'zustand';

import type { RenderLevel, SceneLevel } from '~/lib/device/sceneLevel/sceneLevel';

/**
 * Estado de interfaz que comparten varias piezas de React (docs/05-tecnico/arquitectura.md → «Estado»,
 * ADR-004). Se lee con selectores finos (`useUiStore(selectQuickMissionOpen)`): cada componente solo se
 * repinta cuando cambia lo que elige. Lo que cambia en cada frame no vive aquí, sino en `sceneStore`.
 */
export interface UiState {
  /**
   * Modo misión rápida abierto. Lo abren el botón de la barra y `/#quick`; lo cierran «Back to the
   * journey» y `Esc`. Desde F3, la escena deja de pintar mientras está abierto.
   */
  readonly quickMissionOpen: boolean;
  /**
   * Último proyecto cuya página se ha visto (su slug), hasta que el viaje lo recoge al volver para
   * dejar el foco en su fila (docs/02-experiencia/navegacion.md → «Volver desde una página de
   * proyecto»). Desde F5, la placa que se ilumina.
   */
  readonly visitedProject: string | null;
  /**
   * Nivel de la escena (docs/04-escena/rendimiento.md → «Niveles»). `null` mientras no se ha decidido
   * (pre-render, hidratación y hasta que el navegador queda libre); `off` es el modo sin WebGL, para el
   * resto de la visita. Lo decide `SceneMount`.
   */
  readonly sceneLevel: SceneLevel | null;
  /**
   * La sugerencia de idioma se está viendo. El aviso sin WebGL espera a que se conteste: los dos flotan
   * en el mismo sitio y nunca se tapan (uno detrás de otro).
   */
  readonly languageNoticeOpen: boolean;
}

export const useUiStore = create<UiState>()(() => ({
  quickMissionOpen: false,
  visitedProject: null,
  sceneLevel: null,
  languageNoticeOpen: false,
}));

function setQuickMissionOpen(quickMissionOpen: boolean): void {
  if (useUiStore.getState().quickMissionOpen === quickMissionOpen) return;
  useUiStore.setState({ quickMissionOpen });
}

export function openQuickMission(): void {
  setQuickMissionOpen(true);
}

export function closeQuickMission(): void {
  setQuickMissionOpen(false);
}

export function selectQuickMissionOpen({ quickMissionOpen }: UiState): boolean {
  return quickMissionOpen;
}

/** La página de un proyecto lo apunta al mostrarse. */
export function setVisitedProject(slug: string): void {
  if (useUiStore.getState().visitedProject === slug) return;
  useUiStore.setState({ visitedProject: slug });
}

/** Lee el último proyecto visto y lo olvida: se recoge una sola vez, al volver al viaje. */
export function takeVisitedProject(): string | null {
  const { visitedProject } = useUiStore.getState();
  if (visitedProject !== null) useUiStore.setState({ visitedProject: null });
  return visitedProject;
}

/** Nivel con el que se monta la escena. Tras `off` ya no cambia: la visita sigue sin WebGL. */
export function setSceneLevel(sceneLevel: RenderLevel): void {
  const current = useUiStore.getState().sceneLevel;
  if (current === sceneLevel || current === 'off') return;
  useUiStore.setState({ sceneLevel });
}

/** De más a menos: un nivel solo baja durante la visita (docs/04-escena/rendimiento.md → «Niveles»). */
const LEVEL_RANK: Readonly<Record<RenderLevel, number>> = { high: 3, medium: 2, low: 1 };

/**
 * Baja el nivel de la escena, nunca lo sube: el reintento de las formas en el hilo principal (a Bajo) y,
 * desde F3.6, la degradación en caliente. Sin nivel elegido o en Apagado, nada.
 */
export function lowerSceneLevel(sceneLevel: RenderLevel): void {
  const current = useUiStore.getState().sceneLevel;
  if (current === null || current === 'off') return;
  if (LEVEL_RANK[sceneLevel] < LEVEL_RANK[current]) useUiStore.setState({ sceneLevel });
}

/** Modo sin WebGL: sin WebGL2, o la escena falló (contexto, shader, chunk). No tiene vuelta atrás. */
export function turnSceneOff(): void {
  if (useUiStore.getState().sceneLevel === 'off') return;
  useUiStore.setState({ sceneLevel: 'off' });
}

export function selectSceneLevel({ sceneLevel }: UiState): SceneLevel | null {
  return sceneLevel;
}

/** Lo escribe la sugerencia de idioma al aparecer y al contestarse. */
export function setLanguageNoticeOpen(languageNoticeOpen: boolean): void {
  if (useUiStore.getState().languageNoticeOpen === languageNoticeOpen) return;
  useUiStore.setState({ languageNoticeOpen });
}

export function selectLanguageNoticeOpen({ languageNoticeOpen }: UiState): boolean {
  return languageNoticeOpen;
}
