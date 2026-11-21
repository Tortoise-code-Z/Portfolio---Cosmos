import { useUiStore } from '~/stores/uiStore/uiStore';

/**
 * ¿Debe la escena dejar de pintar? (docs/04-escena/rendimiento.md → «Ahorro de trabajo»): con la página oculta
 * (`visibilitychange`), con la misión rápida abierta (`uiStore.quickMissionOpen`, que tapa la escena) o, hasta F5, en
 * la página de un proyecto (`uiStore.projectPageOpen`: su velo la tapa casi entera). Avisa
 * ahora y cada vez que la respuesta cambie (no por cada evento); devuelve cómo dejar de escuchar. Lee el store por
 * suscripción, sin re-render.
 */
export function watchScenePause(
  onChange: (paused: boolean) => void,
  doc: Document = document,
): () => void {
  let last: boolean | null = null;
  const check = (): void => {
    const { quickMissionOpen, projectPageOpen } = useUiStore.getState();
    const paused = doc.visibilityState === 'hidden' || quickMissionOpen || projectPageOpen;
    if (paused === last) return;
    last = paused;
    onChange(paused);
  };
  check();
  doc.addEventListener('visibilitychange', check);
  const unsubscribe = useUiStore.subscribe(check);
  return () => {
    doc.removeEventListener('visibilitychange', check);
    unsubscribe();
  };
}
