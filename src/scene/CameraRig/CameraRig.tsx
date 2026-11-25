import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { PerspectiveCamera, Vector3 } from 'three';

import { arrivalShapeM } from '~/lib/scroll/arrival/arrival';

import { PORTRAIT_CHAPTER } from '../config/sceneConfig';
import {
  cameraFov,
  cameraPose,
  createParallax,
  followParallax,
  type CameraPose,
  type Parallax,
} from '../math/camera/camera';
import { chapterPresence } from '../math/chapterPresence/chapterPresence';
import type { SceneFrame } from '../sceneMaterials/sceneMaterials';

export interface CameraRigProps {
  /**
   * El frame que rellena el bucle (`SceneRoot`): se lee y, además, la cámara deja en él su pose y su campo de visión
   * (`frame.camera`, `frame.fov`) para quien proyecte después en el mismo frame (las etiquetas).
   */
  readonly frame: SceneFrame;
}

/** El campo de visión para un aspecto (fuera del componente: la cámara es de R3F, no estado de React). */
function fitLens(camera: PerspectiveCamera, aspect: number): void {
  camera.fov = cameraFov(aspect);
  camera.updateProjectionMatrix();
}

/**
 * La pose de este frame (`m`, encuadre y paralaje, que sigue al ratón), escrita en el frame con el campo de visión
 * de su aspecto, para quien proyecte después en el mismo frame. En la llegada del epílogo, la `m` de la forma
 * (`arrivalShapeM`, ADR-039): la cámara llega al retrato cuando el retrato está formado, como el shader.
 */
function aimCamera(frame: SceneFrame, parallax: Parallax): CameraPose {
  followParallax(parallax, frame.pointer, !frame.reducedMotion, frame.delta);
  frame.fov = cameraFov(frame.aspect);
  return cameraPose(arrivalShapeM(frame.m), frame.wide, parallax, frame.camera);
}

/** Lo que la imagen está movida ahora (px) y para qué tamaño del lienzo: solo se rehace la proyección si cambia. */
interface ViewShift {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Cuánto sigue la imagen al marco del retrato (0 → 1, ADR-042): la presencia del retrato con la `m` de la forma (la
 * misma que la cámara: 0 fuera del epílogo, 1 con el retrato formado; durante la llegada, la cara entra en el marco a
 * la vez que se forma).
 */
export function portraitFollow(frame: Readonly<SceneFrame>): number {
  return chapterPresence(arrivalShapeM(frame.m), PORTRAIT_CHAPTER);
}

/**
 * Mueve la imagen entera en pantalla (`setViewOffset`: la proyección se descentra, sin mover la cámara ni dejar
 * huecos) para que el retrato, que la cámara pinta en el centro, caiga en su marco. Sin desplazamiento, la proyección
 * de siempre (`clearViewOffset`, solo si estaba movida). Solo toca la proyección cuando cambia lo movido o el tamaño.
 */
function followFrame(
  camera: PerspectiveCamera,
  frame: Readonly<SceneFrame>,
  width: number,
  height: number,
  applied: ViewShift,
): void {
  const weight = portraitFollow(frame);
  const x = frame.portraitShift.x * weight;
  const y = frame.portraitShift.y * weight;
  const moved = camera.view?.enabled === true;
  if ((x === 0 && y === 0) || !(width > 0 && height > 0)) {
    if (moved) camera.clearViewOffset();
    return;
  }
  const same =
    x === applied.x && y === applied.y && width === applied.width && height === applied.height;
  if (moved && same) return;
  applied.x = x;
  applied.y = y;
  applied.width = width;
  applied.height = height;
  camera.setViewOffset(width, height, -x, -y, width, height);
}

/**
 * La prioridad de su `useFrame`: R3F los corre de menor a mayor, así que la cámara se mueve antes que lo que proyecta
 * con su pose (las etiquetas de las constelaciones, los pins de F4.4). Negativa: una prioridad mayor que 0 le quitaría
 * a R3F el pintado automático.
 */
export const CAMERA_RIG_PRIORITY = -1;

/**
 * La cámara del viaje (docs/04-escena/camara-y-encuadre.md): en cada frame, antes de pintar, coloca la cámara
 * del `<Canvas>` según `m`, el encuadre de escritorio y el paralaje del ratón (`math/camera`), y ajusta el campo
 * de visión al aspecto (solo cuando cambia: `updateProjectionMatrix` no es gratis). En el epílogo mueve la imagen con
 * el marco del retrato (`followFrame`, ADR-042). Deja la pose en el frame, y su `useFrame` corre antes que los demás
 * por su prioridad (`CAMERA_RIG_PRIORITY`), no por su sitio en el JSX. Lo que proyecta con la pose (las etiquetas, los
 * pins) no ve ese movimiento: en el epílogo no hay ninguno. Sin estado de React ni objetos nuevos por frame (ADR-004).
 * No pinta nada.
 */
export function CameraRig({ frame }: CameraRigProps): null {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const [parallax] = useState(createParallax);
  const [lookAt] = useState(() => new Vector3());
  /** El aspecto con el que se calculó el campo de visión (`NaN`: aún ninguno). */
  const lensAspect = useRef(Number.NaN);
  const [applied] = useState<ViewShift>(() => ({ x: 0, y: 0, width: 0, height: 0 }));

  useFrame(() => {
    if (camera instanceof PerspectiveCamera && frame.aspect !== lensAspect.current) {
      lensAspect.current = frame.aspect;
      fitLens(camera, frame.aspect);
    }
    if (camera instanceof PerspectiveCamera) {
      followFrame(camera, frame, size.width, size.height, applied);
    }
    const pose = aimCamera(frame, parallax);
    camera.position.set(pose.position.x, pose.position.y, pose.position.z);
    camera.lookAt(lookAt.set(pose.target.x, pose.target.y, pose.target.z));
  }, CAMERA_RIG_PRIORITY);

  return null;
}
