import { render } from '@testing-library/react';
import { OrthographicCamera, PerspectiveCamera, Vector3, type Camera } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EPILOGUE_ARRIVAL } from '~/lib/scroll/arrival/arrival';

import { CAMERA_KEYFRAMES, PARALLAX } from '../config/sceneConfig';
import { cameraFov, cameraPose, createCameraPose, createParallax } from '../math/camera/camera';
import { createScreenPoint, projectToScreen } from '../math/projection/projection';
import { createSceneFrame, type SceneFrame } from '../sceneMaterials/sceneMaterials';
import { CAMERA_RIG_PRIORITY, CameraRig, portraitFollow } from './CameraRig';

/** El `useFrame` y el `useThree` de R3F, a mano: la cámara que se le da y cada frame cuando se pide. */
const r3f = vi.hoisted(() => ({
  camera: null as Camera | null,
  size: { width: 1280, height: 720 },
  frames: [] as (() => void)[],
  priorities: [] as (number | undefined)[],
}));
vi.mock('@react-three/fiber', () => ({
  useThree: (
    select: (state: {
      camera: Camera | null;
      size: { readonly width: number; readonly height: number };
    }) => unknown,
  ) => select({ camera: r3f.camera, size: r3f.size }),
  useFrame: (callback: () => void, priority?: number) => {
    r3f.frames.push(callback);
    r3f.priorities.push(priority);
  },
}));

afterEach(() => {
  r3f.camera = null;
  r3f.size = { width: 1280, height: 720 };
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
  it('in the arrival of the epilogue it follows the shape, not the scroll: on the portrait once it is formed (ADR-039)', () => {
    const camera = new PerspectiveCamera(55, 16 / 9, 0.1, 400);
    const { frame, tick } = mountRig(camera);
    const pose = (m: number): number[] => {
      const { position } = cameraPose(m, frame.wide, createParallax(), createCameraPose());
      return [position.x, position.y, position.z];
    };
    // Valores fijos (`morphEnd` = 0,55): formado en 4,55 y quieto hasta 5; a medio formar (4,275), a medio camino.
    for (const [m, shape] of [
      [4.55, 5],
      [4.9, 5],
      [4.275, 4.5],
    ] as const) {
      frame.m = m;
      tick();
      camera.position.toArray().forEach((value, axis) => {
        expect(value).toBeCloseTo(pose(shape)[axis] ?? Number.NaN, 6);
      });
    }
    // Con la `m` de la escena tal cual, la pose sería otra: el test lo vería.
    expect(pose(4.275)).not.toEqual(pose(4.5));
  });

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

  it('in the epilogue, moves the whole picture with the frame of the portrait, as far as the portrait is there (ADR-042)', () => {
    const camera = new PerspectiveCamera(55, 1280 / 720, 0.1, 400);
    const { frame, tick } = mountRig(camera);
    frame.aspect = 1280 / 720;
    frame.portraitShift.x = 40;
    frame.portraitShift.y = -300;
    frame.m = 5;
    tick();
    camera.updateMatrixWorld();
    // El retrato (el origen, donde mira la cámara del epílogo) cae en el centro del marco: el de la ventana, movido.
    const ndc = new Vector3(0, 0, 0).project(camera);
    expect(((ndc.x + 1) / 2) * 1280).toBeCloseTo(640 + 40, 6);
    expect(((1 - ndc.y) / 2) * 720).toBeCloseTo(360 - 300, 6);
    // A media presencia del retrato (la `m` de la forma a 4,72, a mitad de la rampa), a medias.
    frame.m = 4 + 0.72 * EPILOGUE_ARRIVAL.morphEnd;
    tick();
    expect(camera.view?.offsetX).toBeCloseTo(-40 * portraitFollow(frame), 6);
    expect(portraitFollow(frame)).toBeGreaterThan(0);
    expect(portraitFollow(frame)).toBeLessThan(1);
    // Fuera del epílogo, la proyección de siempre.
    frame.m = 4;
    tick();
    expect(camera.view?.enabled ?? false).toBe(false);
  });

  it('touches the projection only when the shift or the canvas size change', () => {
    const camera = new PerspectiveCamera(55, 1, 0.1, 400);
    r3f.camera = camera;
    const frame = createSceneFrame();
    const { rerender } = render(<CameraRig frame={frame} />);
    const tick = (): void => {
      r3f.frames.at(-1)?.();
    };
    frame.aspect = 1;
    tick();
    const update = vi.spyOn(camera, 'updateProjectionMatrix');
    // Sin desplazamiento (antes del epílogo o sin marco), nada.
    frame.m = 5;
    tick();
    expect(update).not.toHaveBeenCalled();
    frame.portraitShift.y = 120;
    tick();
    tick();
    expect(update).toHaveBeenCalledTimes(1);
    // El lienzo cambia de tamaño (R3F vuelve a pintar el componente con el nuevo): otra vez, a su medida.
    r3f.size = { width: 900, height: 900 };
    rerender(<CameraRig frame={frame} />);
    tick();
    expect(update).toHaveBeenCalledTimes(2);
    expect(camera.view?.fullWidth).toBe(900);
  });

  it('paints nothing of its own', () => {
    r3f.camera = new PerspectiveCamera();
    const { container } = render(<CameraRig frame={createSceneFrame()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
