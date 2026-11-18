import { describe, expect, it } from 'vitest';

import {
  cameraFov,
  cameraPose,
  createCameraPose,
  createParallax,
  type CameraPose,
} from '../camera/camera';
import { createScreenPoint, projectToScreen, type Viewport } from './projection';

/** Una cámara en `eye` que mira a `target`. */
function looking(eye: [number, number, number], target: [number, number, number]): CameraPose {
  const pose = createCameraPose();
  [pose.position.x, pose.position.y, pose.position.z] = eye;
  [pose.target.x, pose.target.y, pose.target.z] = target;
  return pose;
}

const VIEW: Viewport = { width: 1000, height: 500, fov: 90 };

describe('projectToScreen', () => {
  it('puts what the camera looks at in the centre of the canvas', () => {
    const out = projectToScreen(
      [3, 2, -7],
      looking([1, 2, 3], [3, 2, -7]),
      VIEW,
      createScreenPoint(),
    );
    expect(out.x).toBeCloseTo(500, 10);
    expect(out.y).toBeCloseTo(250, 10);
    expect(out.inFront).toBe(true);
  });

  it('right is right and up is up, with the aspect and the vertical field of view', () => {
    // Mirando hacia −Z desde el origen con 90° en vertical: a 1 de distancia, el borde de arriba está a 1 y el de la
    // derecha a 2 (aspecto 2).
    const pose = looking([0, 0, 0], [0, 0, -1]);
    const right = projectToScreen([2, 0, -1], pose, VIEW, createScreenPoint());
    expect([right.x, right.y]).toEqual([expect.closeTo(1000, 10), expect.closeTo(250, 10)]);
    const up = projectToScreen([0, 1, -1], pose, VIEW, createScreenPoint());
    expect([up.x, up.y]).toEqual([expect.closeTo(500, 10), expect.closeTo(0, 10)]);
    const half = projectToScreen([-1, -0.5, -2], pose, VIEW, createScreenPoint());
    expect([half.x, half.y]).toEqual([expect.closeTo(375, 10), expect.closeTo(312.5, 10)]);
  });

  it('says when a point is behind the camera, at it, or before its near plane (Three does not paint it)', () => {
    const pose = looking([0, 0, 0], [0, 0, -1]);
    expect(projectToScreen([0, 0, 5], pose, VIEW, createScreenPoint()).inFront).toBe(false);
    expect(projectToScreen([1, 0, 0], pose, VIEW, createScreenPoint()).inFront).toBe(false);
    expect(projectToScreen([0, 0, -0.05], pose, VIEW, createScreenPoint()).inFront).toBe(false);
    expect(projectToScreen([0, 0, -0.2], pose, VIEW, createScreenPoint()).inFront).toBe(true);
  });

  it('writes into the same object', () => {
    const out = createScreenPoint();
    expect(projectToScreen([0, 0, -1], looking([0, 0, 0], [0, 0, -1]), VIEW, out)).toBe(out);
  });

  it('with the galaxy camera (m = 2, desktop), the centre of the galaxy lands right of the centre', () => {
    const pose = cameraPose(2, true, createParallax(), createCameraPose());
    const viewport = { width: 1280, height: 720, fov: cameraFov(1280 / 720) };
    const out = projectToScreen([0, 0, 0], pose, viewport, createScreenPoint());
    expect(out.x).toBeGreaterThan(640);
    expect(out.y).toBeCloseTo(360, 6);
  });
});
