import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { BufferAttribute, type BufferGeometry, type ShaderMaterial } from 'three';

import { createParticleGeometry, PORTRAIT_ATTRIBUTE } from '../particleGeometry/particleGeometry';
import {
  createParticleMaterial,
  createParticleUniforms,
  updateParticleUniforms,
  type SceneFrame,
} from '../sceneMaterials/sceneMaterials';
import { PORTRAIT_LOAD_FROM_M, type ShapeSet } from '../shapes/shapeContract/shapeContract';

export interface ParticlesProps {
  readonly shapes: ShapeSet;
  /** El frame que rellena el bucle (`SceneRoot`): se lee, no se copia. */
  readonly frame: Readonly<SceneFrame>;
  /** Su primer frame: a partir de aquí la escena pinta algo (el relevo del punto del hero). */
  readonly onFirstFrame: () => void;
  /** El retrato (`pPor`) para estas formas, o `null` mientras no llega: el retrato pinta la Tierra. */
  readonly portrait?: Float32Array | null;
  /** La `m` de la escena llega a `PORTRAIT_LOAD_FROM_M`: hay que pedir el retrato (se llama una vez). */
  readonly onPortraitWanted?: () => void;
  /**
   * El primer frame que pinta el retrato entero (`uPor` 1): lo que esperan los e2e, las capturas y las fotos fijas
   * (`data-portrait`). Se llama una vez.
   */
  readonly onPortraitPainted?: () => void;
}

/**
 * Lo que montan las partículas: la geometría de las formas y el material (con sus uniforms). Rellena los
 * uniforms en cada frame, avisa **una vez** en el primero (y en el primero con el retrato entero) y libera la memoria de la GPU al cambiar las formas
 * (la geometría vieja) o al desmontar. Va aparte del componente para probarlo sin WebGL.
 */
export function useParticles({
  shapes,
  frame,
  onFirstFrame,
  portrait = null,
  onPortraitWanted,
  onPortraitPainted,
}: ParticlesProps): {
  readonly geometry: BufferGeometry;
  readonly material: ShaderMaterial;
} {
  const uniforms = useMemo(() => createParticleUniforms(), []);
  const material = useMemo(() => createParticleMaterial(uniforms), [uniforms]);
  const geometry = useMemo(() => createParticleGeometry(shapes), [shapes]);
  const painted = useRef(false);
  const onFirstFrameRef = useRef(onFirstFrame);
  const portraitWanted = useRef(false);
  const portraitPainted = useRef(false);
  const onPortraitWantedRef = useRef(onPortraitWanted);
  const onPortraitPaintedRef = useRef(onPortraitPainted);

  useEffect(() => {
    onFirstFrameRef.current = onFirstFrame;
    onPortraitWantedRef.current = onPortraitWanted;
    onPortraitPaintedRef.current = onPortraitPainted;
  }, [onFirstFrame, onPortraitWanted, onPortraitPainted]);
  // El retrato se añade a la geometría de sus formas cuando llega; se va con ella (su `dispose`). En el commit, antes
  // de que pinte ningún frame: con la degradación en caliente llegan a la vez las formas nuevas y su trozo del retrato.
  useLayoutEffect(() => {
    if (portrait !== null)
      geometry.setAttribute(PORTRAIT_ATTRIBUTE, new BufferAttribute(portrait, 4));
  }, [geometry, portrait]);
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
    // `uPor` sigue a la geometría que se pinta, no a un aviso aparte: nunca un frame con `uPor` y sin `pPor`.
    updateParticleUniforms(uniforms, frame, geometry.hasAttribute(PORTRAIT_ATTRIBUTE));
    if (!portraitWanted.current && frame.m >= PORTRAIT_LOAD_FROM_M) {
      portraitWanted.current = true;
      onPortraitWantedRef.current?.();
    }
    if (!portraitPainted.current && uniforms.uPor.value === 1) {
      portraitPainted.current = true;
      onPortraitPaintedRef.current?.();
    }
    if (!painted.current) {
      painted.current = true;
      onFirstFrameRef.current();
    }
  });

  return { geometry, material };
}

/**
 * Las partículas (docs/04-escena/particulas-y-shaders.md): un solo `THREE.Points` con las formas como atributos
 * (el retrato, cuando llega); el shader mezcla las dos que le da el mapa de formas (`uFrom` y `uTo`, con `uT`;
 * ADR-041). Lo que cambia cada frame va por uniforms, nunca por estado de React (ADR-004). Su lógica (geometría,
 * uniforms, materiales) se prueba aparte; esto solo la monta (`useParticles`).
 */
export function Particles(props: ParticlesProps): ReactNode {
  const { geometry, material } = useParticles(props);
  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
