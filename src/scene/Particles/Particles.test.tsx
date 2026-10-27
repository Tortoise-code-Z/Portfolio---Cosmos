import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createSceneFrame } from '../sceneMaterials/sceneMaterials';
import { generateShapes } from '../shapes/generateShapes/generateShapes';
import { useParticles, type ParticlesProps } from './Particles';

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

const shapes = generateShapes({ count: 20, seed: 1, plates: [] });
const otherShapes = generateShapes({ count: 20, seed: 2, plates: [] });

function renderParticles(onFirstFrame = vi.fn()) {
  const frame = createSceneFrame();
  const hook = renderHook((props: ParticlesProps) => useParticles(props), {
    initialProps: { shapes, frame, onFirstFrame },
  });
  return { ...hook, frame, onFirstFrame };
}

describe('useParticles', () => {
  it('says it painted only in its first frame, and only once', () => {
    const { onFirstFrame } = renderParticles();
    expect(onFirstFrame).not.toHaveBeenCalled();
    paintFrame();
    expect(onFirstFrame).toHaveBeenCalledTimes(1);
    paintFrame();
    paintFrame();
    expect(onFirstFrame).toHaveBeenCalledTimes(1);
  });

  it('fills the uniforms from the shared frame in every frame, not only the first', () => {
    const { result, frame } = renderParticles();
    frame.m = 2.5;
    frame.time = 1.25;
    paintFrame();
    expect(result.current.material.uniforms.uM?.value).toBe(2.5);
    expect(result.current.material.uniforms.uTime?.value).toBe(1.25);
    frame.m = 3.5;
    frame.time = 2;
    paintFrame();
    expect(result.current.material.uniforms.uM?.value).toBe(3.5);
    expect(result.current.material.uniforms.uTime?.value).toBe(2);
  });

  it('new shapes: a new geometry and the old one freed; the material stays', () => {
    const { result, rerender, frame, onFirstFrame } = renderParticles();
    const { geometry, material } = result.current;
    const disposeGeometry = vi.spyOn(geometry, 'dispose');
    const disposeMaterial = vi.spyOn(material, 'dispose');
    rerender({ shapes: otherShapes, frame, onFirstFrame });
    expect(result.current.geometry).not.toBe(geometry);
    expect(disposeGeometry).toHaveBeenCalledTimes(1);
    expect(result.current.material).toBe(material);
    expect(disposeMaterial).not.toHaveBeenCalled();
  });

  it('frees the geometry and the material when unmounted', () => {
    const { result, unmount } = renderParticles();
    const disposeGeometry = vi.spyOn(result.current.geometry, 'dispose');
    const disposeMaterial = vi.spyOn(result.current.material, 'dispose');
    unmount();
    expect(disposeGeometry).toHaveBeenCalledTimes(1);
    expect(disposeMaterial).toHaveBeenCalledTimes(1);
  });
});
