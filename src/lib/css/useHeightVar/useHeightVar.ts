import { useEffect, type RefObject } from 'react';

/**
 * Escribe la altura del elemento (px) en una variable CSS suya y la mantiene al día con un
 * `ResizeObserver` (fuentes que cargan, cambio de ancho, idioma). Sin `ResizeObserver` (pre-render,
 * jsdom) no hace nada y el CSS usa su valor de reserva.
 */
export function useHeightVar(
  target: RefObject<HTMLElement | null>,
  variable: `--_${string}`,
): void {
  useEffect(() => {
    const element = target.current;
    if (element === null || typeof ResizeObserver === 'undefined') return undefined;
    const write = (): void => {
      element.style.setProperty(variable, `${String(element.offsetHeight)}px`);
    };
    write();
    const observer = new ResizeObserver(write);
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [target, variable]);
}
