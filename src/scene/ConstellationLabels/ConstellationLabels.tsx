import type { MouseEvent, PointerEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { skillGroups } from '~/content/skills';
import type { SkillGroupId } from '~/content/types';
import { releaseActiveSkillGroup, setActiveSkillGroup } from '~/stores/uiStore/uiStore';

import styles from './ConstellationLabels.module.css';

/** Las etiquetas montadas, por `Skill.id`: la escena las coloca en cada frame (`scene/Constellations`). */
export type StarLabelElements = Map<string, HTMLElement>;

export function createStarLabelElements(): StarLabelElements {
  return new Map();
}

/**
 * Apunta una etiqueta montada y devuelve cómo quitarla (la limpieza del `ref` de React 19). Sin elemento, nada.
 */
export function registerLabel(
  elements: StarLabelElements,
  id: string,
  element: HTMLElement | null,
): (() => void) | undefined {
  if (element === null) return undefined;
  elements.set(id, element);
  return () => {
    elements.delete(id);
  };
}

/** El grupo de la etiqueta (`data-group`), si es uno de verdad. */
function groupOf(element: HTMLElement): SkillGroupId | undefined {
  const { group } = element.dataset;
  return skillGroups.find(({ id }) => id === group)?.id;
}

/** Ratón encima → enciende su grupo; sale → lo suelta (si sigue encendido). Solo `mouse`. */
function onPointerEnter(event: PointerEvent<HTMLElement>): void {
  const group = groupOf(event.currentTarget);
  if (event.pointerType === 'mouse' && group !== undefined) setActiveSkillGroup(group);
}

function onPointerLeave(event: PointerEvent<HTMLElement>): void {
  const group = groupOf(event.currentTarget);
  if (event.pointerType === 'mouse' && group !== undefined) releaseActiveSkillGroup(group);
}

/** Un toque enciende su grupo (va después de «tocar fuera apaga», que escucha en la captura: Skills). */
function onClick(event: MouseEvent<HTMLElement>): void {
  const group = groupOf(event.currentTarget);
  if (group !== undefined) setActiveSkillGroup(group);
}

export interface ConstellationLabelsProps {
  /** El texto de cada skill, ya en el idioma de la página; `null` fuera del viaje (sin etiquetas). */
  readonly texts: Readonly<Record<string, string>> | null;
  readonly elements: StarLabelElements;
}

/**
 * Las etiquetas de las estrellas de las constelaciones (F4.3; docs/04-escena/constelaciones-y-placas.md): elementos
 * del DOM en una capa propia, montada en `body` (dentro del lienzo quedarían por debajo del destello), en el
 * orden del panel. Decorativas (`aria-hidden`): la lista accesible es la del panel. Los textos llegan por props
 * (`SceneMount`), porque la escena solo lee del contenido los ids y el orden. Sin estado: las coloca la escena. Las
 * que la escena marca con `data-live` reciben el puntero (su CSS): el ratón o un toque encienden su grupo (F4.3c).
 */
export function ConstellationLabels({ texts, elements }: ConstellationLabelsProps): ReactNode {
  if (texts === null) return null;
  return createPortal(
    <div className={styles.layer} aria-hidden="true" data-constellation-labels="">
      {skillGroups.flatMap((group) =>
        group.skills.map((skill) => (
          // Decorativa (la capa es `aria-hidden`): el teclado y el lector usan el panel de Skills.
          // eslint-disable-next-line jsx-a11y-x/no-static-element-interactions, jsx-a11y-x/click-events-have-key-events
          <span
            key={skill.id}
            ref={(element) => registerLabel(elements, skill.id, element)}
            className={styles.label}
            data-group={group.id}
            data-skill={skill.id}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
            onClick={onClick}
          >
            {texts[skill.id] ?? ''}
          </span>
        )),
      )}
    </div>,
    document.body,
  );
}
