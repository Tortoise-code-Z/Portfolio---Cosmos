import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import type { BufferGeometry, ShaderMaterial } from 'three';

import { createParticleGeometry } from '../particleGeometry/particleGeometry';
import {
  createParticleMaterial,
  createParticleUniforms,
  updateParticleUniforms,
  type SceneFrame,
} from '../sceneMaterials/sceneMaterials';
import type { ShapeSet } from '../shapes/shapeContract/shapeContract';

export interface ParticlesProps {
  readonly shapes: ShapeSet;
  /** El frame que rellena el bucle (`SceneRoot`): se lee, no se copia. */
  readonly frame: Readonly<SceneFrame>;
  /** Su primer frame: a partir de aquí la escena pinta algo (el relevo del punto del hero). */
  readonly onFirstFrame: () => void;
}

/**
 * Lo que montan las partículas: la geometría de las formas y el material (con sus uniforms). Rellena los
 * uniforms en cada frame, avisa **una vez** en el primero y libera la memoria de la GPU al cambiar las formas
 * (la geometría vieja) o al desmontar. Va aparte del componente para probarlo sin WebGL.
 */
export function useParticles({ shapes, frame, onFirstFrame }: ParticlesProps): {
  readonly geometry: BufferGeometry;
  readonly material: ShaderMaterial;
} {
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

  return { geometry, material };
}

/**
 * Las partículas (docs/04-escena/particulas-y-shaders.md): un solo `THREE.Points` con las 4 formas como
 * atributos; el shader mezcla la actual y la siguiente según `m`. Lo que cambia cada frame va por uniforms,
 * nunca por estado de React (ADR-004). Su lógica (geometría, uniforms, materiales) se prueba aparte; esto solo
 * la monta (`useParticles`).
 */
export function Particles(props: ParticlesProps): ReactNode {
  const { geometry, material } = useParticles(props);
  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
