/**
 * El reloj de las animaciones propias de la escena (`uTime`: giros, aletas, titileo). Con movimiento reducido
 * se congela (docs/04-escena/particulas-y-shaders.md → «Uniforms»); un salto grande entre frames (la pestaña
 * vuelve de estar oculta) avanza como mucho `MAX_STEP_S`, para que nada dé un salto.
 */
export interface SceneClock {
  /** Segundos de animación. */
  readonly time: number;
  /**
   * Segundos reales del último frame, limitados a `MAX_STEP_S` (0 en el primero). Avanzan también con movimiento
   * reducido: son para los suavizados que dependen del tiempo (el paralaje de la cámara y la `m` de la escena),
   * no para animar.
   */
  readonly delta: number;
  /** Movimiento reducido: el reloj no avanza y las oscilaciones se anulan (`uMotion = 0`). */
  readonly reduced: boolean;
  /** Avanza al instante `seconds` (los del bucle de frames). */
  tick(seconds: number): void;
  setReduced(reduced: boolean): void;
}

/** Lo más que avanza el reloj de un frame al siguiente. */
export const MAX_STEP_S = 0.1;

export function createSceneClock(): SceneClock {
  let time = 0;
  let last: number | null = null;
  let delta = 0;
  let reduced = false;
  return {
    get time() {
      return time;
    },
    get delta() {
      return delta;
    },
    get reduced() {
      return reduced;
    },
    tick(seconds) {
      delta = last === null ? 0 : Math.min(Math.max(seconds - last, 0), MAX_STEP_S);
      last = seconds;
      if (!reduced) time += delta;
    },
    setReduced(value) {
      reduced = value;
    },
  };
}
