/**
 * El medidor de fps de la degradación en caliente (docs/04-escena/rendimiento.md → «Degradación en caliente»).
 * Puro y sin asignaciones: el bucle de frames le pasa la hora de cada frame y contesta si toca bajar un nivel.
 *
 * - Los primeros `warmupS` segundos no cuentan (la geometría nueva, el DPR y lo que tarde el driver en asentarse;
 *   el frame que compila el shader ya queda fuera: solo se mide con partículas pintadas).
 * - Mide en ventanas de `windowS` segundos: frames pintados entre el tiempo transcurrido.
 * - Con `slowWindows` ventanas **seguidas** por debajo de `minFps`, contesta `true` una vez y empieza de cero.
 * - `discardWindow` tira la ventana en curso (la pausa: pestaña oculta o misión rápida). Las ventanas lentas
 *   ya cerradas siguen contando: lo que se midió antes de la pausa fue real.
 */

export interface FpsMeterOptions {
  /** Por debajo de esta media, la ventana es lenta. */
  readonly minFps: number;
  /** Lo que dura cada ventana, en segundos. */
  readonly windowS: number;
  /** Cuántas ventanas lentas seguidas hacen bajar. */
  readonly slowWindows: number;
  /** Segundos desde el primer frame que no se miden. */
  readonly warmupS: number;
}

export interface FpsMeter {
  /** Un frame pintado a los `seconds` del bucle. `true`: toca bajar un nivel. */
  sample(seconds: number): boolean;
  /** Tira la ventana en curso; la siguiente empieza con el próximo frame. */
  discardWindow(): void;
}

export function createFpsMeter({
  minFps,
  windowS,
  slowWindows,
  warmupS,
}: FpsMeterOptions): FpsMeter {
  let firstFrame: number | null = null;
  let windowStart: number | null = null;
  let frames = 0;
  let slow = 0;

  return {
    sample(seconds) {
      firstFrame ??= seconds;
      if (seconds - firstFrame < warmupS) return false;
      if (windowStart === null) {
        windowStart = seconds;
        frames = 0;
        return false;
      }
      frames += 1;
      const elapsed = seconds - windowStart;
      if (elapsed < windowS) return false;
      slow = frames / elapsed < minFps ? slow + 1 : 0;
      windowStart = seconds;
      frames = 0;
      if (slow < slowWindows) return false;
      slow = 0;
      return true;
    },
    discardWindow() {
      windowStart = null;
      frames = 0;
    },
  };
}
