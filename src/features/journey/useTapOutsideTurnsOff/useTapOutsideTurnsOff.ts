import { useEffect } from 'react';

/**
 * Tocar fuera apaga lo encendido por un capítulo (un grupo de skills, un proyecto): solo un toque limpio, un `click`
 * (deslizar o salir del capítulo no lo dan). Se escucha en la fase de captura del documento, antes que nada de la
 * página: apaga, y si el toque cae en algo que enciende (un grupo, una fila, una etiqueta de la escena), su propio
 * `click` lo vuelve a encender después (manda el último gesto). Solo mientras `active` (la escena encendida).
 * `turnOff` debe ser estable (una función del módulo): si cambia, se vuelve a escuchar.
 */
export function useTapOutsideTurnsOff(active: boolean, turnOff: () => void): void {
  useEffect(() => {
    if (!active) return undefined;
    document.addEventListener('click', turnOff, { capture: true });
    return () => {
      document.removeEventListener('click', turnOff, { capture: true });
    };
  }, [active, turnOff]);
}
