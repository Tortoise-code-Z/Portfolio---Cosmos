import { useEffect, type RefObject } from 'react';

/**
 * Escribe la altura del elemento (px) en una variable CSS y la mantiene al día con un
 * `ResizeObserver` (fuentes que cargan, cambio de ancho, idioma). Por defecto la variable va en el
 * propio elemento; con `on: 'root'` va en `<html>` (para reglas del documento, como el
 * `scroll-padding` que deja libre un aviso fijo) y se quita al desmontar. Sin `ResizeObserver`
 * (jsdom) no hace nada; en el pre-render el efecto ni se ejecuta. En ambos casos el CSS usa su valor
 * de reserva.
 */
export function useHeightVar(
  target: RefObject<HTMLElement | null>,
  variable: `--_${string}`,
  on: 'self' | 'root' = 'self',
): void {
  useEffect(() => {
    const element = target.current;
    if (element === null || typeof ResizeObserver === 'undefined') return undefined;
    const host = on === 'root' ? document.documentElement : element;
    const write = (): void => {
      host.style.setProperty(variable, `${String(element.offsetHeight)}px`);
    };
    write();
    const observer = new ResizeObserver(write);
    observer.observe(element);
    return () => {
      observer.disconnect();
      if (on === 'root') host.style.removeProperty(variable);
    };
  }, [target, variable, on]);
}
