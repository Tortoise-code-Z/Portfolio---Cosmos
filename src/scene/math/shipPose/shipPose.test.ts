import { describe, expect, it } from 'vitest';

import { SHIP_ARRIVAL } from '~/lib/scroll/shapeTrack/shapeTrack';

import { CAMERA_KEYFRAMES, SHIP_FRAME } from '../../config/sceneConfig';
import { cameraFov, cameraPose, createCameraPose, createParallax } from '../camera/camera';
import { createScreenPoint, projectToScreen } from '../projection/projection';
import { createShipPose, createShipScreen, shipPose, shipScreen, type ShipView } from './shipPose';

const VIEWS = {
  desktop: { width: 1440, height: 900, bar: 64 },
  mobile: { width: 390, height: 844, bar: 64 },
  landscape: { width: 844, height: 390, bar: 64 },
} as const;

type ViewName = keyof typeof VIEWS;

function view(name: ViewName): ShipView & { width: number; height: number } {
  const { width, height, bar } = VIEWS[name];
  const aspect = width / height;
  return { width, height, aspect, fov: cameraFov(aspect), barTop: bar / height };
}

/** La cámara de la nebulosa (el Mission log): en escritorio, apartada a un lado. */
function nebulaCamera(wide: boolean): ReturnType<typeof createCameraPose> {
  return cameraPose(1, wide, createParallax(), createCameraPose());
}

/** Un punto de la nave (en sus unidades) en la escena, como el shader (sin el balanceo): `P = pos + ejes · (p · s)`. */
function toScene(
  pose: ReturnType<typeof createShipPose>,
  p: readonly [number, number, number],
): [number, number, number] {
  const [x, y, z] = p.map((value) => value * pose.scale) as [number, number, number];
  const a = pose.axes;
  return [
    pose.position.x + (a[0] ?? 0) * x + (a[3] ?? 0) * y + (a[6] ?? 0) * z,
    pose.position.y + (a[1] ?? 0) * x + (a[4] ?? 0) * y + (a[7] ?? 0) * z,
    pose.position.z + (a[2] ?? 0) * x + (a[5] ?? 0) * y + (a[8] ?? 0) * z,
  ];
}

/** La pantalla de la nave, proyectada: su rectángulo en píxeles. */
function projectedScreen(
  name: ViewName,
  q: number,
): { left: number; right: number; top: number; bottom: number } {
  const v = view(name);
  const camera = nebulaCamera(name === 'desktop');
  const pose = shipPose(q, camera, v, createShipPose());
  const hx = pose.screen.x / 2;
  const hy = pose.screen.y / 2;
  const viewport = { width: v.width, height: v.height, fov: v.fov };
  const corner = (sx: number, sy: number): { x: number; y: number } => {
    // La pantalla no se gira en vertical (lo que se cambia de lado son las piezas de alrededor): sus esquinas, tal cual.
    const point = projectToScreen(
      toScene(pose, [sx * hx, sy * hy, 0]),
      camera,
      viewport,
      createScreenPoint(),
    );
    return { x: point.x, y: point.y };
  };
  const a = corner(-1, 1);
  const b = corner(1, -1);
  return {
    left: Math.min(a.x, b.x),
    right: Math.max(a.x, b.x),
    top: Math.min(a.y, b.y),
    bottom: Math.max(a.y, b.y),
  };
}

describe('shipScreen', () => {
  it('en horizontal, el 86 % del ancho y hasta el 70 % de lo que se ve (no más de 0,62 del ancho)', () => {
    const screen = shipScreen(1.6, 0.1, createShipScreen());
    expect(screen.vertical).toBe(false);
    expect(screen.width).toBeCloseTo(SHIP_FRAME.landscape.width * 1.6);
    expect(screen.height).toBeCloseTo(SHIP_FRAME.landscape.height * 0.9);
    // Muy ancha y baja: manda el 0,62 del ancho.
    const wide = shipScreen(1.05, 0, createShipScreen());
    expect(wide.height).toBeCloseTo(wide.width * SHIP_FRAME.landscape.maxRatio);
  });

  it('en vertical, el 90 % del ancho y el 64 % de lo que se ve', () => {
    const screen = shipScreen(0.5, 0.08, createShipScreen());
    expect(screen.vertical).toBe(true);
    expect(screen.width).toBeCloseTo(0.45);
    expect(screen.height).toBeCloseTo(SHIP_FRAME.portrait.height * 0.92);
  });
});

describe('shipPose', () => {
  it('nace en el centro de la forma de antes (el origen), pequeña y girada', () => {
    const pose = shipPose(0, nebulaCamera(true), view('desktop'), createShipPose());
    expect(pose.position).toEqual({ x: 0, y: 0, z: 0 });
    expect(pose.scale).toBe(SHIP_FRAME.birthScale);
    expect(pose.yaw).toBe(SHIP_FRAME.turn.yaw);
    expect(pose.pitch).toBe(SHIP_FRAME.turn.pitch);
    // Mientras se forma, no se mueve.
    const forming = shipPose(
      SHIP_ARRIVAL.formed,
      nebulaCamera(true),
      view('desktop'),
      createShipPose(),
    );
    expect(forming.position).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('mira de frente a la cámara: sus ejes son los de la cámara (derecha, arriba, hacia ella)', () => {
    const camera = nebulaCamera(true);
    const { axes } = shipPose(1, camera, view('desktop'), createShipPose());
    const f = [
      camera.target.x - camera.position.x,
      camera.target.y - camera.position.y,
      camera.target.z - camera.position.z,
    ];
    const length = Math.hypot(...f);
    expect(axes[6]).toBeCloseTo(-(f[0] ?? 0) / length);
    expect(axes[7]).toBeCloseTo(-(f[1] ?? 0) / length);
    expect(axes[8]).toBeCloseTo(-(f[2] ?? 0) / length);
    // Una base ortonormal.
    const column = (i: number): number[] => axes.slice(i * 3, i * 3 + 3);
    const dot = (a: number[], b: number[]): number =>
      a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0);
    for (const i of [0, 1, 2]) expect(dot(column(i), column(i))).toBeCloseTo(1);
    expect(dot(column(0), column(1))).toBeCloseTo(0);
    expect(dot(column(0), column(2))).toBeCloseTo(0);
    expect(dot(column(1), column(2))).toBeCloseTo(0);
  });

  it.each(['desktop', 'mobile', 'landscape'] as const)(
    '%s: de frente (en `near`), la pantalla encaja con lo que se ve bajo la barra, centrada',
    (name) => {
      const v = view(name);
      const bar = VIEWS[name].bar;
      const rect = projectedScreen(name, SHIP_ARRIVAL.near);
      const screen = shipScreen(v.aspect, v.barTop, createShipScreen());
      expect(rect.right - rect.left).toBeCloseTo(screen.width * v.height, 0);
      expect(rect.bottom - rect.top).toBeCloseTo(screen.height * v.height, 0);
      expect((rect.left + rect.right) / 2).toBeCloseTo(v.width / 2, 0);
      expect((rect.top + rect.bottom) / 2).toBeCloseTo(bar + (v.height - bar) / 2, 0);
    },
  );

  it.each(['desktop', 'mobile', 'landscape'] as const)(
    '%s: al acabar la llegada la pantalla llena la vista entera, también lo que tapa la barra',
    (name) => {
      const v = view(name);
      const rect = projectedScreen(name, 1);
      expect(rect.left).toBeLessThan(0);
      expect(rect.right).toBeGreaterThan(v.width);
      expect(rect.top).toBeLessThan(0);
      expect(rect.bottom).toBeGreaterThan(v.height);
    },
  );

  it('se acerca sin volver atrás en la llegada, y se aleja en la salida', () => {
    const camera = nebulaCamera(true);
    const distance = (q: number): number => {
      const { position } = shipPose(q, camera, view('desktop'), createShipPose());
      return Math.hypot(
        position.x - camera.position.x,
        position.y - camera.position.y,
        position.z - camera.position.z,
      );
    };
    let last = Number.POSITIVE_INFINITY;
    for (let step = 0; step <= 20; step += 1) {
      const d = distance(SHIP_ARRIVAL.formed + ((1 - SHIP_ARRIVAL.formed) * step) / 20);
      expect(d).toBeLessThanOrEqual(last + 1e-9);
      last = d;
    }
    expect(distance(2)).toBeCloseTo(distance(SHIP_ARRIVAL.near) * SHIP_FRAME.far);
  });

  it('de frente y a su tamaño desde `near`; quieta en la pantalla (q = 1)', () => {
    const pose = shipPose(SHIP_ARRIVAL.near, nebulaCamera(false), view('mobile'), createShipPose());
    expect(pose.scale).toBe(1);
    expect(pose.yaw).toBe(0);
    expect(pose.pitch).toBe(0);
    expect(pose.vertical).toBe(true);
    expect(pose.screen.y).toBe(SHIP_FRAME.screenHeight);
  });

  it('la bandera de Irlanda sale de la vista a los dos lados, también lejos', () => {
    for (const q of [SHIP_ARRIVAL.formed, SHIP_ARRIVAL.near, 1.5, 2]) {
      const v = view('desktop');
      const pose = shipPose(q, nebulaCamera(true), v, createShipPose());
      const half = pose.screen.y / 2;
      // A la profundidad de la bandera, la mitad de lo que se ve, en unidades de la nave.
      expect(pose.flagSpan).toBeGreaterThan(half * SHIP_FRAME.flag.margin);
    }
  });

  it('escribe en el objeto que recibe y lo devuelve (sin objetos nuevos por frame)', () => {
    const out = createShipPose();
    const { position, axes, screen } = out;
    expect(shipPose(0.5, nebulaCamera(true), view('desktop'), out)).toBe(out);
    expect(out.position).toBe(position);
    expect(out.axes).toBe(axes);
    expect(out.screen).toBe(screen);
  });

  it('la cámara de la nebulosa no se mueve con las naves: es la del capítulo 1', () => {
    expect(nebulaCamera(false).position).toEqual({
      x: CAMERA_KEYFRAMES[1].position[0],
      y: CAMERA_KEYFRAMES[1].position[1],
      z: CAMERA_KEYFRAMES[1].position[2],
    });
  });
});
