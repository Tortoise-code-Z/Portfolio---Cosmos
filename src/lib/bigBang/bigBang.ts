import { clamp } from '../math/clamp/clamp';
import { smoothstep } from '../math/smoothstep/smoothstep';

/**
 * Los efectos del Big Bang fuera de la escena (docs/03-diseno/movimiento.md → «Coreografía del Big Bang» y
 * «Constantes de la experiencia»; docs/02-experiencia/capitulos/00-singularidad.md): el destello, el temblor, el
 * ancho del nombre y el halo, a partir de la `m` suavizada y la carga de la detonación. Solo cuentas: quien las
 * pinta es el bucle del hero, que las escribe como variables CSS (`BIG_BANG_VARS`).
 */

/**
 * Destello: dos golpes que se apagan solos al mismo ritmo (≈ 0,6 s). El del scroll (0,75) salta al empezar a bajar
 * (`m` cruza `scrollFromM`) y se rearma al volver arriba (`m` < `rearmBelowM`) con el golpe ya apagado: como mucho
 * uno cada ≈ 0,6 s, y quien se para a leer en el hero no se queda con un velo encima del texto (ADR-031). El de la
 * detonación es más fuerte (0,95).
 */
export const FLASH = {
  scrollFromM: 0.02,
  rearmBelowM: 0.01,
  scrollOpacity: 0.75,
  detonateOpacity: 0.95,
  /** Un golpe baja de 1 a 0 a este ritmo (≈ 0,6 s). */
  decayPerSecond: 1.6,
} as const;

/** Temblor, en píxeles: hasta 9 con el destello y 3 con la carga; por debajo de `minPx`, nada. */
export const SHAKE = { perFlashPx: 9, perChargePx: 3, minPx: 0.05 } as const;

/**
 * Ancho del nombre (eje `wdth`, en %): 62 en reposo; la carga lo comprime hasta el mínimo del eje (50) y la
 * explosión lo ensancha hasta 150 (`spread` repartido entre `m` 0 y `spreadUntilM`).
 */
export const HERO_WIDTH = {
  rest: 62,
  squeeze: 12,
  min: 50,
  max: 150,
  spread: 88,
  spreadUntilM: 0.35,
} as const;

/** Espaciado del nombre (em): se separan sus letras mientras sube y se va (de 0 a 0,25 em con `m` de 0 a 1). */
export const HERO_TRACKING = { perMEm: 0.25 } as const;

/** Halo: se apaga con la explosión (`m` 0–`fadeUntilM`) y crece con la carga (hasta ×2,6). */
export const HALO = { fadeUntilM: 0.12, growPerCharge: 1.6 } as const;

/** Desde aquí el hero ya se ha ido: el nombre y el halo se quedan en su valor final. */
export const BIG_BANG_UNTIL_M = 1;

/**
 * Variables CSS donde el bucle del hero deja los efectos (en `<html>`): privadas (`--_`, no son tokens; como
 * `--_notice-h`). Las leen el hero, el destello y el lienzo de la escena (tests de cada CSS), cada uno con su
 * valor de reposo.
 */
export const BIG_BANG_VARS = {
  flash: '--_bang-flash',
  shakeX: '--_bang-shake-x',
  shakeY: '--_bang-shake-y',
  heroWidth: '--_bang-hero-width',
  heroTracking: '--_bang-hero-tracking',
  haloFade: '--_bang-halo-fade',
  haloScale: '--_bang-halo-scale',
} as const;

/** Opacidad del destello (0–1) con el golpe del scroll y el de la detonación (cada uno, 1 → 0): manda el más fuerte. */
export function flashOpacity(scrollHit: number, detonateHit: number): number {
  return Math.max(
    clamp(scrollHit, 0, 1) * FLASH.scrollOpacity,
    clamp(detonateHit, 0, 1) * FLASH.detonateOpacity,
  );
}

/** Un golpe del destello tras `dt` segundos. */
export function decayHit(hit: number, dt: number): number {
  return Math.max(0, hit - Math.max(dt, 0) * FLASH.decayPerSecond);
}

/** ¿Salta el golpe del scroll? Armado y con la `m` suavizada ya en `scrollFromM` o más abajo. */
export function scrollHitFires(armed: boolean, m: number): boolean {
  return armed && m >= FLASH.scrollFromM;
}

/** ¿Se rearma el golpe del scroll? De vuelta arriba y con el anterior ya apagado. */
export function scrollHitRearms(m: number, scrollHit: number): boolean {
  return m < FLASH.rearmBelowM && scrollHit === 0;
}

/** Amplitud del temblor (px) con ese destello y esa carga; 0 si no llega a `minPx`. */
export function shakeAmplitude(flash: number, charge: number): number {
  const px = flash * SHAKE.perFlashPx + charge * SHAKE.perChargePx;
  return px < SHAKE.minPx ? 0 : px;
}

/**
 * Desplazamiento del temblor en un eje, entre −amplitud/2 y +amplitud/2: ruido determinista por frame (`step`) y
 * eje (`axis` 0 o 1), sin `Math.random` (el mismo temblor en cada visita, como la escena: ADR-011).
 */
export function shakeOffset(amplitude: number, step: number, axis: 0 | 1): number {
  const noise = Math.sin(step * 12.9898 + axis * 78.233) * 43_758.5453;
  return (noise - Math.floor(noise) - 0.5) * amplitude;
}

/** Ancho del nombre (`wdth`, %) con esa carga y esa `m`. */
export function heroWidth(charge: number, m: number): number {
  const width =
    HERO_WIDTH.rest -
    clamp(charge, 0, 1) * HERO_WIDTH.squeeze +
    smoothstep(0, HERO_WIDTH.spreadUntilM, m) * HERO_WIDTH.spread;
  return clamp(width, HERO_WIDTH.min, HERO_WIDTH.max);
}

/** Espaciado del nombre (em) con esa `m`. */
export function heroTracking(m: number): number {
  return clamp(m, 0, BIG_BANG_UNTIL_M) * HERO_TRACKING.perMEm;
}

/** Cuánto queda del halo (1 → 0) con esa `m`. */
export function haloFade(m: number): number {
  return 1 - smoothstep(0, HALO.fadeUntilM, m);
}

/** Escala del halo con esa carga. */
export function haloScale(charge: number): number {
  return 1 + clamp(charge, 0, 1) * HALO.growPerCharge;
}
