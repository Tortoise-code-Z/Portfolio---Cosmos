import { AdditiveBlending } from 'three';
import { describe, expect, it } from 'vitest';

import { PORTRAIT_FADE_IN_S } from '../config/sceneConfig';
import constellationLinesFragment from '../shaders/constellations/constellationLines.frag.glsl?raw';
import constellationsVertex from '../shaders/constellations/constellations.vert.glsl?raw';
import constellationStarsFragment from '../shaders/constellations/constellationStars.frag.glsl?raw';
import { glslHeader } from '../shaders/glslHeader/glslHeader';
import particlesFragment from '../shaders/particles/particles.frag.glsl?raw';
import particlesVertex from '../shaders/particles/particles.vert.glsl?raw';
import starsFragment from '../shaders/stars/stars.frag.glsl?raw';
import starsVertex from '../shaders/stars/stars.vert.glsl?raw';
import {
  createConstellationLinesMaterial,
  createConstellationStarsMaterial,
  createConstellationUniforms,
  createParticleMaterial,
  createParticleUniforms,
  createSceneFrame,
  createStarsMaterial,
  createStarUniforms,
  motionOf,
  POINTER_AWAY,
  updateParticleUniforms,
  updateStarUniforms,
  type SceneFrame,
} from './sceneMaterials';

const frame: Readonly<SceneFrame> = {
  m: 2.5,
  charge: 0.4,
  time: 12,
  delta: 0.016,
  reducedMotion: false,
  pixelRatio: 2,
  aspect: 1.6,
  extras: true,
  wide: true,
  pointer: { x: 0.2, y: -0.4, inside: true },
  gravity: { strength: 0.7, x: 0.25, y: -0.5 },
  camera: { position: { x: 0, y: 12.9, z: 14.2 }, target: { x: 0, y: 0, z: 0 } },
  fov: 55,
  plate: 21,
  transmission: false,
  painted: true,
};

describe('particle uniforms', () => {
  it('start neutral: no charge, no lit plate, no gravity, the pointer away', () => {
    const uniforms = createParticleUniforms();
    expect(uniforms.uCharge.value).toBe(0);
    expect(uniforms.uPlate.value).toBe(0);
    expect(uniforms.uGrav.value).toBe(0);
    expect(uniforms.uMouse.value.toArray()).toEqual([POINTER_AWAY, POINTER_AWAY]);
  });

  it('take the frame in place (the same objects every frame)', () => {
    const uniforms = createParticleUniforms();
    const before = { ...uniforms };
    const mouse = uniforms.uMouse.value;
    updateParticleUniforms(uniforms, frame);
    expect(uniforms).toEqual(before);
    expect(uniforms.uM.value).toBe(2.5);
    expect(uniforms.uCharge.value).toBe(0.4);
    expect(uniforms.uPlate.value).toBe(21);
    expect(uniforms.uTime.value).toBe(12);
    expect(uniforms.uPR.value).toBe(2);
    expect(uniforms.uAspect.value).toBe(1.6);
    expect(uniforms.uMotion.value).toBe(1);
    expect(uniforms.uExtras.value).toBe(1);
    expect(uniforms.uGrav.value).toBe(0.7);
    expect(uniforms.uMouse.value).toBe(mouse);
    expect(mouse.toArray()).toEqual([0.25, -0.5]);
    for (const key of Object.keys(before) as (keyof typeof before)[]) {
      expect(uniforms[key]).toBe(before[key]);
    }
  });

  it('uPor: 0 until the portrait is in the geometry; then it rises to 1 in PORTRAIT_FADE_IN_S, real seconds', () => {
    const uniforms = createParticleUniforms();
    const step = { ...frame, delta: PORTRAIT_FADE_IN_S / 4 };
    expect(uniforms.uPor.value).toBe(0);
    updateParticleUniforms(uniforms, step);
    expect(uniforms.uPor.value).toBe(0);
    updateParticleUniforms(uniforms, step, true);
    expect(uniforms.uPor.value).toBeCloseTo(0.25);
    updateParticleUniforms(uniforms, step, true);
    expect(uniforms.uPor.value).toBeCloseTo(0.5);
    for (let i = 0; i < 5; i++) updateParticleUniforms(uniforms, step, true);
    expect(uniforms.uPor.value).toBe(1);
    updateParticleUniforms(uniforms, step);
    expect(uniforms.uPor.value).toBe(0);
  });

  it('uPor with reduced motion: straight to 1, with no rise', () => {
    const uniforms = createParticleUniforms();
    updateParticleUniforms(uniforms, { ...frame, reducedMotion: true, delta: 0.001 }, true);
    expect(uniforms.uPor.value).toBe(1);
  });

  it('reduced motion and the low level turn their uniforms off', () => {
    const uniforms = createParticleUniforms();
    updateParticleUniforms(uniforms, { ...frame, reducedMotion: true, extras: false });
    expect(uniforms.uMotion.value).toBe(0);
    expect(uniforms.uExtras.value).toBe(0);
  });
});

describe('createSceneFrame', () => {
  it('starts at the singularity, uncharged, with motion and extras, narrow, with no mouse and no lit plate', () => {
    expect(createSceneFrame()).toEqual({
      m: 0,
      charge: 0,
      time: 0,
      delta: 0,
      reducedMotion: false,
      pixelRatio: 1,
      aspect: 1,
      extras: true,
      wide: false,
      pointer: { x: 0, y: 0, inside: false },
      gravity: { strength: 0, x: 0, y: 0 },
      camera: { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } },
      fov: 55,
      plate: 0,
      transmission: false,
      painted: false,
    });
  });
});

describe('motionOf', () => {
  it('1 with motion, 0 with reduced motion: the uMotion of the shader', () => {
    expect(motionOf(frame)).toBe(1);
    expect(motionOf({ ...frame, reducedMotion: true })).toBe(0);
    const uniforms = createParticleUniforms();
    updateParticleUniforms(uniforms, { ...frame, reducedMotion: true });
    expect(uniforms.uMotion.value).toBe(motionOf({ ...frame, reducedMotion: true }));
  });
});

describe('constellation uniforms', () => {
  it('start hidden and say whether they paint stars or lines', () => {
    expect(createConstellationUniforms(false)).toEqual({
      uSize: { value: 0 },
      uPR: { value: 1 },
      uOpacity: { value: 0 },
      uLine: { value: 0 },
    });
    expect(createConstellationUniforms(true).uLine.value).toBe(1);
  });
});

describe('star uniforms', () => {
  it('no stars before the Big Bang; all of them from m = 0.4', () => {
    const uniforms = createStarUniforms();
    updateStarUniforms(uniforms, { ...frame, m: 0 });
    expect(uniforms.uVisible.value).toBe(0);
    updateStarUniforms(uniforms, { ...frame, m: 0.2 });
    expect(uniforms.uVisible.value).toBeGreaterThan(0);
    expect(uniforms.uVisible.value).toBeLessThan(1);
    updateStarUniforms(uniforms, { ...frame, m: 0.4 });
    expect(uniforms.uVisible.value).toBe(1);
    expect(uniforms.uTime.value).toBe(12);
    expect(uniforms.uPR.value).toBe(2);
  });
});

describe('materials', () => {
  for (const [name, material, uniforms, vertex, fragment] of [
    [
      'particles',
      createParticleMaterial,
      createParticleUniforms,
      particlesVertex,
      particlesFragment,
    ],
    ['stars', createStarsMaterial, createStarUniforms, starsVertex, starsFragment],
    [
      'constellation stars',
      createConstellationStarsMaterial,
      () => createConstellationUniforms(false),
      constellationsVertex,
      constellationStarsFragment,
    ],
    [
      'constellation lines',
      createConstellationLinesMaterial,
      () => createConstellationUniforms(true),
      constellationsVertex,
      constellationLinesFragment,
    ],
  ] as const) {
    it(`${name}: additive light, no depth, its own shaders with the header first and the uniforms shared`, () => {
      const own = uniforms();
      const created = (material as (u: typeof own) => ReturnType<typeof createParticleMaterial>)(
        own,
      );
      expect(created.blending).toBe(AdditiveBlending);
      expect(created.transparent).toBe(true);
      expect(created.depthWrite).toBe(false);
      expect(created.depthTest).toBe(false);
      expect(created.vertexShader).toBe(glslHeader() + vertex);
      expect(created.fragmentShader).toBe(fragment);
      for (const [key, uniform] of Object.entries(own)) expect(created.uniforms[key]).toBe(uniform);
    });
  }
});
