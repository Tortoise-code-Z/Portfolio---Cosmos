import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { PerspectiveCamera, Vector3 } from 'three';

import {
  cameraFov,
  cameraPose,
  createParallax,
  followParallax,
  type CameraPose,
  type Parallax,
} from '../math/camera/camera';
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
 * de su aspecto, para quien proyecte después en el mismo frame.
 */
function aimCamera(frame: SceneFrame, parallax: Parallax): CameraPose {
  followParallax(parallax, frame.pointer, !frame.reducedMotion, frame.delta);
  frame.fov = cameraFov(frame.aspect);
  return cameraPose(frame.m, frame.wide, parallax, frame.camera);
}

/**
 * La cámara del viaje (docs/04-escena/camara-y-encuadre.md): en cada frame, antes de pintar, coloca la cámara
 * del `<Canvas>` según `m`, el encuadre de escritorio y el paralaje del ratón (`math/camera`), y ajusta el campo
 * de visión al aspecto (solo cuando cambia: `updateProjectionMatrix` no es gratis). Deja la pose en el frame: va la
 * primera dentro del `<Canvas>`, así que sus `useFrame` corren antes que los demás. Sin estado de React ni objetos
 * nuevos por frame (ADR-004). No pinta nada.
 */
export function CameraRig({ frame }: CameraRigProps): null {
  const camera = useThree((state) => state.camera);
  const [parallax] = useState(createParallax);
  const [lookAt] = useState(() => new Vector3());
  /** El aspecto con el que se calculó el campo de visión (`NaN`: aún ninguno). */
  const lensAspect = useRef(Number.NaN);

  useFrame(() => {
    if (camera instanceof PerspectiveCamera && frame.aspect !== lensAspect.current) {
      lensAspect.current = frame.aspect;
      fitLens(camera, frame.aspect);
    }
    const pose = aimCamera(frame, parallax);
    camera.position.set(pose.position.x, pose.position.y, pose.position.z);
    camera.lookAt(lookAt.set(pose.target.x, pose.target.y, pose.target.z));
  });

  return null;
}
