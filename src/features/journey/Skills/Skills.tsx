import { useEffect, type FocusEvent, type PointerEvent, type ReactNode } from 'react';

import { skillGroups } from '~/content/skills';
import type { SkillGroup } from '~/content/types';
import { cx } from '~/lib/css/cx/cx';
import { localize } from '~/lib/i18n/localize/localize';
import { useLocale, useT } from '~/lib/i18n/useT/useT';
import {
  releaseActiveSkillGroup,
  selectActiveSkillGroup,
  selectSceneOn,
  setActiveSkillGroup,
  useUiStore,
} from '~/stores/uiStore/uiStore';

import { ChapterPanel } from '../ChapterPanel/ChapterPanel';
import { ChapterSection } from '../ChapterSection/ChapterSection';
import { Eyebrow } from '../Eyebrow/Eyebrow';
import shared from '../shared.module.css';
import styles from './Skills.module.css';

const TITLE_ID = 'skills-title';

/**
 * Tocar fuera apaga: solo un toque limpio, un `click` (deslizar o salir del capítulo no lo dan). Se
 * escucha en la fase de captura del documento, antes que nada de la página: apaga, y si el toque cae en un grupo o en
 * una etiqueta, su propio `click` lo vuelve a encender después (manda el último gesto). Al desmontarse el viaje (ir a
 * una ficha) o apagarse la escena, el grupo se apaga.
 */
function useTapOutsideTurnsOff(sceneOn: boolean): void {
  useEffect(() => {
    if (!sceneOn) return undefined;
    const turnOff = (): void => {
      setActiveSkillGroup(null);
    };
    document.addEventListener('click', turnOff, { capture: true });
    return () => {
      document.removeEventListener('click', turnOff, { capture: true });
      setActiveSkillGroup(null);
    };
  }, [sceneOn]);
}

interface SkillGroupItemProps {
  readonly group: SkillGroup;
  /** Con la escena encendida el grupo enciende su constelación (ratón, foco y toque); sin ella, solo se resalta. */
  readonly sceneOn: boolean;
  readonly hot: boolean;
}

/**
 * Un grupo del panel (docs/03-diseno/componentes.md → «Grupo de habilidades»). Con la escena encendida es enfocable
 * (`aria-labelledby` con su título) y lo encienden el ratón (solo `mouse`: entrar enciende, salir suelta), el foco y el toque; soltar apaga
 * solo si sigue siendo el encendido (manda el último gesto). Sin escena no entra en el Tab y no escribe nada.
 */
function SkillGroupItem({ group, sceneOn, hot }: SkillGroupItemProps): ReactNode {
  const locale = useLocale();
  const { id } = group;
  const titleId = `skills-group-${id}`;
  const light = (): void => {
    if (sceneOn) setActiveSkillGroup(id);
  };
  const release = (): void => {
    releaseActiveSkillGroup(id);
  };

  return (
    // El teclado lo enciende con el foco (`onFocus`); el `click` es el camino del toque.
    // eslint-disable-next-line jsx-a11y-x/no-noninteractive-element-interactions, jsx-a11y-x/click-events-have-key-events
    <li
      className={styles.group}
      data-group={id}
      data-hot={hot ? '' : undefined}
      // eslint-disable-next-line jsx-a11y-x/no-noninteractive-tabindex -- enfocable para encender la constelación con teclado
      tabIndex={sceneOn ? 0 : undefined}
      aria-labelledby={sceneOn ? titleId : undefined}
      onPointerEnter={(event: PointerEvent) => {
        if (event.pointerType === 'mouse') light();
      }}
      onPointerLeave={(event: PointerEvent) => {
        if (event.pointerType === 'mouse') release();
      }}
      onFocus={light}
      onBlur={(event: FocusEvent) => {
        if (!event.currentTarget.contains(event.relatedTarget)) release();
      }}
      onClick={light}
    >
      <h3 id={titleId} className={cx(shared.label, styles.groupTitle)}>
        {localize(locale, group.title)}
      </h3>
      <ul role="list" aria-labelledby={titleId} className={cx(shared.dotted, styles.skills)}>
        {group.skills.map((skill) => (
          <li key={skill.id}>{localize(locale, skill.label)}</li>
        ))}
      </ul>
    </li>
  );
}

/**
 * Capítulo 2 · Galaxia · Habilidades (docs/02-experiencia/capitulos/02-galaxia.md). El panel es la versión completa
 * y accesible: los 4 grupos con todas sus skills. Con la escena encendida, cada grupo enciende su constelación
 * (`uiStore.activeSkillGroup`, que la escena lee en cada frame); sin escena, un grupo solo se resalta con el puntero.
 * La sección deja pasar el ratón a las etiquetas de la escena; solo el panel lo recoge.
 */
export function Skills(): ReactNode {
  const t = useT();
  const sceneOn = useUiStore(selectSceneOn);
  const activeGroup = useUiStore(selectActiveSkillGroup);
  useTapOutsideTurnsOff(sceneOn);

  return (
    <ChapterSection index={2} labelledBy={TITLE_ID} passThrough>
      <ChapterPanel>
        <Eyebrow text={t('skills.eyebrow')} />
        <h2 id={TITLE_ID} tabIndex={-1}>
          {t('skills.title')}
        </h2>
        {/* Las dos frases van en el HTML; el CSS muestra la del tipo de puntero (sin JS, sin saltos). */}
        <p className={styles.leadPointer}>{t('skills.lead.pointer')}</p>
        <p className={styles.leadTouch}>{t('skills.lead.touch')}</p>
        <ul role="list" className={cx(shared.plainList, styles.groups)}>
          {skillGroups.map((group) => (
            <SkillGroupItem
              key={group.id}
              group={group}
              sceneOn={sceneOn}
              hot={sceneOn && activeGroup === group.id}
            />
          ))}
        </ul>
      </ChapterPanel>
    </ChapterSection>
  );
}
