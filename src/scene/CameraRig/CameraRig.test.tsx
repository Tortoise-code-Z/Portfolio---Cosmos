import { render } from '@testing-library/react';
import { OrthographicCamera, PerspectiveCamera, Vector3, type Camera } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CAMERA_KEYFRAMES, PARALLAX } from '../config/sceneConfig';
import { cameraFov } from '../math/camera/camera';
import { createScreenPoint, projectToScreen } from '../math/projection/projection';
import { createSceneFrame, type SceneFrame } from '../sceneMaterials/sceneMaterials';
import { CAMERA_RIG_PRIORITY, CameraRig } from './CameraRig';

/** El `useFrame` y el `useThree` de R3F, a mano: la cámara que se le da y cada frame cuando se pide. */
const r3f = vi.hoisted(() => ({
  camera: null as Camera | null,
  frames: [] as (() => void)[],
  priorities: [] as (number | undefined)[],
}));
vi.mock('@react-three/fiber', () => ({
  useThree: (select: (state: { camera: Camera | null }) => unknown) =>
    select({ camera: r3f.camera }),
  useFrame: (callback: () => void, priority?: number) => {
    r3f.frames.push(callback);
    r3f.priorities.push(priority);
  },
}));

afterEach(() => {
  r3f.camera = null;
  r3f.frames = [];
  r3f.priorities = [];
});

/** Monta la cámara y devuelve cómo dar un frame (el último `useFrame` registrado, como R3F). */
function mountRig(camera: Camera, frame: SceneFrame = createSceneFrame()) {
  r3f.camera = camera;
  render(<CameraRig frame={frame} />);
  return {
    frame,
    tick: (): void => {
      r3f.frames.at(-1)?.();
    },
  };
}

/** Hacia dónde mira una cámara (unitario). */
function facing(camera: Camera): Vector3 {
  return camera.getWorldDirection(new Vector3());
}

describe('CameraRig', () => {
  it('puts the camera on the keyframe of m, looking at its target', () => {
    const camera = new PerspectiveCamera(55, 16 / 9, 0.1, 400);
    const { frame, tick } = mountRig(camera);
    frame.m = 3;
    tick();
    const turtle = CAMERA_KEYFRAMES[3];
    expect(camera.position.toArray()).toEqual([...turtle.position]);
    const expected = new Vector3(...turtle.target).sub(new Vector3(...turtle.position)).normalize();
    expect(facing(camera).distanceTo(expected)).toBeLessThan(1e-6);
  });

  for (const { width, height, wide } of [
    { width: 1280, height: 720, wide: true },
    { width: 390, height: 844, wide: false },
  ]) {
    it(`puts a point where math/projection says it goes at ${String(width)}×${String(height)} (the labels follow the canvas camera)`, () => {
      const camera = new PerspectiveCamera(55, width / height, 0.1, 400);
      const { frame, tick } = mountRig(camera);
      frame.m = 2;
      frame.wide = wide;
      frame.aspect = width / height;
      frame.delta = 0.05;
      frame.pointer.x = 0.6;
      frame.pointer.y = -0.4;
      frame.pointer.inside = true;
      for (let step = 0; step < 4; step += 1) tick();
      camera.updateMatrixWorld();
      camera.updateProjectionMatrix();
      // La pose que deja en el frame, la que usan las etiquetas: la de la cámara de Three, con el encuadre.
      const pose = frame.camera;
      const [tx, ty, tz] = CAMERA_KEYFRAMES[2].target;
      expect(pose.position).toEqual({
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      });
      expect(pose.target.x).toBeCloseTo(tx + (wide ? CAMERA_KEYFRAMES[2].shiftX : 0), 10);
      expect(pose.target.y).toBeCloseTo(ty, 10);
      expect(pose.target.z).toBeCloseTo(tz, 10);
      // El campo de visión es el de la cámara de Three (el estrecho en móvil, `cameraFov`).
      expect(camera.fov).toBe(cameraFov(width / height));
      const viewport = { width, height, fov: camera.fov };
      for (const point of [
        [5.3, 1.44, -15.77],
        [-4.84, 1.08, 7.18],
        [0, 0, 0],
      ] as const) {
        const ndc = new Vector3(...point).project(camera);
        const screen = projectToScreen(point, pose, viewport, createScreenPoint());
        expect(screen.x).toBeCloseTo(((ndc.x + 1) / 2) * width, 6);
        expect(screen.y).toBeCloseTo(((1 - ndc.y) / 2) * height, 6);
      }
    });
  }

  it('moves the camera before every other frame callback (negative priority: R3F still paints)', () => {
    mountRig(new PerspectiveCamera());
    expect(r3f.priorities).toEqual([CAMERA_RIG_PRIORITY]);
    expect(CAMERA_RIG_PRIORITY).toBeLessThan(0);
  });

  it('leaves its pose and its field of view in the frame, for the labels that project after it', () => {
    const camera = new PerspectiveCamera(55, 1, 0.1, 400);
    const { frame, tick } = mountRig(camera);
    frame.m = 2;
    frame.aspect = 390 / 844;
    tick();
    expect(frame.camera.position).toEqual({
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    });
    expect(frame.camera.target).toEqual({ x: 0, y: 0, z: 0 });
    expect(frame.fov).toBe(camera.fov);
  });

  it('on desktop, the whole frame moves aside (shiftX); on narrow screens it stays centred', () => {
    const camera = new PerspectiveCamera();
    const { frame, tick } = mountRig(camera);
    frame.m = 1;
    tick();
    const centred = camera.position.x;
    frame.wide = true;
    tick();
    expect(camera.position.x - centred).toBeCloseTo(CAMERA_KEYFRAMES[1].shiftX, 10);
  });

  it('sets the field of view for the aspect only when the aspect changes', () => {
    const camera = new PerspectiveCamera(55, 1, 0.1, 400);
    const update = vi.spyOn(camera, 'updateProjectionMatrix');
    const { frame, tick } = mountRig(camera);
    frame.aspect = 390 / 844;
    tick();
    tick();
    expect(camera.fov).toBe(cameraFov(390 / 844));
    expect(update).toHaveBeenCalledTimes(1);
    frame.aspect = 16 / 9;
    tick();
    expect(camera.fov).toBe(55);
    expect(update).toHaveBeenCalledTimes(2);
  });

  it('eases towards the mouse with the real frame time, and not at all with reduced motion', () => {
    const camera = new PerspectiveCamera();
    const { frame, tick } = mountRig(camera);
    tick();
    const still = camera.position.clone();
    Object.assign(frame.pointer, { x: 1, y: 1, inside: true });
    frame.delta = 0.1;
    tick();
    const rate = 0.1 * PARALLAX.rate;
    expect(camera.position.x - still.x).toBeCloseTo(PARALLAX.x * rate, 10);
    expect(camera.position.y - still.y).toBeCloseTo(PARALLAX.y * rate, 10);
    frame.reducedMotion = true;
    tick();
    expect(camera.position.toArray()).toEqual(still.toArray());
  });

  it('moves a camera that is not a perspective one, without touching a field of view it does not have', () => {
    const camera = new OrthographicCamera();
    const update = vi.spyOn(camera, 'updateProjectionMatrix');
    const { tick } = mountRig(camera);
    tick();
    expect(camera.position.toArray()).toEqual([...CAMERA_KEYFRAMES[0].position]);
    expect(update).not.toHaveBeenCalled();
  });

  it('paints nothing of its own', () => {
    r3f.camera = new PerspectiveCamera();
    const { container } = render(<CameraRig frame={createSceneFrame()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
