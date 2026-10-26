import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';

import { createParticleGeometry } from './particleGeometry/particleGeometry';
import {
  createParticleMaterial,
  createParticleUniforms,
  updateParticleUniforms,
  type SceneFrame,
} from './sceneMaterials/sceneMaterials';
import type { ShapeSet } from './shapes/shapeContract/shapeContract';

export interface ParticlesProps {
  readonly shapes: ShapeSet;
  /** El frame que rellena el bucle (`SceneRoot`): se lee, no se copia. */
  readonly frame: Readonly<SceneFrame>;
  /** Su primer frame: a partir de aquí la escena pinta algo (el relevo del punto del hero). */
  readonly onFirstFrame: () => void;
}

/**
 * Las partículas (docs/04-escena/particulas-y-shaders.md): un solo `THREE.Points` con las 4 formas como
 * atributos; el shader mezcla la actual y la siguiente según `m`. Lo que cambia cada frame va por uniforms,
 * nunca por estado de React (ADR-004). Su lógica (geometría, uniforms, materiales) se prueba aparte; esto solo
 * la monta y libera la memoria de la GPU al cambiar las formas o al desmontar.
 */
export function Particles({ shapes, frame, onFirstFrame }: ParticlesProps): ReactNode {
  const uniforms = useMemo(() => createParticleUniforms(), []);
  const material = useMemo(() => createParticleMaterial(uniforms), [uniforms]);
  const geometry = useMemo(() => createParticleGeometry(shapes), [shapes]);
  const painted = useRef(false);
  const onFirstFrameRef = useRef(onFirstFrame);

  useEffect(() => {
    onFirstFrameRef.current = onFirstFrame;
  }, [onFirstFrame]);
  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry],
  );
  useEffect(
    () => () => {
      material.dispose();
    },
    [material],
  );

  useFrame(() => {
    updateParticleUniforms(uniforms, frame);
    if (!painted.current) {
      painted.current = true;
      onFirstFrameRef.current();
    }
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
