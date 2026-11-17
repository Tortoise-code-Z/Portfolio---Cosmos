import { act, render, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { skillGroups } from '~/content/skills';
import { setActiveSkillGroup, useUiStore } from '~/stores/uiStore/uiStore';

import {
  ConstellationLabels,
  createStarLabelElements,
  type StarLabelElements,
} from '../ConstellationLabels/ConstellationLabels';
import {
  CONSTELLATION_LINKS,
  CONSTELLATION_LOOK,
} from '../config/constellationLayout/constellationLayout';
import { cameraFov, cameraPose, createParallax } from '../math/camera/camera';
import { createSceneFrame, type SceneFrame } from '../sceneMaterials/sceneMaterials';
import { Constellations, useConstellations, type ConstellationsProps } from './Constellations';

/** `useFrame` necesita el lienzo de R3F: aquí se guarda el callback y se le da el tamaño del lienzo a mano. */
const frameCallbacks = vi.hoisted(
  (): ((state: { size: { width: number; height: number } }) => void)[] => [],
);
vi.mock('@react-three/fiber', () => ({
  useFrame: (callback: (state: { size: { width: number; height: number } }) => void) => {
    frameCallbacks.push(callback);
  },
}));

function paint(width = 1280, height = 720): void {
  frameCallbacks.at(-1)?.({ size: { width, height } });
}

afterEach(() => {
  frameCallbacks.length = 0;
  useUiStore.setState(useUiStore.getInitialState(), true);
});

const TEXTS: Readonly<Record<string, string>> = Object.fromEntries(
  skillGroups.flatMap((group) =>
    group.skills.map((skill) => [
      skill.id,
      typeof skill.label === 'string' ? skill.label : skill.label.en,
    ]),
  ),
);

/** El frame de la galaxia en escritorio, con la pose que dejaría la cámara. */
function galaxyFrame(m = 2, wide = true): SceneFrame {
  const frame = createSceneFrame();
  frame.m = m;
  frame.wide = wide;
  frame.delta = 0.05;
  frame.aspect = 1280 / 720;
  frame.fov = cameraFov(frame.aspect);
  cameraPose(m, wide, createParallax(), frame.camera);
  return frame;
}

/** Monta las etiquetas (como `SceneRoot`) y el hook de las constelaciones. */
function setup(frame: SceneFrame, texts: Readonly<Record<string, string>> | null = TEXTS) {
  const labels = createStarLabelElements();
  const layer = render(<ConstellationLabels texts={texts} elements={labels} />);
  const hook = renderHook((props: ConstellationsProps) => useConstellations(props), {
    initialProps: { frame, texts, labels },
  });
  return { ...hook, labels, layer };
}

const label = (labels: StarLabelElements, id: string): HTMLElement => {
  const element = labels.get(id);
  if (element === undefined) throw new Error(`No label ${id}`);
  return element;
};

describe('useConstellations', () => {
  it('one constellation per group: its stars and two points per line', () => {
    const { result } = setup(galaxyFrame());
    expect(result.current.map(({ group }) => group)).toEqual(skillGroups.map(({ id }) => id));
    for (const [index, group] of skillGroups.entries()) {
      const mesh = result.current[index];
      expect(mesh?.stars.geometry.getAttribute('position').count).toBe(group.skills.length);
      expect(mesh?.lines.geometry.getAttribute('position').count).toBe(
        CONSTELLATION_LINKS[group.id].length * 2,
      );
    }
  });

  it('at the galaxy, at rest: the stars and lines of every group at their resting look', () => {
    const { result } = setup(galaxyFrame());
    paint();
    for (const mesh of result.current) {
      expect(mesh.starUniforms.uSize.value).toBe(CONSTELLATION_LOOK.starPx);
      expect(mesh.starUniforms.uOpacity.value).toBeCloseTo(0.65, 10);
      expect(mesh.lineUniforms.uOpacity.value).toBeCloseTo(0.22, 10);
    }
  });

  it('the lit group grows and brightens smoothly; at once with reduced motion', () => {
    const frame = galaxyFrame();
    const { result } = setup(frame);
    act(() => {
      setActiveSkillGroup('tools');
    });
    paint();
    const tools = result.current[skillGroups.findIndex(({ id }) => id === 'tools')];
    const web = result.current[0];
    expect(tools?.lineUniforms.uOpacity.value).toBeGreaterThan(0.22);
    expect(tools?.lineUniforms.uOpacity.value).toBeLessThan(0.9);
    expect(web?.lineUniforms.uOpacity.value).toBeCloseTo(0.22, 10);
    frame.reducedMotion = true;
    paint();
    expect(tools?.lineUniforms.uOpacity.value).toBeCloseTo(0.9, 10);
    expect(tools?.starUniforms.uSize.value).toBeCloseTo(CONSTELLATION_LOOK.starPx * 1.55, 10);
  });

  it('far from the galaxy, nothing shows', () => {
    const { result, labels } = setup(galaxyFrame(0.5));
    paint();
    for (const mesh of result.current) expect(mesh.starUniforms.uOpacity.value).toBe(0);
    expect(label(labels, 'html').style.visibility).toBe('');
  });

  it('places every label right of its star at 1280×720, visible, at the resting opacity', () => {
    const { labels } = setup(galaxyFrame());
    paint();
    for (const id of Object.keys(TEXTS)) {
      const element = label(labels, id);
      expect(element.style.visibility, id).toBe('visible');
      expect(element.style.transform, id).toMatch(/^translate\(\d+px, \d+px\)$/);
      expect(element.style.opacity, id).toBe('0.6');
      expect(element).not.toHaveAttribute('data-hot');
    }
  });

  it('marks the labels of the lit group (data-hot) and only those', () => {
    const { labels } = setup(galaxyFrame());
    act(() => {
      setActiveSkillGroup('ai');
    });
    paint();
    expect(label(labels, 'claude')).toHaveAttribute('data-hot');
    expect(label(labels, 'git')).not.toHaveAttribute('data-hot');
    act(() => {
      setActiveSkillGroup(null);
    });
    paint();
    expect(label(labels, 'claude')).not.toHaveAttribute('data-hot');
  });

  it('writes a label only when something changed', () => {
    const { labels } = setup(galaxyFrame());
    paint();
    const element = label(labels, 'html');
    const write = vi.spyOn(element.style, 'transform', 'set');
    paint();
    expect(write).not.toHaveBeenCalled();
  });

  it('on a phone, the labels that do not fit are hidden, and the chapter leaving hides them all', () => {
    const frame = galaxyFrame(2, false);
    frame.aspect = 390 / 844;
    frame.fov = cameraFov(frame.aspect);
    cameraPose(2, false, createParallax(), frame.camera);
    const { labels } = setup(frame);
    paint(390, 844);
    // Una etiqueta que nunca se ha visto sigue oculta por su CSS (sin `visibility` escrita).
    const shown = (): string[] =>
      Object.keys(TEXTS).filter((id) => label(labels, id).style.visibility === 'visible');
    expect(shown().length).toBeGreaterThan(0);
    expect(shown().length).toBeLessThan(Object.keys(TEXTS).length);
    frame.m = 3;
    paint(390, 844);
    expect(shown()).toEqual([]);
  });

  it('without texts (outside the journey) there are no labels to place, but the stars still shine', () => {
    const { result } = setup(galaxyFrame(), null);
    paint();
    expect(result.current[0]?.starUniforms.uOpacity.value).toBeCloseTo(0.65, 10);
  });

  it('frees the GPU memory when unmounted', () => {
    const { result, unmount } = setup(galaxyFrame());
    const disposed = result.current.flatMap(({ stars, lines }) => [
      vi.spyOn(stars.geometry, 'dispose'),
      vi.spyOn(stars.material, 'dispose'),
      vi.spyOn(lines.geometry, 'dispose'),
      vi.spyOn(lines.material, 'dispose'),
    ]);
    unmount();
    for (const dispose of disposed) expect(dispose).toHaveBeenCalledTimes(1);
  });
});

describe('Constellations', () => {
  it('mounts the lines and the stars of every group', () => {
    const labels = createStarLabelElements();
    const { container } = render(
      <Constellations frame={galaxyFrame()} texts={TEXTS} labels={labels} />,
    );
    expect(container.querySelectorAll('points')).toHaveLength(skillGroups.length);
    expect(container.querySelectorAll('linesegments')).toHaveLength(skillGroups.length);
  });
});
