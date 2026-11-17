import { useFrame, type RootState } from '@react-three/fiber';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BufferAttribute, BufferGeometry, type ShaderMaterial } from 'three';

import { skillGroups } from '~/content/skills';
import type { SkillGroupId } from '~/content/types';
import { useUiStore } from '~/stores/uiStore/uiStore';

import type { StarLabelElements } from '../ConstellationLabels/ConstellationLabels';
import {
  CONSTELLATION_LINKS,
  CONSTELLATION_STARS,
  STAR_LABEL_BOX,
  starLabelWidth,
} from '../config/constellationLayout/constellationLayout';
import type { ScenePoint } from '../config/sceneConfig';
import {
  chapterPresence,
  constellationLook,
  createConstellationLook,
  followHot,
  type ConstellationLook,
} from '../math/constellations/constellations';
import {
  createLabelBox,
  fitLabels,
  keepOutZones,
  type LabelBox,
  type Rect,
} from '../math/labelFit/labelFit';
import {
  createScreenPoint,
  projectToScreen,
  type ScreenPoint,
} from '../math/projection/projection';
import {
  createConstellationLinesMaterial,
  createConstellationStarsMaterial,
  createConstellationUniforms,
  type ConstellationUniforms,
  type SceneFrame,
} from '../sceneMaterials/sceneMaterials';

export interface ConstellationsProps {
  /** El frame que rellena el bucle (`SceneRoot`), con la pose de la cámara que deja `CameraRig`. */
  readonly frame: Readonly<SceneFrame>;
  /** El texto de cada etiqueta (para medir su caja); `null` sin etiquetas. */
  readonly texts: Readonly<Record<string, string>> | null;
  /** Las etiquetas montadas (`ConstellationLabels`), que se colocan aquí en cada frame. */
  readonly labels: StarLabelElements;
}

/** Lo que monta una constelación: sus estrellas y sus líneas, cada una con sus uniforms. */
export interface ConstellationMeshes {
  readonly group: SkillGroupId;
  readonly stars: { readonly geometry: BufferGeometry; readonly material: ShaderMaterial };
  readonly lines: { readonly geometry: BufferGeometry; readonly material: ShaderMaterial };
  readonly starUniforms: ConstellationUniforms;
  readonly lineUniforms: ConstellationUniforms;
}

function star(id: string): ScenePoint {
  const position = CONSTELLATION_STARS[id];
  if (position === undefined) throw new Error(`[scene] No constellation position for ${id}`);
  return position;
}

function geometryOf(points: readonly ScenePoint[]): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(points.flat()), 3));
  return geometry;
}

function createMeshes(): ConstellationMeshes[] {
  return skillGroups.map((group) => {
    const starUniforms = createConstellationUniforms(false);
    const lineUniforms = createConstellationUniforms(true);
    return {
      group: group.id,
      stars: {
        geometry: geometryOf(group.skills.map(({ id }) => star(id))),
        material: createConstellationStarsMaterial(starUniforms),
      },
      lines: {
        geometry: geometryOf(CONSTELLATION_LINKS[group.id].flatMap(([a, b]) => [star(a), star(b)])),
        material: createConstellationLinesMaterial(lineUniforms),
      },
      starUniforms,
      lineUniforms,
    };
  });
}

/** Cada etiqueta, en el orden del panel: su id, su grupo (índice) y su estrella. */
export const SKILLS = skillGroups.flatMap((group, index) =>
  group.skills.map((skill) => ({ id: skill.id, group: index, position: star(skill.id) })),
);

/** El ancho de cada etiqueta, en el orden de `SKILLS`, con la letra de escritorio y con la de móvil. */
export interface LabelWidths {
  readonly wide: readonly number[];
  readonly narrow: readonly number[];
}

export function labelWidths(texts: Readonly<Record<string, string>> | null): LabelWidths {
  return {
    wide: SKILLS.map(({ id }) => starLabelWidth(texts?.[id] ?? '', STAR_LABEL_BOX.fontPx)),
    narrow: SKILLS.map(({ id }) => starLabelWidth(texts?.[id] ?? '', STAR_LABEL_BOX.narrowFontPx)),
  };
}

/** Una etiqueta durante la visita: su skill, su caja en este frame y lo último escrito (solo se reescribe lo que cambia). */
interface LabelSlot {
  readonly id: string;
  /** El índice de su grupo en `meshes`. */
  readonly group: number;
  readonly position: ScenePoint;
  readonly box: LabelBox;
  readonly written: { x: number; y: number; opacity: number; visible: boolean; hot: boolean };
}

/** Un grupo durante la visita: cuánto está encendido y la opacidad de sus etiquetas en este frame. */
interface GroupSlot {
  hot: number;
  labelOpacity: number;
}

/** Lo que dura toda la visita (cero objetos nuevos por frame, ADR-004). */
export interface ConstellationWork {
  readonly groups: readonly GroupSlot[];
  readonly labels: readonly LabelSlot[];
  /** Las cajas, en el orden del panel (las mismas de `labels`), para `fitLabels`. */
  readonly boxes: readonly LabelBox[];
  readonly look: ConstellationLook;
  readonly point: ScreenPoint;
  readonly viewport: { width: number; height: number; fov: number };
  /** Lo que tapa la interfaz, para el tamaño y el encuadre con que se calculó. */
  zones: readonly Rect[];
  zonesFor: string;
  /** Alguna etiqueta podía verse en el frame anterior (hay que ocultarlas al irse el capítulo). */
  shown: boolean;
}

export function createConstellationWork(): ConstellationWork {
  const labels = SKILLS.map((skill) => ({
    ...skill,
    box: createLabelBox(),
    written: { x: Number.NaN, y: Number.NaN, opacity: -1, visible: false, hot: false },
  }));
  return {
    groups: skillGroups.map(() => ({ hot: 0, labelOpacity: 0 })),
    labels,
    boxes: labels.map(({ box }) => box),
    look: createConstellationLook(),
    point: createScreenPoint(),
    viewport: { width: 1, height: 1, fov: 55 },
    zones: [],
    zonesFor: '',
    shown: false,
  };
}

/** Lo que necesita un frame de las constelaciones. */
export interface ConstellationStep {
  readonly frame: Readonly<SceneFrame>;
  /** El tamaño del lienzo, en píxeles CSS. */
  readonly width: number;
  readonly height: number;
  readonly active: SkillGroupId | null;
  readonly widths: LabelWidths;
  readonly labels: StarLabelElements;
}

/** Un frame: lo encendido de cada grupo y sus uniforms; después, las etiquetas. */
export function stepConstellations(
  meshes: readonly ConstellationMeshes[],
  work: ConstellationWork,
  step: ConstellationStep,
): void {
  const { frame, active } = step;
  const presence = chapterPresence(frame.m);
  let index = 0;
  for (const mesh of meshes) {
    const group = work.groups[index] ?? { hot: 0, labelOpacity: 0 };
    group.hot = followHot(group.hot, mesh.group === active, frame.delta, frame.reducedMotion);
    const look = constellationLook(presence, group.hot, work.look);
    mesh.starUniforms.uSize.value = look.starPx;
    mesh.starUniforms.uPR.value = frame.pixelRatio;
    mesh.starUniforms.uOpacity.value = look.starOpacity;
    mesh.lineUniforms.uOpacity.value = look.lineOpacity;
    group.labelOpacity = look.labelOpacity;
    index += 1;
  }
  // Sin capítulo, y con las etiquetas ya ocultas, nada que colocar.
  if (presence === 0 && !work.shown) return;
  work.shown = presence > 0;
  placeLabels(meshes, work, step, presence);
}

function placeLabels(
  meshes: readonly ConstellationMeshes[],
  work: ConstellationWork,
  { frame, width, height, active, widths, labels }: ConstellationStep,
  presence: number,
): void {
  const key = `${String(width)}x${String(height)}${frame.wide ? 'w' : 'n'}`;
  if (work.zonesFor !== key) {
    work.zones = keepOutZones(width, height, frame.wide);
    work.zonesFor = key;
  }
  const { viewport, point } = work;
  viewport.width = width;
  viewport.height = height;
  viewport.fov = frame.fov;
  const sizes = frame.wide ? widths.wide : widths.narrow;
  const half = STAR_LABEL_BOX.heightPx / 2;
  let index = 0;
  for (const { id, position, box } of work.labels) {
    projectToScreen(position, frame.camera, viewport, point);
    box.left = point.x + STAR_LABEL_BOX.offsetPx;
    box.right = box.left + (sizes[index] ?? 0);
    box.top = point.y - half;
    box.bottom = point.y + half;
    box.wanted = point.inFront && presence > 0 && labels.has(id);
    index += 1;
  }
  fitLabels(work.boxes, work.zones);
  for (const slot of work.labels) {
    const element = labels.get(slot.id);
    if (element === undefined) continue;
    const opacity = work.groups[slot.group]?.labelOpacity ?? 0;
    writeLabel(element, slot, opacity, meshes[slot.group]?.group === active);
  }
}

function writeLabel(
  element: HTMLElement,
  { box, written }: LabelSlot,
  opacity: number,
  hot: boolean,
): void {
  if (written.visible !== box.visible) {
    written.visible = box.visible;
    element.style.visibility = box.visible ? 'visible' : 'hidden';
  }
  if (!box.visible) return;
  const x = Math.round(box.left);
  const y = Math.round(box.top);
  if (written.x !== x || written.y !== y) {
    written.x = x;
    written.y = y;
    element.style.transform = `translate(${String(x)}px, ${String(y)}px)`;
  }
  const rounded = Math.round(opacity * 100) / 100;
  if (written.opacity !== rounded) {
    written.opacity = rounded;
    element.style.opacity = String(rounded);
  }
  if (written.hot !== hot) {
    written.hot = hot;
    element.toggleAttribute('data-hot', hot);
  }
}

/**
 * Lo que mueve las constelaciones en cada frame (docs/04-escena/constelaciones-y-placas.md → «Estados»): la
 * presencia del capítulo 2 (con la `m` de la escena), lo encendido de cada grupo (el activo de
 * `uiStore.activeSkillGroup`; al instante con movimiento reducido) y, de ahí, el tamaño y la opacidad de estrellas y
 * líneas. Coloca las etiquetas: las proyecta con la pose de la cámara de este frame (la deja `CameraRig`, que va
 * antes), oculta las que no caben (`fitLabels`, contra lo que tapa la interfaz) y escribe solo lo que cambia. Sin
 * estado de React ni objetos nuevos por frame (ADR-004). Libera la GPU al desmontar. Va aparte del componente para
 * probarlo sin WebGL.
 */
export function useConstellations({
  frame,
  texts,
  labels,
}: ConstellationsProps): readonly ConstellationMeshes[] {
  const meshes = useMemo(() => createMeshes(), []);
  const widths = useMemo(() => labelWidths(texts), [texts]);
  const [work] = useState(() => createConstellationWork());

  useEffect(
    () => () => {
      for (const { stars, lines } of meshes) {
        stars.geometry.dispose();
        stars.material.dispose();
        lines.geometry.dispose();
        lines.material.dispose();
      }
    },
    [meshes],
  );

  useFrame((state: RootState) => {
    stepConstellations(meshes, work, {
      frame,
      width: state.size.width,
      height: state.size.height,
      active: useUiStore.getState().activeSkillGroup,
      widths,
      labels,
    });
  });

  return meshes;
}

/**
 * Las 4 constelaciones de las skills sobre la galaxia (F4.3; docs/04-escena/constelaciones-y-placas.md): por grupo,
 * sus estrellas (puntos con halo, del mismo tamaño en pantalla a cualquier distancia) y sus líneas. No giran con
 * la galaxia ni las mueve la gravedad del cursor (no son partículas). Su lógica se prueba aparte
 * (`useConstellations`); esto solo la monta.
 */
export function Constellations(props: ConstellationsProps): ReactNode {
  const meshes = useConstellations(props);
  return (
    <>
      {meshes.map(({ group, stars, lines }) => (
        <group key={group}>
          <lineSegments geometry={lines.geometry} material={lines.material} frustumCulled={false} />
          <points geometry={stars.geometry} material={stars.material} frustumCulled={false} />
        </group>
      ))}
    </>
  );
}
