import { Color } from 'three';

import { hexToRgb } from '../config/scenePalette/scenePalette';

/** El token del color del espacio (ADR-005): el fondo del lienzo. */
export const VOID_TOKEN = '--color-void';

/**
 * El color de fondo del lienzo, leído de `--color-void` en `root` (`#rrggbb`), o `null` si el token falta o no
 * está en ese formato: se registra y el lienzo se queda con el fondo por defecto de Three.
 *
 * Los números del hex van tal cual al framebuffer, como la paleta de los shaders (`hexToRgb`): `setRGB` los
 * guarda en el espacio de trabajo sin convertir y, con la salida lineal del lienzo (`linear`), Three tampoco los
 * convierte al limpiar. `new Color('#…')` los linealizaría (el hex se toma como sRGB) y el espacio saldría casi
 * negro (particulas-y-shaders.md → «Colores»).
 */
export function readVoidColour(root: HTMLElement): Color | null {
  const value = getComputedStyle(root).getPropertyValue(VOID_TOKEN).trim();
  try {
    const [r, g, b] = hexToRgb(value);
    return new Color().setRGB(r, g, b);
  } catch {
    console.error(
      `[scene] ${VOID_TOKEN} is not a #rrggbb colour; the canvas keeps its default`,
      value,
    );
    return null;
  }
}
