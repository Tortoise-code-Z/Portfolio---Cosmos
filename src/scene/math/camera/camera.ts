import { clamp } from '~/lib/math/clamp/clamp';
import { damp } from '~/lib/math/damp/damp';
import { lerp } from '~/lib/math/lerp/lerp';
import { smoothstep } from '~/lib/math/smoothstep/smoothstep';

import {
  CAMERA_FIT,
  CAMERA_KEYFRAMES,
  CAMERA_LENS,
  PARALLAX,
  type CameraKeyframe,
  type ScenePoint,
} from '../../config/sceneConfig';
import type { ScenePointer } from '../../pointer/pointer';

/**
 * La cámara del viaje (docs/04-escena/camara-y-encuadre.md), en funciones puras: de `m`, el encuadre y el
 * paralaje a una posición y un objetivo. `CameraRig` las aplica a la cámara de Three en cada frame. Escriben en
 * objetos que se crean una vez (cero objetos nuevos por frame, ADR-004).
 */

export interface MutablePoint {
  x: number;
  y: number;
  z: number;
}

export interface CameraPose {
  readonly position: MutablePoint;
  /** Adónde mira (`lookAt`). */
  readonly target: MutablePoint;
}

/** El desplazamiento del paralaje, de −1 a 1 en cada eje (el puntero suavizado). */
export interface Parallax {
  x: number;
  y: number;
}

export function createCameraPose(): CameraPose {
  return { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } };
}

export function createParallax(): Parallax {
  return { x: 0, y: 0 };
}

const LAST_KEYFRAME = CAMERA_KEYFRAMES.length - 1;
const FIRST: CameraKeyframe = CAMERA_KEYFRAMES[0];

function keyframe(index: number): CameraKeyframe {
  return CAMERA_KEYFRAMES[index] ?? FIRST;
}

function mix(out: MutablePoint, from: ScenePoint, to: ScenePoint, t: number, shiftX: number): void {
  out.x = lerp(from[0], to[0], t) + shiftX;
  out.y = lerp(from[1], to[1], t);
  out.z = lerp(from[2], to[2], t);
}

/**
 * La pose para `m` (0–4; fuera, el capítulo del borde): entre el keyframe `k = ⌊m⌋` y el siguiente, con
 * `t = smoothstep(m − k)`; en `m = 4`, el último entero. En escritorio (`wide`) suma el `shiftX` interpolado a la
 * posición y al objetivo; el paralaje mueve solo la posición, así que la cámara gira un poco hacia el objetivo.
 */
export function cameraPose(
  m: number,
  wide: boolean,
  parallax: Readonly<Parallax>,
  out: CameraPose,
): CameraPose {
  const clamped = clamp(Number.isNaN(m) ? 0 : m, 0, LAST_KEYFRAME);
  const k = Math.min(Math.floor(clamped), LAST_KEYFRAME - 1);
  const t = smoothstep(0, 1, clamped - k);
  const from = keyframe(k);
  const to = keyframe(k + 1);
  const shiftX = wide ? lerp(from.shiftX, to.shiftX, t) : 0;
  mix(out.target, from.target, to.target, t, shiftX);
  mix(out.position, from.position, to.position, t, shiftX);
  out.position.x += parallax.x * PARALLAX.x;
  out.position.y += parallax.y * PARALLAX.y;
  return out;
}

const DEG_PER_RAD = 180 / Math.PI;
const HALF_FOV_TAN = Math.tan(CAMERA_LENS.fov / 2 / DEG_PER_RAD);

/**
 * Campo de visión vertical para un aspecto (ancho / alto): 55° en pantallas anchas; por debajo de 1,25 se
 * conserva el campo horizontal que habría a 1,25 (`2 · atan(tan(27,5°) · 1,25 / aspecto)`), con tope de 100°. Un
 * aspecto de 0 o raro (lienzo sin medir) da el tope, nunca `NaN`.
 */
export function cameraFov(aspect: number): number {
  if (aspect >= CAMERA_FIT.minAspect) return CAMERA_LENS.fov;
  if (!(aspect > 0)) return CAMERA_FIT.maxFov;
  const fov = 2 * Math.atan((HALF_FOV_TAN * CAMERA_FIT.minAspect) / aspect) * DEG_PER_RAD;
  return Math.min(CAMERA_FIT.maxFov, fov);
}

/**
 * El paralaje sigue al ratón con el suavizado de `damp` a ritmo `PARALLAX.rate`; sin ratón dentro,
 * vuelve al centro igual. Apagado (movimiento reducido) va al centro de golpe: un corte en vez de un movimiento.
 * `dt` en segundos (`sceneClock.delta`, ya limitado).
 */
export function followParallax(
  parallax: Parallax,
  pointer: Readonly<ScenePointer>,
  enabled: boolean,
  dt: number,
): void {
  if (!enabled) {
    parallax.x = 0;
    parallax.y = 0;
    return;
  }
  // El tope es del paralaje: arrastrando fuera de la ventana el puntero puede pasar de ±1 (`ScenePointer`).
  const toX = pointer.inside ? clamp(pointer.x, -1, 1) : 0;
  const toY = pointer.inside ? clamp(pointer.y, -1, 1) : 0;
  parallax.x = damp(parallax.x, toX, dt, PARALLAX.rate);
  parallax.y = damp(parallax.y, toY, dt, PARALLAX.rate);
}
