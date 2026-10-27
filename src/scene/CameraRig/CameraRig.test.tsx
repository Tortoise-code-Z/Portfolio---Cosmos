import { render } from '@testing-library/react';
import { OrthographicCamera, PerspectiveCamera, Vector3, type Camera } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CAMERA_KEYFRAMES, PARALLAX } from '../config/sceneConfig';
import { cameraFov } from '../math/camera/camera';
import { createSceneFrame, type SceneFrame } from '../sceneMaterials/sceneMaterials';
import { CameraRig } from './CameraRig';

/** El `useFrame` y el `useThree` de R3F, a mano: la cámara que se le da y cada frame cuando se pide. */
const r3f = vi.hoisted(() => ({
  camera: null as Camera | null,
  frames: [] as (() => void)[],
}));
vi.mock('@react-three/fiber', () => ({
  useThree: (select: (state: { camera: Camera | null }) => unknown) =>
    select({ camera: r3f.camera }),
  useFrame: (callback: () => void) => {
    r3f.frames.push(callback);
  },
}));

afterEach(() => {
  r3f.camera = null;
  r3f.frames = [];
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
