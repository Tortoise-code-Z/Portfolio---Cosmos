import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SHAPE } from '~/lib/scroll/shapeTrack/shapeTrack';

import { PORTRAIT_FADE_IN_S } from '../config/sceneConfig';
import { createSceneFrame } from '../sceneMaterials/sceneMaterials';
import { generateShapes } from '../shapes/generateShapes/generateShapes';
import { PORTRAIT_LOAD_FROM_M } from '../shapes/shapeContract/shapeContract';
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
    expect(result.current.material.uniforms.uT?.value).toBe(0.5);
    expect(result.current.material.uniforms.uTime?.value).toBe(1.25);
    frame.m = 3.5;
    frame.time = 2;
    paintFrame();
    expect(result.current.material.uniforms.uM?.value).toBe(3.5);
    expect(result.current.material.uniforms.uFrom?.value).toBe(SHAPE.turtle);
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

describe('useParticles · the portrait', () => {
  it('asks for it once, when the scene m reaches PORTRAIT_LOAD_FROM_M (the turtle, a stretch before the Earth)', () => {
    const onPortraitWanted = vi.fn();
    const frame = createSceneFrame();
    renderHook((props: ParticlesProps) => useParticles(props), {
      initialProps: { shapes, frame, onFirstFrame: vi.fn(), onPortraitWanted },
    });
    frame.m = PORTRAIT_LOAD_FROM_M - 0.1;
    paintFrame();
    expect(onPortraitWanted).not.toHaveBeenCalled();
    frame.m = PORTRAIT_LOAD_FROM_M;
    paintFrame();
    frame.m = 4.5;
    paintFrame();
    expect(onPortraitWanted).toHaveBeenCalledTimes(1);
  });

  it('adds pPor to the geometry when it arrives and uPor rises from then; new shapes without it, uPor 0', () => {
    const frame = createSceneFrame();
    frame.delta = PORTRAIT_FADE_IN_S / 2;
    const portrait = new Float32Array(20 * 4);
    const initialProps: ParticlesProps = { shapes, frame, onFirstFrame: vi.fn(), portrait: null };
    const { result, rerender } = renderHook((props: ParticlesProps) => useParticles(props), {
      initialProps,
    });
    paintFrame();
    expect(result.current.geometry.getAttribute('pPor')).toBeUndefined();
    expect(result.current.material.uniforms.uPor?.value).toBe(0);
    rerender({ shapes, frame, onFirstFrame: vi.fn(), portrait });
    paintFrame();
    expect(result.current.geometry.getAttribute('pPor').array).toBe(portrait);
    expect(result.current.geometry.getAttribute('pPor').itemSize).toBe(4);
    expect(result.current.material.uniforms.uPor?.value).toBeCloseTo(0.5);
    paintFrame();
    expect(result.current.material.uniforms.uPor?.value).toBe(1);
    rerender({ shapes: otherShapes, frame, onFirstFrame: vi.fn(), portrait: null });
    paintFrame();
    expect(result.current.geometry.getAttribute('pPor')).toBeUndefined();
    expect(result.current.material.uniforms.uPor?.value).toBe(0);
  });

  it('new shapes and their slice of the portrait at once (the hot degradation): pPor in the very first frame, uPor kept', () => {
    const frame = createSceneFrame();
    frame.reducedMotion = true;
    const fewer = generateShapes({ count: 10, seed: 1, plates: [] });
    const portrait = new Float32Array(20 * 4);
    const initialProps: ParticlesProps = { shapes, frame, onFirstFrame: vi.fn(), portrait };
    const { result, rerender } = renderHook((props: ParticlesProps) => useParticles(props), {
      initialProps,
    });
    paintFrame();
    expect(result.current.material.uniforms.uPor?.value).toBe(1);
    frame.reducedMotion = false;
    frame.delta = 0;
    const slice = portrait.subarray(0, 10 * 4);
    rerender({ shapes: fewer, frame, onFirstFrame: vi.fn(), portrait: slice });
    // `rerender` (con `act`) corre también los efectos pasivos, así que esto fija el resultado, no el orden: que ningún
    // frame se cuele entre el render y el atributo lo dan `useLayoutEffect` y que `uPor` lea la geometría.
    paintFrame();
    expect(result.current.geometry.getAttribute('pPor').array).toBe(slice);
    expect(result.current.material.uniforms.uPor?.value).toBe(1);
  });

  it('says once that it painted the whole portrait (uPor 1), not before', () => {
    const onPortraitPainted = vi.fn();
    const frame = createSceneFrame();
    frame.delta = PORTRAIT_FADE_IN_S / 2;
    const portrait = new Float32Array(20 * 4);
    const initialProps: ParticlesProps = {
      shapes,
      frame,
      onFirstFrame: vi.fn(),
      onPortraitPainted,
    };
    const { rerender } = renderHook((props: ParticlesProps) => useParticles(props), {
      initialProps,
    });
    paintFrame();
    rerender({ shapes, frame, onFirstFrame: vi.fn(), onPortraitPainted, portrait });
    paintFrame();
    expect(onPortraitPainted).not.toHaveBeenCalled();
    paintFrame();
    paintFrame();
    expect(onPortraitPainted).toHaveBeenCalledTimes(1);
  });
});
