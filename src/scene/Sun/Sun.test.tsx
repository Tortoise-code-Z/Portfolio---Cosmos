import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EPILOGUE_ARRIVAL } from '~/lib/scroll/arrival/arrival';

import { CHAPTER_PRESENCE_FADE, SUN } from '../config/sceneConfig';
import { createSceneFrame } from '../sceneMaterials/sceneMaterials';
import { Sun, useSun } from './Sun';

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

/** El Sol con un frame de la escena ya pintada (la Tierra está): sin ella, el Sol espera. */
function renderSun() {
  const frame = createSceneFrame();
  frame.painted = true;
  const hook = renderHook(() => useSun({ frame }));
  return { ...hook, frame };
}

describe('useSun', () => {
  it('one square of two triangles, from −1 to 1, for the shader to open towards the camera', () => {
    const { result } = renderSun();
    const position = result.current.geometry.getAttribute('position');
    expect(position.count).toBe(6);
    const vertices = Array.from({ length: 6 }, (_, i): readonly [number, number] => [
      position.getX(i),
      position.getY(i),
    ]);
    for (const [x, y] of vertices) {
      expect(Math.abs(x)).toBe(1);
      expect(Math.abs(y)).toBe(1);
    }
    // Las cuatro esquinas del cuadrado, y cada triángulo de cara a la cámara (antihorario, área con signo > 0: con
    // `FrontSide`, uno al revés no se pintaría y quedaría medio Sol). Dos de área 2 cubren el cuadrado entero.
    expect(new Set(vertices.map(([x, y]) => `${String(x)},${String(y)}`)).size).toBe(4);
    const vertex = (i: number): readonly [number, number] => vertices[i] ?? [0, 0];
    for (const first of [0, 3]) {
      const [ax, ay] = vertex(first);
      const [bx, by] = vertex(first + 1);
      const [cx, cy] = vertex(first + 2);
      expect((bx - ax) * (cy - ay) - (cx - ax) * (by - ay), `triangle from ${String(first)}`).toBe(
        4,
      );
    }
  });

  it('is only painted near its chapter, with the uniforms of the shared frame in every frame', () => {
    const { result, frame } = renderSun();
    const { material } = result.current;
    frame.m = SUN.chapter - 1;
    paintFrame();
    expect(material.visible).toBe(false);
    expect(material.uniforms.uOpacity?.value).toBe(0);
    frame.m = SUN.chapter;
    frame.time = Math.PI / 2 / SUN.pulseRate;
    paintFrame();
    expect(material.visible).toBe(true);
    expect(material.uniforms.uOpacity?.value).toBe(SUN.opacity);
    expect(material.uniforms.uSize?.value).toBeCloseTo(SUN.size + SUN.pulse);
    // Al pasar al retrato se apaga otra vez.
    frame.m = SUN.chapter + 1;
    paintFrame();
    expect(material.visible).toBe(false);
  });

  it('turns on and off right at the edges of its ramp, on both sides (the turtle and the portrait)', () => {
    const { result, frame } = renderSun();
    const { material } = result.current;
    // La `m` con esa presencia del capítulo (`chapterPresence`), a cada lado. Hacia el retrato, en la llegada del
    // epílogo, la de la forma (`arrivalShapeM`, ADR-039): el Sol se va con la Tierra, antes de acabar la llegada.
    const at = (presence: number, side: -1 | 1): number => {
      const shapeM = SUN.chapter + side * ((1 - presence) / CHAPTER_PRESENCE_FADE);
      const { base, morphEnd } = EPILOGUE_ARRIVAL;
      return shapeM <= base ? shapeM : base + (shapeM - base) * morphEnd;
    };
    for (const side of [-1, 1] as const) {
      frame.m = at(0.01, side);
      paintFrame();
      expect(material.visible, `side ${String(side)}`).toBe(true);
      // Justo pasado el final de la rampa (en el final exacto, el redondeo deja ~1e-16 de presencia).
      frame.m = at(-1e-6, side);
      paintFrame();
      expect(material.visible, `side ${String(side)}`).toBe(false);
    }
  });

  it('waits for the Earth: not painted on its chapter until the particles are', () => {
    const { result, frame } = renderSun();
    const { material } = result.current;
    frame.painted = false;
    frame.m = SUN.chapter;
    paintFrame();
    expect(material.visible).toBe(false);
    frame.painted = true;
    paintFrame();
    expect(material.visible).toBe(true);
  });

  it('is painted on its chapter with reduced motion and on the low level (it only stops pulsing)', () => {
    const { result, frame } = renderSun();
    const { material } = result.current;
    frame.m = SUN.chapter;
    frame.reducedMotion = true;
    paintFrame();
    expect(material.visible).toBe(true);
    expect(material.uniforms.uOpacity?.value).toBe(SUN.opacity);
    frame.reducedMotion = false;
    frame.extras = false;
    paintFrame();
    expect(material.visible).toBe(true);
    expect(material.uniforms.uOpacity?.value).toBe(SUN.opacity);
  });

  it('frees the geometry and the material when unmounted', () => {
    const { result, unmount } = renderSun();
    const disposeGeometry = vi.spyOn(result.current.geometry, 'dispose');
    const disposeMaterial = vi.spyOn(result.current.material, 'dispose');
    unmount();
    expect(disposeGeometry).toHaveBeenCalledTimes(1);
    expect(disposeMaterial).toHaveBeenCalledTimes(1);
  });

  it('Sun mounts its square where the config puts it, never culled: the shader opens it beyond its geometry bounds', () => {
    const frame = createSceneFrame();
    // El componente, llamado como un hook: da el `<mesh>` que R3F montaría.
    const { result } = renderHook(() => Sun({ frame }));
    const element = result.current as { type: string; props: Record<string, unknown> };
    expect(element.type).toBe('mesh');
    expect(element.props.position).toBe(SUN.position);
    expect(element.props.frustumCulled).toBe(false);
    expect(element.props.geometry).toBeDefined();
    expect(element.props.material).toBeDefined();
  });
});
