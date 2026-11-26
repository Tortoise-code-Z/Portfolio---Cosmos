import { NO_PLATE, PLATE_LOOK } from '../../config/plateSlots/plateSlots';

/**
 * Qué placa del caparazón se ilumina en cada frame (docs/04-escena/constelaciones-y-placas.md → «Resaltado»): la del
 * proyecto señalado (fila o pin) y, si no hay ninguno, la del ciclo automático, que va por turnos cada
 * `PLATE_LOOK.cycleSeconds`. Mientras hay uno señalado, tenga placa o no, el ciclo se para y, al soltarlo, vuelve a
 * contar desde cero en la placa en la que estaba. Sin ciclo con movimiento reducido. Con la presencia del capítulo 3 a
 * `litFrom` o menos, o en un interludio (la tortuga quieta tras el velo de Mission control, como los pins), ninguna.
 * Puras: `SceneRoot` las aplica con lo que lee del frame y de `uiStore`.
 */

/** El ciclo automático: la placa en la que va (índice en la lista de placas con proyecto) y el tiempo en ella. */
export interface PlateCycle {
  index: number;
  elapsed: number;
}

export function createPlateCycle(): PlateCycle {
  return { index: 0, elapsed: 0 };
}

/** Lo que mira el paso de las placas en cada frame (un objeto que se reutiliza: cero objetos nuevos por frame). */
export interface PlateStep {
  /** Cuánto está la tortuga (`shapePresence` de las formas del frame). */
  presence: number;
  /** Segundos desde el frame anterior. */
  delta: number;
  reducedMotion: boolean;
  /** Tras el velo de un interludio (sin naves, `SceneFrame.transmission`): ninguna placa y el ciclo, quieto. */
  transmission: boolean;
  /** Hay un proyecto señalado (con placa o sin ella: más de 7 proyectos): el ciclo se para. */
  pointing: boolean;
  /** La placa del proyecto señalado, o `NO_PLATE` (ninguno, o uno sin placa). */
  pointed: number;
}

export function createPlateStep(): PlateStep {
  return {
    presence: 0,
    delta: 0,
    reducedMotion: false,
    transmission: false,
    pointing: false,
    pointed: NO_PLATE,
  };
}

/**
 * Avanza el ciclo y devuelve la placa que se ilumina en este frame (`uPlate`), o `NO_PLATE`. `labels`: las placas con
 * proyecto, en el orden de su asignación (`assignPlates`: el destacado primero).
 */
export function stepPlates(cycle: PlateCycle, labels: readonly number[], step: PlateStep): number {
  const near = !step.transmission && step.presence > PLATE_LOOK.litFrom;
  const running = near && !step.reducedMotion && !step.pointing && labels.length > 0;
  if (!running) {
    cycle.elapsed = 0;
  } else {
    // Un paso que no es un número (o negativo) no avanza el ciclo: no lo deja roto para siempre.
    cycle.elapsed += Number.isFinite(step.delta) ? Math.max(step.delta, 0) : 0;
    const turns = Math.floor(cycle.elapsed / PLATE_LOOK.cycleSeconds);
    cycle.elapsed -= turns * PLATE_LOOK.cycleSeconds;
    cycle.index = (cycle.index + turns) % labels.length;
  }
  if (!near) return NO_PLATE;
  if (step.pointing) return step.pointed;
  return running ? (labels[cycle.index % labels.length] ?? NO_PLATE) : NO_PLATE;
}
