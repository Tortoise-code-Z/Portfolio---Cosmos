import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createSceneFrame } from '../sceneMaterials/sceneMaterials';
import { useBackgroundStars, type BackgroundStarsProps } from './BackgroundStars';

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

function renderStars(count = 50) {
  const frame = createSceneFrame();
  const hook = renderHook((props: BackgroundStarsProps) => useBackgroundStars(props), {
    initialProps: { count, frame },
  });
  return { ...hook, frame };
}

describe('useBackgroundStars', () => {
  it('one star per count, with its position and twinkle', () => {
    const { result } = renderStars(50);
    expect(result.current.geometry.getAttribute('position').count).toBe(50);
    expect(result.current.geometry.getAttribute('aR').count).toBe(50);
  });

  it('fills the uniforms from the shared frame in every frame, not only the first', () => {
    const { result, frame } = renderStars();
    const { uniforms } = result.current.material;
    frame.time = 1;
    frame.m = 0;
    paintFrame();
    expect(uniforms.uTime?.value).toBe(1);
    expect(uniforms.uVisible?.value).toBe(0);
    // Con el Big Bang ya hecho, se ven del todo.
    frame.time = 2.5;
    frame.m = 1;
    frame.pixelRatio = 2;
    paintFrame();
    expect(uniforms.uTime?.value).toBe(2.5);
    expect(uniforms.uVisible?.value).toBe(1);
    expect(uniforms.uPR?.value).toBe(2);
  });

  it('another count (the level went down): a new geometry and the old one freed; the material stays', () => {
    const { result, rerender, frame } = renderStars(50);
    const { geometry, material } = result.current;
    const disposeGeometry = vi.spyOn(geometry, 'dispose');
    const disposeMaterial = vi.spyOn(material, 'dispose');
    rerender({ count: 20, frame });
    expect(result.current.geometry).not.toBe(geometry);
    expect(result.current.geometry.getAttribute('position').count).toBe(20);
    expect(disposeGeometry).toHaveBeenCalledTimes(1);
    expect(result.current.material).toBe(material);
    expect(disposeMaterial).not.toHaveBeenCalled();
  });

  it('frees the geometry and the material when unmounted', () => {
    const { result, unmount } = renderStars();
    const disposeGeometry = vi.spyOn(result.current.geometry, 'dispose');
    const disposeMaterial = vi.spyOn(result.current.material, 'dispose');
    unmount();
    expect(disposeGeometry).toHaveBeenCalledTimes(1);
    expect(disposeMaterial).toHaveBeenCalledTimes(1);
  });
});
