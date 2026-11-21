import { CAMERA_LENS, type ScenePoint } from '../../config/sceneConfig';
import type { CameraPose } from '../camera/camera';

/**
 * De la escena a la pantalla (docs/04-escena/constelaciones-y-placas.md → «Etiquetas»), sin Three: la misma cuenta
 * que la cámara de perspectiva de `CameraRig` (`lookAt` con el «arriba» en +Y y el campo de visión vertical de
 * `cameraFov`). La usan las etiquetas proyectadas (F4.3) y los tests que comprueban que caben. Escribe en un
 * objeto que se crea una vez (cero objetos nuevos por frame, ADR-004). La cámara del viaje nunca está sobre su
 * objetivo ni mira en vertical (los keyframes de `sceneConfig`); en esos casos el resultado no es un número.
 */

export interface ScreenPoint {
  /** Píxeles CSS desde la izquierda del lienzo. */
  x: number;
  /** Píxeles CSS desde arriba del lienzo. */
  y: number;
  /**
   * Más allá del plano cercano de la cámara (`CAMERA_LENS.near`), donde Three lo pinta: si no, `x` e `y` no valen.
   * Con la cámara mirando en vertical, `x` e `y` no son números (no pasa en el viaje).
   */
  inFront: boolean;
}

/** El lienzo: su tamaño en píxeles CSS y el campo de visión vertical de su cámara, en grados. */
export interface Viewport {
  readonly width: number;
  readonly height: number;
  readonly fov: number;
}

export function createScreenPoint(): ScreenPoint {
  return { x: 0, y: 0, inFront: false };
}

const DEG_TO_RAD = Math.PI / 180;

/** El punto `[x, y, z]` de la escena, visto con `pose`, en píxeles del lienzo. */
export function projectToScreen(
  point: ScenePoint,
  pose: CameraPose,
  viewport: Viewport,
  out: ScreenPoint,
): ScreenPoint {
  const { position: eye, target } = pose;
  // Hacia delante (f), a la derecha (r = f × arriba) y arriba de la cámara (u = r × f).
  let fx = target.x - eye.x;
  let fy = target.y - eye.y;
  let fz = target.z - eye.z;
  const fl = Math.hypot(fx, fy, fz);
  fx /= fl;
  fy /= fl;
  fz /= fl;
  let rx = -fz;
  let rz = fx;
  const rl = Math.hypot(rx, rz);
  rx /= rl;
  rz /= rl;
  const ux = -rz * fy;
  const uy = rz * fx - rx * fz;
  const uz = rx * fy;

  // Por índice, sin desestructurar: corre una vez por etiqueta en cada frame (37 desde C.3).
  const dx = point[0] - eye.x;
  const dy = point[1] - eye.y;
  const dz = point[2] - eye.z;
  const depth = dx * fx + dy * fy + dz * fz;
  const halfHeight = Math.tan((viewport.fov / 2) * DEG_TO_RAD) * depth;
  const aspect = viewport.width / viewport.height;
  const ndcX = (dx * rx + dz * rz) / (halfHeight * aspect);
  const ndcY = (dx * ux + dy * uy + dz * uz) / halfHeight;
  out.x = ((ndcX + 1) / 2) * viewport.width;
  out.y = ((1 - ndcY) / 2) * viewport.height;
  out.inFront = depth > CAMERA_LENS.near;
  return out;
}
