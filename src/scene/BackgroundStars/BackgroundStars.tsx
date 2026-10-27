import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, type ReactNode } from 'react';
import type { BufferGeometry, ShaderMaterial } from 'three';

import { SCENE_SEED, STARS_SEED_NAME } from '../config/sceneConfig';
import { createStarsGeometry } from '../particleGeometry/particleGeometry';
import {
  createStarsMaterial,
  createStarUniforms,
  updateStarUniforms,
  type SceneFrame,
} from '../sceneMaterials/sceneMaterials';
import { mulberry32, subSeed } from '../shapes/prng/prng';
import { generateStars } from '../shapes/stars/stars';

export interface BackgroundStarsProps {
  /** Cuántas (las del nivel, `LEVEL_SETTINGS`). */
  readonly count: number;
  readonly frame: Readonly<SceneFrame>;
}

/**
 * Lo que montan las estrellas: su geometría (generada con su semilla para `count`) y el material. Rellena los
 * uniforms en cada frame y libera la memoria de la GPU al cambiar `count` (la geometría vieja; el nivel puede
 * bajar) o al desmontar. Va aparte del componente para probarlo sin WebGL.
 */
export function useBackgroundStars({ count, frame }: BackgroundStarsProps): {
  readonly geometry: BufferGeometry;
  readonly material: ShaderMaterial;
} {
  const uniforms = useMemo(() => createStarUniforms(), []);
  const material = useMemo(() => createStarsMaterial(uniforms), [uniforms]);
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const rand = new Float32Array(count);
    generateStars(count, mulberry32(subSeed(SCENE_SEED, STARS_SEED_NAME)), positions, rand);
    return createStarsGeometry(positions, rand);
  }, [count]);

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
    updateStarUniforms(uniforms, frame);
  });

  return { geometry, material };
}

/**
 * Estrellas de fondo (docs/04-escena/particulas-y-shaders.md → «Estrellas de fondo»): un `THREE.Points` aparte,
 * con su azar con semilla (el mismo cielo en cada visita), que aparece con el Big Bang.
 */
export function BackgroundStars(props: BackgroundStarsProps): ReactNode {
  const { geometry, material } = useBackgroundStars(props);
  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
