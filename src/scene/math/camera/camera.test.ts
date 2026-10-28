// @vitest-environment node
// Lee un CSS del disco: no necesita DOM (y el URL de jsdom no acepta rutas file:).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { CAMERA_KEYFRAMES, PARALLAX, WIDE_LAYOUT_QUERY } from '../../config/sceneConfig';
import { createScenePointer, type ScenePointer } from '../../pointer/pointer';
import {
  cameraFov,
  cameraPose,
  createCameraPose,
  createParallax,
  followParallax,
  type CameraPose,
} from './camera';

const STILL = createParallax();

function pose(m: number, wide = false, parallax = STILL): CameraPose {
  return cameraPose(m, wide, parallax, createCameraPose());
}

function point([x, y, z]: readonly number[]) {
  return {
    x: expect.closeTo(x ?? 0, 10) as unknown,
    y: expect.closeTo(y ?? 0, 10) as unknown,
    z: expect.closeTo(z ?? 0, 10) as unknown,
  };
}

function pointer(x: number, y: number, inside = true): ScenePointer {
  return { x, y, inside };
}

describe('cameraPose', () => {
  it('sits exactly on each chapter keyframe at whole m, the last one included', () => {
    CAMERA_KEYFRAMES.forEach((key, m) => {
      expect(pose(m)).toEqual({ position: point(key.position), target: point(key.target) });
    });
  });

  it('between two chapters, eases with smoothstep of the fraction (not linearly)', () => {
    const [, nebula, galaxy] = CAMERA_KEYFRAMES;
    // A mitad, el punto medio; a un cuarto, smoothstep(0,25) = 0,15625 del camino.
    expect(pose(1.5).position).toEqual(point([0, 7.35, 16.3]));
    const t = 0.15625;
    expect(pose(1.25).position).toEqual(
      point(nebula.position.map((from, axis) => from + ((galaxy.position[axis] ?? 0) - from) * t)),
    );
    // La tortuga mira un poco por encima del origen: también se interpola el objetivo.
    expect(pose(2.5).target).toEqual(point([0, 0.3, 0]));
  });

  it('outside 0–4 stays on the edge chapter, and NaN is the singularity', () => {
    expect(pose(-1)).toEqual(pose(0));
    expect(pose(7)).toEqual(pose(4));
    expect(pose(Number.POSITIVE_INFINITY)).toEqual(pose(4));
    expect(pose(Number.NaN)).toEqual(pose(0));
  });

  it('on desktop shifts position and target alike (same angle), easing the shift too; not on narrow screens', () => {
    CAMERA_KEYFRAMES.forEach((key, m) => {
      const wide = pose(m, true);
      expect(wide.position.x).toBeCloseTo(key.position[0] + key.shiftX, 10);
      expect(wide.target.x).toBeCloseTo(key.target[0] + key.shiftX, 10);
      expect(pose(m).position.x).toBeCloseTo(key.position[0], 10);
    });
    // Entre la nebulosa (−3,4) y la galaxia (−4,1), a mitad: −3,75.
    expect(pose(1.5, true).target.x).toBeCloseTo(-3.75, 10);
    // La singularidad, centrada también en escritorio.
    expect(pose(0, true)).toEqual(pose(0));
  });

  it('the parallax moves the position only, up to its reach at the edge of the screen', () => {
    const moved = pose(3, true, { x: 1, y: -1 });
    const still = pose(3, true);
    expect(moved.position.x - still.position.x).toBeCloseTo(PARALLAX.x, 10);
    expect(moved.position.y - still.position.y).toBeCloseTo(-PARALLAX.y, 10);
    expect(moved.position.z).toBeCloseTo(still.position.z, 10);
    expect(moved.target).toEqual(still.target);
  });

  it('writes into the pose it gets and returns it: no new objects each frame', () => {
    const out = createCameraPose();
    const { position, target } = out;
    expect(cameraPose(2.2, true, STILL, out)).toBe(out);
    expect(out.position).toBe(position);
    expect(out.target).toBe(target);
  });
});

describe('cameraFov', () => {
  it('is 55° on wide screens, down to an aspect of 1.25', () => {
    expect(cameraFov(16 / 9)).toBe(55);
    expect(cameraFov(3)).toBe(55);
    expect(cameraFov(1.25)).toBe(55);
  });

  it('below 1.25 keeps the horizontal field of 1.25, without a jump at the edge', () => {
    const horizontal = (fov: number, aspect: number): number =>
      2 * Math.atan(Math.tan((fov * Math.PI) / 360) * aspect);
    const reference = horizontal(55, 1.25);
    // Casi cuadrado y tableta en vertical (768×1024): el mismo campo horizontal que a 1,25.
    for (const aspect of [1.2, 1, 768 / 1024, 0.6]) {
      expect(horizontal(cameraFov(aspect), aspect)).toBeCloseTo(reference, 10);
    }
    expect(cameraFov(1.2499)).toBeCloseTo(55, 2);
    expect(cameraFov(768 / 1024)).toBeCloseTo(81.9, 1);
  });

  it('never goes over 100°: the reference phones (390×844, 360×740) reach the cap, as in the prototype', () => {
    expect(cameraFov(390 / 844)).toBe(100);
    expect(cameraFov(360 / 740)).toBe(100);
    // Donde empieza el tope: tan(27,5°) · 1,25 / tan(50°) ≈ 0,546.
    expect(cameraFov(0.55)).toBeLessThan(100);
    expect(cameraFov(0.54)).toBe(100);
    expect(cameraFov(0.3)).toBe(100);
  });

  it('a canvas with no size gives the cap, not NaN', () => {
    expect(cameraFov(0)).toBe(100);
    expect(cameraFov(-1)).toBe(100);
    expect(cameraFov(Number.NaN)).toBe(100);
  });
});

describe('followParallax', () => {
  it('eases towards the mouse at its rate: min(1, dt · rate) of the way each frame', () => {
    const parallax = createParallax();
    followParallax(parallax, pointer(1, -0.5), true, 0.1);
    expect(parallax.x).toBeCloseTo(0.1 * PARALLAX.rate, 10);
    expect(parallax.y).toBeCloseTo(-0.5 * 0.1 * PARALLAX.rate, 10);
    // Un paso enorme llega, sin pasarse.
    followParallax(parallax, pointer(1, -0.5), true, 10);
    expect(parallax).toEqual({ x: 1, y: -0.5 });
  });

  it('with the mouse out of the window (or never in), eases back to the centre', () => {
    const parallax = { x: 1, y: 1 };
    followParallax(parallax, pointer(0.8, 0.8, false), true, 0.1);
    expect(parallax.x).toBeCloseTo(1 - 0.1 * PARALLAX.rate, 10);
    followParallax(parallax, createScenePointer(), true, 5);
    expect(parallax).toEqual({ x: 0, y: 0 });
  });

  it('switched off (reduced motion): back to the centre at once, a cut instead of a movement', () => {
    const parallax = { x: 0.6, y: -0.4 };
    followParallax(parallax, pointer(1, 1), false, 0.016);
    expect(parallax).toEqual({ x: 0, y: 0 });
  });

  it('a pointer dragged out of the window (beyond ±1) moves it no further than the edge', () => {
    const parallax = createParallax();
    followParallax(parallax, pointer(-3, 2), true, 10);
    expect(parallax).toEqual({ x: -1, y: 1 });
  });

  it('a frame without time (the first one) or with negative time does not move it', () => {
    const parallax = { x: 0.5, y: 0.5 };
    followParallax(parallax, pointer(-1, -1), true, 0);
    followParallax(parallax, pointer(-1, -1), true, -1);
    expect(parallax).toEqual({ x: 0.5, y: 0.5 });
  });
});

describe('WIDE_LAYOUT_QUERY', () => {
  it('is the query that puts the chapter panels to one side: the scene moves aside at the same width', () => {
    const panelCss = readFileSync(
      fileURLToPath(
        new URL('../../../features/journey/ChapterPanel/ChapterPanel.module.css', import.meta.url),
      ),
      'utf8',
    );
    expect(panelCss).toContain(`@media ${WIDE_LAYOUT_QUERY} {`);
  });
});
