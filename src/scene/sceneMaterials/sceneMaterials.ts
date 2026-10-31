import { AdditiveBlending, ShaderMaterial, Vector2, type IUniform } from 'three';

import { smoothstep } from '~/lib/math/smoothstep/smoothstep';

import { createGravity, type Gravity } from '../math/gravity/gravity';
import { createScenePointer, type ScenePointer } from '../pointer/pointer';
import { glslHeader } from '../shaders/glslHeader/glslHeader';
import particlesFragment from '../shaders/particles/particles.frag.glsl?raw';
import particlesVertex from '../shaders/particles/particles.vert.glsl?raw';
import starsFragment from '../shaders/stars/stars.frag.glsl?raw';
import starsVertex from '../shaders/stars/stars.vert.glsl?raw';

/**
 * Materiales de la escena (docs/04-escena/particulas-y-shaders.md → «Uniforms» y «Material»): los shaders con
 * su cabecera (etiquetas y colores desde TypeScript), los uniforms y cómo se ponen al día en cada frame, sin
 * crear objetos.
 */

export interface ParticleUniforms {
  /** `m` (0–4). */
  readonly uM: IUniform<number>;
  /** Segundos de animación (congelados con movimiento reducido). */
  readonly uTime: IUniform<number>;
  /** Carga de la detonación (0–1): el punto crece y vibra (la vibración, sin movimiento reducido). */
  readonly uCharge: IUniform<number>;
  /** Densidad de píxeles del lienzo. */
  readonly uPR: IUniform<number>;
  /** Etiqueta de la placa iluminada (0 = ninguna). F4.4: hoy 0. */
  readonly uPlate: IUniform<number>;
  /** Gravedad del cursor, de 0 a 1 (0 en táctil, sin ratón dentro o con movimiento reducido). */
  readonly uGrav: IUniform<number>;
  readonly uAspect: IUniform<number>;
  /** Dónde tira la gravedad, en NDC (el ratón o, al apagarse, el último punto donde estuvo). */
  readonly uMouse: IUniform<Vector2>;
  /** 1 normal · 0 movimiento reducido (anula las oscilaciones propias). */
  readonly uMotion: IUniform<number>;
  /** 1 · 0 en Bajo: sin estela de la tortuga ni luces de ciudad. */
  readonly uExtras: IUniform<number>;
}

export interface StarUniforms {
  readonly uTime: IUniform<number>;
  readonly uPR: IUniform<number>;
  /** Antes del Big Bang no hay estrellas: sigue a `m`. */
  readonly uVisible: IUniform<number>;
}

/** Fuera de la pantalla (NDC va de −1 a 1): antes del primer frame, la gravedad no toca nada. */
export const POINTER_AWAY = 9;

/** Las estrellas aparecen con el Big Bang: `smoothstep(0,02; 0,4; m)`. */
export const STARS_VISIBLE_FROM = 0.02;
export const STARS_VISIBLE_AT = 0.4;

export function createParticleUniforms(): ParticleUniforms {
  return {
    uM: { value: 0 },
    uTime: { value: 0 },
    uCharge: { value: 0 },
    uPR: { value: 1 },
    uPlate: { value: 0 },
    uGrav: { value: 0 },
    uAspect: { value: 1 },
    uMouse: { value: new Vector2(POINTER_AWAY, POINTER_AWAY) },
    uMotion: { value: 1 },
    uExtras: { value: 1 },
  };
}

export function createStarUniforms(): StarUniforms {
  return { uTime: { value: 0 }, uPR: { value: 1 }, uVisible: { value: 0 } };
}

/**
 * Lo que cambia de un frame a otro. Un solo objeto para toda la visita: el bucle de frames lo rellena antes de
 * cada `advance()` y las piezas lo leen en su `useFrame` (cero objetos nuevos por frame, ADR-004).
 */
export interface SceneFrame {
  /**
   * La `m` de la escena, suavizada desde `mTarget` (ADR-028). Toda pieza de la escena lee esta, nunca
   * `sceneStore.m`.
   */
  m: number;
  /** Carga de la detonación (0–1), tal cual la deja el botón del hero en `sceneStore`. */
  charge: number;
  time: number;
  /** Segundos reales desde el frame anterior (`sceneClock.delta`): para suavizar, no para animar. */
  delta: number;
  reducedMotion: boolean;
  pixelRatio: number;
  aspect: number;
  /** Extras del nivel (estela y luces de ciudad; no en Bajo). */
  extras: boolean;
  /** Escritorio (`WIDE_LAYOUT_QUERY`, la media query de los paneles): el encuadre se aparta a un lado. */
  wide: boolean;
  /** El ratón (lo escribe `watchPointer`; es el mismo objeto toda la visita). */
  readonly pointer: ScenePointer;
  /** La gravedad del cursor (la pone al día el bucle con `followGravity`; el mismo objeto toda la visita). */
  readonly gravity: Gravity;
}

export function createSceneFrame(): SceneFrame {
  return {
    m: 0,
    charge: 0,
    time: 0,
    delta: 0,
    reducedMotion: false,
    pixelRatio: 1,
    aspect: 1,
    extras: true,
    wide: false,
    pointer: createScenePointer(),
    gravity: createGravity(),
  };
}

export function updateParticleUniforms(
  uniforms: ParticleUniforms,
  frame: Readonly<SceneFrame>,
): void {
  uniforms.uM.value = frame.m;
  uniforms.uCharge.value = frame.charge;
  uniforms.uTime.value = frame.time;
  uniforms.uPR.value = frame.pixelRatio;
  uniforms.uAspect.value = frame.aspect;
  uniforms.uMotion.value = frame.reducedMotion ? 0 : 1;
  uniforms.uExtras.value = frame.extras ? 1 : 0;
  uniforms.uGrav.value = frame.gravity.strength;
  uniforms.uMouse.value.set(frame.gravity.x, frame.gravity.y);
}

export function updateStarUniforms(uniforms: StarUniforms, frame: Readonly<SceneFrame>): void {
  uniforms.uTime.value = frame.time;
  uniforms.uPR.value = frame.pixelRatio;
  uniforms.uVisible.value = smoothstep(STARS_VISIBLE_FROM, STARS_VISIBLE_AT, frame.m);
}

/**
 * Luz que se suma, sin profundidad ni orden: el brillo «de galaxia» sale de sumar partículas. Sin conversión de
 * color ni mapeo de tonos (los shaders no incluyen los trozos de Three que los aplican).
 */
const ADDITIVE = {
  transparent: true,
  depthWrite: false,
  depthTest: false,
  blending: AdditiveBlending,
} as const;

export function createParticleMaterial(uniforms: ParticleUniforms): ShaderMaterial {
  return new ShaderMaterial({
    ...ADDITIVE,
    uniforms: { ...uniforms },
    vertexShader: glslHeader() + particlesVertex,
    fragmentShader: particlesFragment,
  });
}

export function createStarsMaterial(uniforms: StarUniforms): ShaderMaterial {
  return new ShaderMaterial({
    ...ADDITIVE,
    uniforms: { ...uniforms },
    vertexShader: glslHeader() + starsVertex,
    fragmentShader: starsFragment,
  });
}
