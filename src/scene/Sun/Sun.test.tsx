import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SUN } from '../config/sceneConfig';
import { createSceneFrame } from '../sceneMaterials/sceneMaterials';
import { Sun, useSun } from './Sun';

/** `useFrame` necesita el lienzo de R3F: aquí se guarda el callback para dar los frames a mano. */
const frameCallbacks = vi.hoisted((): (() => void)[] => []);
vi.mock('@react-three/fiber', () => ({
  useFrame: (callback: () => void) => {
    frameCallbacks.push(callback);
  },
}));

/** Un frame de R3F: el último callback registrado (el del render vigente). */
function paintFrame(): void {
  frameCallbacks.at(-1)?.();
}

afterEach(() => {
  frameCallbacks.length = 0;
});

function renderSun() {
  const frame = createSceneFrame();
  const hook = renderHook(() => useSun({ frame }));
  return { ...hook, frame };
}

describe('useSun', () => {
  it('one square of two triangles, from −1 to 1, for the shader to open towards the camera', () => {
    const { result } = renderSun();
    const position = result.current.geometry.getAttribute('position');
    expect(position.count).toBe(6);
    const corners = Array.from({ length: 6 }, (_, i) => [position.getX(i), position.getY(i)]);
    for (const [x, y] of corners) {
      expect(Math.abs(x ?? 0)).toBe(1);
      expect(Math.abs(y ?? 0)).toBe(1);
    }
  });

  it('is only painted near its chapter, with the uniforms of the shared frame in every frame', () => {
    const { result, frame } = renderSun();
    const { material } = result.current;
    frame.m = SUN.chapter - 1;
    paintFrame();
    expect(material.visible).toBe(false);
    expect(material.uniforms.uOpacity?.value).toBe(0);
    frame.m = SUN.chapter;
    frame.time = Math.PI / 2 / SUN.pulseRate;
    paintFrame();
    expect(material.visible).toBe(true);
    expect(material.uniforms.uOpacity?.value).toBe(SUN.opacity);
    expect(material.uniforms.uSize?.value).toBeCloseTo(SUN.size + SUN.pulse);
    // Al pasar al retrato se apaga otra vez.
    frame.m = SUN.chapter + 1;
    paintFrame();
    expect(material.visible).toBe(false);
  });

  it('frees the geometry and the material when unmounted', () => {
    const { result, unmount } = renderSun();
    const disposeGeometry = vi.spyOn(result.current.geometry, 'dispose');
    const disposeMaterial = vi.spyOn(result.current.material, 'dispose');
    unmount();
    expect(disposeGeometry).toHaveBeenCalledTimes(1);
    expect(disposeMaterial).toHaveBeenCalledTimes(1);
  });

  it('Sun mounts its square where the config puts it, always (it spans the screen: never culled)', () => {
    const frame = createSceneFrame();
    // El componente, llamado como un hook: da el `<mesh>` que R3F montaría.
    const { result } = renderHook(() => Sun({ frame }));
    const element = result.current as { type: string; props: Record<string, unknown> };
    expect(element.type).toBe('mesh');
    expect(element.props.position).toBe(SUN.position);
    expect(element.props.frustumCulled).toBe(false);
    expect(element.props.geometry).toBeDefined();
    expect(element.props.material).toBeDefined();
  });
});
