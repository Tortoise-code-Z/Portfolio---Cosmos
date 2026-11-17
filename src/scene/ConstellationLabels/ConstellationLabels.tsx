import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { skillGroups } from '~/content/skills';

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

export interface ConstellationLabelsProps {
  /** El texto de cada skill, ya en el idioma de la página; `null` fuera del viaje (sin etiquetas). */
  readonly texts: Readonly<Record<string, string>> | null;
  readonly elements: StarLabelElements;
}

/**
 * Las etiquetas de las estrellas de las constelaciones (F4.3; docs/04-escena/constelaciones-y-placas.md): elementos
 * del DOM en una capa propia, montada en `body` (dentro del lienzo quedarían por debajo del destello), en el
 * orden del panel. Decorativas (`aria-hidden`): la lista accesible es la del panel. Los textos llegan por props
 * (`SceneMount`), porque la escena solo lee del contenido los ids y el orden. Sin estado: las coloca la escena.
 */
export function ConstellationLabels({ texts, elements }: ConstellationLabelsProps): ReactNode {
  if (texts === null) return null;
  return createPortal(
    <div className={styles.layer} aria-hidden="true" data-constellation-labels="">
      {skillGroups.flatMap((group) =>
        group.skills.map((skill) => (
          <span
            key={skill.id}
            ref={(element) => registerLabel(elements, skill.id, element)}
            className={styles.label}
            data-group={group.id}
            data-skill={skill.id}
          >
            {texts[skill.id] ?? ''}
          </span>
        )),
      )}
    </div>,
    document.body,
  );
}
