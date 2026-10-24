import { create } from 'zustand';

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
}

export const useUiStore = create<UiState>()(() => ({ quickMissionOpen: false }));

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
