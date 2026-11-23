import { useFrame, type RootState } from '@react-three/fiber';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BufferAttribute, BufferGeometry, type ShaderMaterial } from 'three';

import { skillGroups } from '~/content/skills';
import type { SkillGroupId } from '~/content/types';
import { useUiStore } from '~/stores/uiStore/uiStore';

import type { StarLabelElements } from '../ConstellationLabels/ConstellationLabels';
import {
  CONSTELLATION_LINKS,
  CONSTELLATION_LOOK,
  CONSTELLATION_STARS,
  STAR_LABEL_BOX,
  starLabelWidth,
} from '../config/constellationLayout/constellationLayout';
import type { ScenePoint } from '../config/sceneConfig';
import { chapterPresence } from '../math/chapterPresence/chapterPresence';
import {
  constellationLook,
  createConstellationLook,
  followHot,
  type ConstellationLook,
} from '../math/constellations/constellations';
import { createWrittenLabel, writeLabel, type WritableLabel } from '../labelWriter/labelWriter';
import {
  createLabelBox,
  createZoneCache,
  fitLabels,
  zonesFor,
  type LabelBox,
  type ZoneCache,
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
  /** Sus skills (ids), en el orden del panel. */
  readonly skills: readonly string[];
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
      skills: group.skills.map(({ id }) => id),
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

/** Una etiqueta durante la visita: su skill, su caja en este frame y lo último escrito. */
interface LabelSlot extends WritableLabel {
  readonly id: string;
  /** Su grupo (el mismo objeto que en `work.groups`). */
  readonly group: GroupSlot;
  readonly position: ScenePoint;
}

/** Un grupo durante la visita: su constelación, cuánto está encendido y la opacidad de sus etiquetas en este frame. */
interface GroupSlot {
  readonly id: SkillGroupId;
  readonly mesh: ConstellationMeshes;
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
  /** Lo que tapa la interfaz, para el tamaño y el encuadre del lienzo (se rehace solo si cambian). */
  readonly zones: ZoneCache;
  /** Alguna etiqueta podía verse en el frame anterior (hay que ocultarlas al irse el capítulo). */
  shown: boolean;
  /** Lo que el `useFrame` le pasa a `stepConstellations`, rellenado en cada frame (no un objeto nuevo). */
  readonly step: ConstellationStep;
}

export function createConstellationWork(
  frame: Readonly<SceneFrame>,
  labelElements: StarLabelElements,
  meshes: readonly ConstellationMeshes[],
): ConstellationWork {
  const groups: GroupSlot[] = [];
  const labels: LabelSlot[] = [];
  for (const mesh of meshes) {
    const group: GroupSlot = { id: mesh.group, mesh, hot: 0, labelOpacity: 0 };
    groups.push(group);
    for (const id of mesh.skills) {
      labels.push({
        id,
        group,
        position: star(id),
        box: createLabelBox(),
        written: createWrittenLabel(),
      });
    }
  }
  return {
    groups,
    labels,
    boxes: labels.map(({ box }) => box),
    look: createConstellationLook(),
    point: createScreenPoint(),
    viewport: { width: 1, height: 1, fov: 55 },
    zones: createZoneCache(),
    shown: false,
    step: {
      frame,
      width: 1,
      height: 1,
      active: null,
      widths: { wide: [], narrow: [] },
      labels: labelElements,
    },
  };
}

/** Lo que necesita un frame de las constelaciones. */
export interface ConstellationStep {
  frame: Readonly<SceneFrame>;
  /** El tamaño del lienzo, en píxeles CSS. */
  width: number;
  height: number;
  active: SkillGroupId | null;
  widths: LabelWidths;
  labels: StarLabelElements;
}

/** Un frame: lo encendido de cada grupo y sus uniforms; después, las etiquetas. */
export function stepConstellations(work: ConstellationWork, step: ConstellationStep): void {
  const { frame, active } = step;
  const presence = chapterPresence(frame.m, CONSTELLATION_LOOK.chapter);
  for (const group of work.groups) {
    const { mesh } = group;
    group.hot = followHot(group.hot, mesh.group === active, frame.delta, frame.reducedMotion);
    const look = constellationLook(presence, group.hot, work.look);
    mesh.starUniforms.uSize.value = look.starPx;
    mesh.starUniforms.uPR.value = frame.pixelRatio;
    mesh.starUniforms.uOpacity.value = look.starOpacity;
    mesh.lineUniforms.uOpacity.value = look.lineOpacity;
    group.labelOpacity = look.labelOpacity;
  }
  // Sin capítulo, y con las etiquetas ya ocultas, nada que colocar.
  if (presence === 0 && !work.shown) return;
  work.shown = presence > 0;
  placeLabels(work, step, presence);
}

function placeLabels(
  work: ConstellationWork,
  { frame, width, height, active, widths, labels }: ConstellationStep,
  presence: number,
): void {
  const { viewport, point } = work;
  viewport.width = width;
  viewport.height = height;
  viewport.fov = frame.fov;
  const sizes = frame.wide ? widths.wide : widths.narrow;
  const half = STAR_LABEL_BOX.heightPx / 2;
  let index = 0;
  for (const slot of work.labels) {
    const { box } = slot;
    projectToScreen(slot.position, frame.camera, viewport, point);
    box.left = point.x + STAR_LABEL_BOX.offsetPx;
    box.right = box.left + (sizes[index] ?? 0);
    index += 1;
    box.top = point.y - half;
    box.bottom = point.y + half;
    // Una proyección que no da un número (un lienzo sin tamaño) no se coloca: nunca `translate(NaNpx, …)`.
    box.wanted =
      point.inFront &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.y) &&
      presence > 0 &&
      labels.has(slot.id);
  }
  fitLabels(work.boxes, zonesFor(work.zones, width, height, frame.wide));
  const interactive = presence > CONSTELLATION_LOOK.interactiveFrom;
  for (const slot of work.labels) {
    writeLabel(
      labels.get(slot.id),
      slot,
      slot.group.labelOpacity,
      slot.group.id === active,
      interactive,
    );
  }
}

/** Rellena el paso del frame en `work.step` (sin crear nada) y lo da. */
export function runConstellationsFrame(
  work: ConstellationWork,
  frame: Readonly<SceneFrame>,
  labels: StarLabelElements,
  size: Readonly<{ width: number; height: number }>,
  widths: LabelWidths,
  active: SkillGroupId | null,
): void {
  const { step } = work;
  step.frame = frame;
  step.labels = labels;
  step.width = size.width;
  step.height = size.height;
  step.widths = widths;
  step.active = active;
  stepConstellations(work, step);
}

/**
 * Lo que mueve las constelaciones en cada frame (docs/04-escena/constelaciones-y-placas.md → «Estados»): la
 * presencia del capítulo 2 (con la `m` de la escena), lo encendido de cada grupo (el activo de
 * `uiStore.activeSkillGroup`; al instante con movimiento reducido) y, de ahí, el tamaño y la opacidad de estrellas y
 * líneas. Coloca las etiquetas: las proyecta con la pose de la cámara de este frame (la deja `CameraRig`, que va
 * antes), oculta las que no caben (`fitLabels`, contra lo que tapa la interfaz) y escribe solo lo que cambia; con el
 * capítulo a más de `interactiveFrom`, las visibles responden al puntero, ratón o toque (`data-live`). Sin
 * estado de React ni objetos nuevos por frame (ADR-004): el paso de cada frame se rellena en `work.step`. Libera la
 * GPU al desmontar. Va aparte del componente para probarlo sin WebGL.
 */
export function useConstellations({
  frame,
  texts,
  labels,
}: ConstellationsProps): readonly ConstellationMeshes[] {
  const meshes = useMemo(() => createMeshes(), []);
  const widths = useMemo(() => labelWidths(texts), [texts]);
  const [work] = useState(() => createConstellationWork(frame, labels, meshes));

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
    runConstellationsFrame(
      work,
      frame,
      labels,
      state.size,
      widths,
      useUiStore.getState().activeSkillGroup,
    );
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
