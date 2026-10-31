import { AdditiveBlending } from 'three';
import { describe, expect, it } from 'vitest';

import { glslHeader } from '../shaders/glslHeader/glslHeader';
import {
  createParticleMaterial,
  createParticleUniforms,
  createSceneFrame,
  createStarsMaterial,
  createStarUniforms,
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

  it('reduced motion and the low level turn their uniforms off', () => {
    const uniforms = createParticleUniforms();
    updateParticleUniforms(uniforms, { ...frame, reducedMotion: true, extras: false });
    expect(uniforms.uMotion.value).toBe(0);
    expect(uniforms.uExtras.value).toBe(0);
  });
});

describe('createSceneFrame', () => {
  it('starts at the singularity, uncharged, with motion and extras, narrow and with no mouse', () => {
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
    });
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
  for (const [name, material, uniforms] of [
    ['particles', createParticleMaterial, createParticleUniforms],
    ['stars', createStarsMaterial, createStarUniforms],
  ] as const) {
    it(`${name}: additive light, no depth, the header first and the uniforms shared`, () => {
      const own = uniforms();
      const created = (material as (u: typeof own) => ReturnType<typeof createParticleMaterial>)(
        own,
      );
      expect(created.blending).toBe(AdditiveBlending);
      expect(created.transparent).toBe(true);
      expect(created.depthWrite).toBe(false);
      expect(created.depthTest).toBe(false);
      expect(created.vertexShader.startsWith(glslHeader())).toBe(true);
      for (const [key, uniform] of Object.entries(own)) expect(created.uniforms[key]).toBe(uniform);
    });
  }
});
