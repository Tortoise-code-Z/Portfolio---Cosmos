import { clamp } from '~/lib/math/clamp/clamp';

import { NO_PLATE, PLATE_LOOK } from '../../config/plateSlots/plateSlots';

/**
 * Qué placa del caparazón se ilumina en cada frame (docs/04-escena/constelaciones-y-placas.md → «Resaltado»): la del
 * proyecto señalado (fila o pin) y, si no hay ninguno, la del ciclo automático, que va por turnos cada
 * `PLATE_LOOK.cycleSeconds`. Mientras hay uno señalado, el ciclo se para y, al soltarlo, vuelve a contar desde cero en
 * la placa en la que estaba. Sin ciclo con movimiento reducido. Lejos de la tortuga, ninguna. Puras: `SceneRoot` las
 * aplica con lo que lee del frame y de `uiStore`.
 */

/** Presencia del capítulo 3 con la `m` de la escena: 1 en la tortuga y 0 a ±0,56 de ella. */
export function turtlePresence(m: number): number {
  return clamp(1 - Math.abs(m - PLATE_LOOK.turtleM) * PLATE_LOOK.presenceFade, 0, 1);
}

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
  /** La `m` de la escena (`SceneFrame.m`). */
  m: number;
  /** Segundos desde el frame anterior. */
  delta: number;
  reducedMotion: boolean;
  /** La placa del proyecto señalado, o `NO_PLATE`. */
  pointed: number;
}

export function createPlateStep(): PlateStep {
  return { m: 0, delta: 0, reducedMotion: false, pointed: NO_PLATE };
}

/**
 * Avanza el ciclo y devuelve la placa que se ilumina en este frame (`uPlate`), o `NO_PLATE`. `labels`: las placas con
 * proyecto, en el orden de su asignación (`assignPlates`: el destacado primero).
 */
export function stepPlates(cycle: PlateCycle, labels: readonly number[], step: PlateStep): number {
  const near = turtlePresence(step.m) > PLATE_LOOK.litFrom;
  const running = near && !step.reducedMotion && step.pointed === NO_PLATE && labels.length > 0;
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
  if (step.pointed !== NO_PLATE) return step.pointed;
  return running ? (labels[cycle.index % labels.length] ?? NO_PLATE) : NO_PLATE;
}
