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
  /**
   * Último proyecto cuya página se ha visto (su slug), hasta que el viaje lo recoge al volver para
   * dejar el foco en su fila (docs/02-experiencia/navegacion.md → «Volver desde una página de
   * proyecto»). Desde F4, la placa que se ilumina.
   */
  readonly visitedProject: string | null;
}

export const useUiStore = create<UiState>()(() => ({
  quickMissionOpen: false,
  visitedProject: null,
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
