import { render, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { skillGroups } from '~/content/skills';

import {
  ConstellationLabels,
  createStarLabelElements,
  type StarLabelElements,
} from '../ConstellationLabels/ConstellationLabels';
import {
  CONSTELLATION_LINKS,
  CONSTELLATION_LOOK,
  CONSTELLATION_STARS,
  STAR_LABEL_BOX,
} from '../config/constellationLayout/constellationLayout';
import { CHAPTER_PRESENCE_FADE } from '../config/sceneConfig';
import { cameraFov, cameraPose, createParallax } from '../math/camera/camera';
import { createScreenPoint, projectToScreen } from '../math/projection/projection';
import { createSceneFrame, shapeMixOf, type SceneFrame } from '../sceneMaterials/sceneMaterials';
import {
  Constellations,
  createConstellationWork,
  runConstellationsFrame,
  SKILLS,
  useConstellations,
  type ConstellationsProps,
} from './Constellations';

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
});

/** Los textos de las etiquetas en un idioma, por id y en el orden del panel. */
function textsIn(locale: 'en' | 'es'): Readonly<Record<string, string>> {
  return Object.fromEntries(
    skillGroups.flatMap((group) =>
      group.skills.map((skill) => [
        skill.id,
        typeof skill.label === 'string' ? skill.label : skill.label[locale],
      ]),
    ),
  );
}

const TEXTS = textsIn('en');
const TEXTS_ES = textsIn('es');

/**
 * Las etiquetas que caben a 390×844 en reposo, en el orden del panel: con el campo de visión de móvil, su letra
 * (10 px) y lo que tapa la interfaz por debajo de 900 px. Escritas a mano a propósito: si cambian la colocación, la
 * letra o la interfaz, el test obliga a mirar qué se ve en el móvil. En español, `ai-pair` («Programación en pareja
 * con IA») choca con `nestjs`, que va antes en el panel, y se oculta.
 */
const PHONE_LABELS = [
  'html',
  'javascript',
  'glsl',
  'mysql',
  'zod',
  'tailwind',
  'nestjs',
  'vite',
  'playwright',
  'n8n',
  'vms',
  'ai-pair',
  'claude',
];
const PHONE_LABELS_ES = PHONE_LABELS.filter((id) => id !== 'ai-pair');

/** El frame de la galaxia en móvil (390×844), con su campo de visión y su pose. */
function phoneFrame(): SceneFrame {
  const frame = galaxyFrame(2, false);
  frame.aspect = 390 / 844;
  frame.fov = cameraFov(frame.aspect);
  cameraPose(2, false, createParallax(), frame.camera);
  return frame;
}

/** Las etiquetas con `visibility: visible`, en el orden del panel. */
function shownLabels(labels: StarLabelElements): string[] {
  return Object.keys(TEXTS).filter((id) => labels.get(id)?.style.visibility === 'visible');
}

/** El frame de la galaxia en escritorio, con las partículas ya pintadas y la pose que dejaría la cámara. */
function galaxyFrame(m = 2, wide = true): SceneFrame {
  const frame = createSceneFrame();
  frame.painted = true;
  frame.m = m;
  shapeMixOf(frame, frame.shapes);
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
  it('each label is measured with its own width (its place in SKILLS), not by its position in the work list', () => {
    const { result, labels } = setup(galaxyFrame());
    // Las mallas al revés: el orden de las etiquetas de la visita cambia, el ancho de cada una no.
    const work = createConstellationWork(galaxyFrame(), labels, [...result.current].reverse());
    expect(work.labels.map(({ id }) => id)).not.toEqual(SKILLS.map(({ id }) => id));
    for (const slot of work.labels) expect(SKILLS[slot.index]?.id).toBe(slot.id);
  });

  it('one constellation per group: its stars and, per line, the two stars it joins', () => {
    const { result } = setup(galaxyFrame());
    expect(result.current.map(({ group }) => group)).toEqual(skillGroups.map(({ id }) => id));
    const at = (id: string): readonly number[] => CONSTELLATION_STARS[id] ?? [];
    for (const [index, group] of skillGroups.entries()) {
      const mesh = result.current[index];
      expect(Array.from(mesh?.stars.geometry.getAttribute('position').array ?? [])).toEqual(
        group.skills.flatMap(({ id }) => at(id)).map(Math.fround),
      );
      expect(Array.from(mesh?.lines.geometry.getAttribute('position').array ?? [])).toEqual(
        CONSTELLATION_LINKS[group.id].flatMap(([a, b]) => [...at(a), ...at(b)]).map(Math.fround),
      );
    }
  });

  it('gives the stars the pixel ratio of the frame (their size stays the same on screen)', () => {
    const frame = galaxyFrame();
    frame.pixelRatio = 2;
    const { result } = setup(frame);
    paint();
    for (const mesh of result.current) expect(mesh.starUniforms.uPR.value).toBe(2);
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

  it('the lit group grows and brightens smoothly, and only that one; at once with reduced motion', () => {
    const frame = galaxyFrame();
    const { result } = setup(frame);
    frame.skillGroup = 'tools';
    paint();
    const tools = result.current[skillGroups.findIndex(({ id }) => id === 'tools')];
    expect(tools?.lineUniforms.uOpacity.value).toBeGreaterThan(0.22);
    expect(tools?.lineUniforms.uOpacity.value).toBeLessThan(0.9);
    for (const mesh of result.current) {
      if (mesh.group === 'tools') continue;
      expect(mesh.lineUniforms.uOpacity.value, mesh.group).toBeCloseTo(0.22, 10);
      expect(mesh.starUniforms.uSize.value, mesh.group).toBe(CONSTELLATION_LOOK.starPx);
    }
    frame.reducedMotion = true;
    paint();
    expect(tools?.lineUniforms.uOpacity.value).toBeCloseTo(0.9, 10);
    expect(tools?.starUniforms.uSize.value).toBeCloseTo(CONSTELLATION_LOOK.starPx * 1.55, 10);
  });

  it('far from the galaxy, nothing shows and nothing is drawn', () => {
    const { result, labels } = setup(galaxyFrame(0.5));
    paint();
    for (const mesh of result.current) {
      expect(mesh.starUniforms.uOpacity.value).toBe(0);
      expect(mesh.stars.material.visible, mesh.group).toBe(false);
      expect(mesh.lines.material.visible, mesh.group).toBe(false);
    }
    expect(label(labels, 'html').style.visibility).toBe('');
  });

  it('at the galaxy, the stars and lines are drawn', () => {
    const { result } = setup(galaxyFrame());
    paint();
    for (const mesh of result.current) {
      expect(mesh.stars.material.visible, mesh.group).toBe(true);
      expect(mesh.lines.material.visible, mesh.group).toBe(true);
    }
  });

  it('waits for the particles: at the galaxy, nothing shows nor takes the mouse before they are painted', () => {
    const frame = galaxyFrame();
    frame.painted = false;
    const { result, labels } = setup(frame);
    paint();
    for (const mesh of result.current) {
      expect(mesh.starUniforms.uOpacity.value, mesh.group).toBe(0);
      expect(mesh.lineUniforms.uOpacity.value, mesh.group).toBe(0);
    }
    expect(shownLabels(labels)).toEqual([]);
    for (const id of Object.keys(TEXTS))
      expect(label(labels, id), id).not.toHaveAttribute('data-live');
    frame.painted = true;
    paint();
    expect(shownLabels(labels)).toHaveLength(Object.keys(TEXTS).length);
  });

  it('places every label right of its star at 1280×720, centred on it, visible, at the resting opacity', () => {
    const frame = galaxyFrame();
    const { labels } = setup(frame);
    paint();
    const viewport = { width: 1280, height: 720, fov: frame.fov };
    for (const id of Object.keys(TEXTS)) {
      const element = label(labels, id);
      const star = projectToScreen(
        CONSTELLATION_STARS[id] ?? [0, 0, 0],
        frame.camera,
        viewport,
        createScreenPoint(),
      );
      const x = Math.round(star.x + STAR_LABEL_BOX.offsetPx);
      const y = Math.round(star.y - STAR_LABEL_BOX.heightPx / 2);
      expect(element.style.visibility, id).toBe('visible');
      expect(element.style.transform, id).toBe(`translate(${String(x)}px, ${String(y)}px)`);
      expect(element.style.opacity, id).toBe(String(CONSTELLATION_LOOK.labelOpacity.rest));
      expect(element).not.toHaveAttribute('data-hot');
    }
  });

  it('each label takes the opacity of its own group', () => {
    const frame = galaxyFrame();
    frame.reducedMotion = true;
    const { labels } = setup(frame);
    frame.skillGroup = 'ai';
    paint();
    expect(Number(label(labels, 'claude').style.opacity)).toBeGreaterThan(
      CONSTELLATION_LOOK.labelOpacity.rest,
    );
    expect(label(labels, 'git').style.opacity).toBe(String(CONSTELLATION_LOOK.labelOpacity.rest));
  });

  it('back from a project page, the labels born again are written whole (they start hidden by their CSS)', () => {
    const frame = galaxyFrame();
    const { labels, layer, rerender } = setup(frame);
    paint();
    expect(label(labels, 'html').style.visibility).toBe('visible');
    // En una ficha la capa se desmonta (sin textos) y la escena sigue pintando con el capítulo presente.
    layer.rerender(<ConstellationLabels texts={null} elements={labels} />);
    rerender({ frame, texts: null, labels });
    paint();
    expect(labels.size).toBe(0);
    // Atrás: vuelven, nuevas.
    layer.rerender(<ConstellationLabels texts={TEXTS} elements={labels} />);
    rerender({ frame, texts: TEXTS, labels });
    paint();
    const html = label(labels, 'html');
    expect(html.style.visibility).toBe('visible');
    expect(html.style.opacity).toBe(String(CONSTELLATION_LOOK.labelOpacity.rest));
    expect(html.style.transform).toMatch(/^translate\(\d+px, \d+px\)$/);
    expect(html).toHaveAttribute('data-live');
  });

  it('labels born again with no frame in between (the scene paused all along) are written whole', () => {
    const frame = galaxyFrame();
    const { labels, layer } = setup(frame);
    paint();
    expect(label(labels, 'html').style.visibility).toBe('visible');
    // Misión rápida abierta a la ida y a la vuelta: la escena no pinta mientras la capa no está.
    layer.rerender(<ConstellationLabels texts={null} elements={labels} />);
    layer.rerender(<ConstellationLabels texts={TEXTS} elements={labels} />);
    paint();
    for (const id of Object.keys(TEXTS)) {
      const element = label(labels, id);
      expect(element.style.visibility, id).toBe('visible');
      expect(element.style.opacity, id).toBe(String(CONSTELLATION_LOOK.labelOpacity.rest));
      // Con la misma pose, la posición no cambia entre los dos frames: solo se escribe si se olvidó lo escrito.
      expect(element.style.transform, id).toMatch(/^translate\(-?\d+px, -?\d+px\)$/);
      expect(element, id).toHaveAttribute('data-live');
    }
  });

  it('labels born again with no frame in between keep the amber of the lit group', () => {
    const frame = galaxyFrame();
    const { labels, layer } = setup(frame);
    frame.skillGroup = 'ai';
    paint();
    expect(label(labels, 'claude')).toHaveAttribute('data-hot');
    layer.rerender(<ConstellationLabels texts={null} elements={labels} />);
    layer.rerender(<ConstellationLabels texts={TEXTS} elements={labels} />);
    paint();
    for (const group of skillGroups) {
      for (const { id } of group.skills) {
        expect(label(labels, id).hasAttribute('data-hot'), id).toBe(group.id === 'ai');
      }
    }
  });

  it('the visible labels take the mouse (data-live) only with the chapter past interactiveFrom', () => {
    const frame = galaxyFrame();
    const { labels } = setup(frame);
    const all = Object.keys(TEXTS);
    // La `m` con esa presencia del capítulo 2 (la cámara se queda en la pose de m = 2).
    const at = (presence: number): number => 2 + (1 - presence) / CHAPTER_PRESENCE_FADE;
    frame.m = at(CONSTELLATION_LOOK.interactiveFrom - 0.05);
    shapeMixOf(frame, frame.shapes);
    paint();
    expect(shownLabels(labels)).toHaveLength(all.length);
    for (const id of all) expect(label(labels, id), id).not.toHaveAttribute('data-live');
    frame.m = at(CONSTELLATION_LOOK.interactiveFrom + 0.05);
    shapeMixOf(frame, frame.shapes);
    paint();
    for (const id of all) expect(label(labels, id), id).toHaveAttribute('data-live');
    const write = vi.spyOn(label(labels, 'html'), 'toggleAttribute');
    paint();
    expect(write).not.toHaveBeenCalled();
    frame.m = 3;
    shapeMixOf(frame, frame.shapes);
    paint();
    for (const id of all) expect(label(labels, id), id).not.toHaveAttribute('data-live');
  });

  it('a label with no measured width (no text yet) still stands right of its star, as narrow as nothing', () => {
    const frame = galaxyFrame();
    const { result, labels } = setup(frame);
    const work = createConstellationWork(frame, labels, result.current);
    runConstellationsFrame(
      work,
      frame,
      labels,
      { width: 1280, height: 720 },
      { wide: [], narrow: [] },
    );
    const html = label(labels, 'html');
    expect(html.style.visibility).toBe('visible');
    const point = createScreenPoint();
    projectToScreen(
      CONSTELLATION_STARS.html ?? [0, 0, 0],
      frame.camera,
      { width: 1280, height: 720, fov: frame.fov },
      point,
    );
    expect(html.style.transform).toBe(
      `translate(${String(Math.round(point.x + STAR_LABEL_BOX.offsetPx))}px, ${String(Math.round(point.y - STAR_LABEL_BOX.heightPx / 2))}px)`,
    );
  });

  it('a canvas without a size places nothing (never a NaN position)', () => {
    const { labels } = setup(galaxyFrame());
    paint(0, 0);
    for (const id of Object.keys(TEXTS)) {
      expect(label(labels, id).style.visibility, id).not.toBe('visible');
      expect(label(labels, id).style.transform, id).not.toContain('NaN');
    }
  });

  it('marks the labels of the lit group (data-hot) and only those', () => {
    const frame = galaxyFrame();
    const { labels } = setup(frame);
    frame.skillGroup = 'ai';
    paint();
    expect(label(labels, 'claude')).toHaveAttribute('data-hot');
    expect(label(labels, 'git')).not.toHaveAttribute('data-hot');
    frame.skillGroup = null;
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

  it('on a phone, only the labels that fit show, first come in the order of the panel; the chapter leaving hides them all', () => {
    const frame = phoneFrame();
    const { labels } = setup(frame);
    paint(390, 844);
    expect(shownLabels(labels)).toEqual(PHONE_LABELS);
    // Las que no caben, ocultas, tampoco reciben el ratón.
    for (const id of Object.keys(TEXTS)) {
      expect(label(labels, id).hasAttribute('data-live'), id).toBe(
        shownLabels(labels).includes(id),
      );
    }
    frame.m = 3;
    shapeMixOf(frame, frame.shapes);
    paint(390, 844);
    expect(shownLabels(labels)).toEqual([]);
  });

  it('going from desktop to a phone recomputes what the interface covers', () => {
    const frame = galaxyFrame();
    const { labels } = setup(frame);
    paint(1280, 720);
    expect(shownLabels(labels)).toHaveLength(Object.keys(TEXTS).length);
    const phone = phoneFrame();
    frame.wide = false;
    frame.aspect = phone.aspect;
    frame.fov = phone.fov;
    cameraPose(2, false, createParallax(), frame.camera);
    paint(390, 844);
    expect(shownLabels(labels)).toEqual(PHONE_LABELS);
  });

  it('on a phone in Spanish, a longer label that collides with an earlier one hides', () => {
    const { labels } = setup(phoneFrame(), TEXTS_ES);
    paint(390, 844);
    expect(shownLabels(labels)).toEqual(PHONE_LABELS_ES);
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
