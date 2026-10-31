import { damp } from '~/lib/math/damp/damp';

import { GRAVITY } from '../../config/sceneConfig';
import type { ScenePointer } from '../../pointer/pointer';

/**
 * La gravedad del cursor en un frame (docs/04-escena/particulas-y-shaders.md → «Gravedad del cursor»): cuánta hay
 * (`strength`, el `uGrav` del shader) y dónde (`x`, `y` en NDC, el `uMouse`). Un solo objeto para toda la visita
 * (cero objetos nuevos por frame, ADR-004).
 */
export interface Gravity {
  strength: number;
  x: number;
  y: number;
}

export function createGravity(): Gravity {
  return { strength: 0, x: 0, y: 0 };
}

/**
 * La gravedad sigue al ratón: con él dentro de la ventana sube hasta 1 en su posición; al salir baja a 0 con el
 * mismo suavizado (`GRAVITY.rate`), apagándose en el último punto donde estuvo. Apagada (movimiento reducido), 0
 * de golpe. Solo cuenta el ratón (`ScenePointer`): en táctil nunca está dentro. `dt` en segundos
 * (`sceneClock.delta`, ya limitado).
 */
export function followGravity(
  gravity: Gravity,
  pointer: Readonly<ScenePointer>,
  enabled: boolean,
  dt: number,
): void {
  if (!enabled) {
    gravity.strength = 0;
    return;
  }
  if (pointer.inside) {
    gravity.x = pointer.x;
    gravity.y = pointer.y;
  }
  gravity.strength = damp(
    gravity.strength,
    pointer.inside ? 1 : 0,
    dt,
    GRAVITY.rate,
    GRAVITY.epsilon,
  );
}
