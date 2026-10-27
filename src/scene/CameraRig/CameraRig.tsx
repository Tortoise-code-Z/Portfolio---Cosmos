import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { PerspectiveCamera, Vector3 } from 'three';

import {
  cameraFov,
  cameraPose,
  createCameraPose,
  createParallax,
  followParallax,
} from '../math/camera/camera';
import type { SceneFrame } from '../sceneMaterials/sceneMaterials';

export interface CameraRigProps {
  /** El frame que rellena el bucle (`SceneRoot`): se lee, no se copia. */
  readonly frame: Readonly<SceneFrame>;
}

/** El campo de visión para un aspecto (fuera del componente: la cámara es de R3F, no estado de React). */
function fitLens(camera: PerspectiveCamera, aspect: number): void {
  camera.fov = cameraFov(aspect);
  camera.updateProjectionMatrix();
}

/**
 * La cámara del viaje (docs/04-escena/camara-y-encuadre.md): en cada frame, antes de pintar, coloca la cámara
 * del `<Canvas>` según `m`, el encuadre de escritorio y el paralaje del ratón (`math/camera`), y ajusta el campo
 * de visión al aspecto (solo cuando cambia: `updateProjectionMatrix` no es gratis). Sin estado de React ni
 * objetos nuevos por frame (ADR-004). No pinta nada.
 */
export function CameraRig({ frame }: CameraRigProps): null {
  const camera = useThree((state) => state.camera);
  const [pose] = useState(createCameraPose);
  const [parallax] = useState(createParallax);
  const [lookAt] = useState(() => new Vector3());
  /** El aspecto con el que se calculó el campo de visión (`NaN`: aún ninguno). */
  const lensAspect = useRef(Number.NaN);

  useFrame(() => {
    if (camera instanceof PerspectiveCamera && frame.aspect !== lensAspect.current) {
      lensAspect.current = frame.aspect;
      fitLens(camera, frame.aspect);
    }
    followParallax(parallax, frame.pointer, !frame.reducedMotion, frame.delta);
    cameraPose(frame.m, frame.wide, parallax, pose);
    camera.position.set(pose.position.x, pose.position.y, pose.position.z);
    camera.lookAt(lookAt.set(pose.target.x, pose.target.y, pose.target.z));
  });

  return null;
}
