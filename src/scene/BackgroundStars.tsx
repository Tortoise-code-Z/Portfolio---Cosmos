import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, type ReactNode } from 'react';

import { SCENE_SEED, STARS_SEED_NAME } from './config/sceneConfig';
import { createStarsGeometry } from './particleGeometry/particleGeometry';
import {
  createStarsMaterial,
  createStarUniforms,
  updateStarUniforms,
  type SceneFrame,
} from './sceneMaterials/sceneMaterials';
import { mulberry32, subSeed } from './shapes/prng/prng';
import { generateStars } from './shapes/stars/stars';

export interface BackgroundStarsProps {
  /** Cuántas (las del nivel, `LEVEL_SETTINGS`). */
  readonly count: number;
  readonly frame: Readonly<SceneFrame>;
}

/**
 * Estrellas de fondo (docs/04-escena/particulas-y-shaders.md → «Estrellas de fondo»): un `THREE.Points` aparte,
 * con su azar con semilla (el mismo cielo en cada visita), que aparece con el Big Bang.
 */
export function BackgroundStars({ count, frame }: BackgroundStarsProps): ReactNode {
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

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
