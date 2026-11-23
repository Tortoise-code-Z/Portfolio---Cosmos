import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, type ReactNode } from 'react';
import { BufferAttribute, BufferGeometry, type ShaderMaterial } from 'three';

import { SUN } from '../config/sceneConfig';
import {
  createSunMaterial,
  createSunUniforms,
  updateSunUniforms,
  type SceneFrame,
  type SunUniforms,
} from '../sceneMaterials/sceneMaterials';

export interface SunProps {
  readonly frame: Readonly<SceneFrame>;
}

/** Un cuadrado de −1 a 1 en dos triángulos: el shader lo abre hacia la cámara con el lado de `uSize`. */
const QUAD = [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0];

/** Un frame del Sol: sus uniforms y, fuera de su capítulo (opacidad 0), sin pintarse. */
function stepSun(
  uniforms: SunUniforms,
  material: ShaderMaterial,
  frame: Readonly<SceneFrame>,
): void {
  updateSunUniforms(uniforms, frame);
  material.visible = uniforms.uOpacity.value > 0;
}

/**
 * Lo que monta el Sol: su cuadrado y su material. Rellena los uniforms en cada frame (`updateSunUniforms`) y, fuera
 * de su capítulo, no se pinta (`material.visible`: un cuadrado tan grande, aunque transparente, costaría píxeles en
 * cada frame). Libera la GPU al desmontar. Va aparte del componente para probarlo sin WebGL.
 */
export function useSun({ frame }: SunProps): {
  readonly geometry: BufferGeometry;
  readonly material: ShaderMaterial;
} {
  const uniforms = useMemo(() => createSunUniforms(), []);
  const material = useMemo(() => createSunMaterial(uniforms), [uniforms]);
  const geometry = useMemo(() => {
    const quad = new BufferGeometry();
    quad.setAttribute('position', new BufferAttribute(new Float32Array(QUAD), 3));
    return quad;
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(() => {
    stepSun(uniforms, material, frame);
  });

  return { geometry, material };
}

/**
 * El Sol del capítulo de la Tierra (F4.5; docs/04-escena/particulas-y-shaders.md → «Sol»): un brillo que mira a la
 * cámara, sobre el limbo superior izquierdo de la Tierra, que aparece con su capítulo (cuando la Tierra ya está
 * pintada) y late despacio. No es una partícula: la gravedad del cursor no lo mueve. En todos los niveles (son dos
 * triángulos). Sin recorte (`frustumCulled`): Three recorta con la esfera de la geometría (radio √2) y el shader abre
 * el cuadrado más allá (`uSize / 2`, hasta 1,83); con el recorte, el halo desaparecería de golpe con el centro aún
 * fuera de la vista.
 */
export function Sun(props: SunProps): ReactNode {
  const { geometry, material } = useSun(props);
  return (
    <mesh geometry={geometry} material={material} position={SUN.position} frustumCulled={false} />
  );
}
