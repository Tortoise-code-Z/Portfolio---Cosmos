/**
 * El reloj de las animaciones propias de la escena (`uTime`: giros, aletas, titileo). Con movimiento reducido
 * se congela (docs/04-escena/particulas-y-shaders.md → «Uniforms»); un salto grande entre frames (la pestaña
 * vuelve de estar oculta) avanza como mucho `MAX_STEP_S`, para que nada dé un salto.
 */
export interface SceneClock {
  /** Segundos de animación. */
  readonly time: number;
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
  let reduced = false;
  return {
    get time() {
      return time;
    },
    get reduced() {
      return reduced;
    },
    tick(seconds) {
      const step = last === null ? 0 : Math.min(Math.max(seconds - last, 0), MAX_STEP_S);
      last = seconds;
      if (!reduced) time += step;
    },
    setReduced(value) {
      reduced = value;
    },
  };
}
