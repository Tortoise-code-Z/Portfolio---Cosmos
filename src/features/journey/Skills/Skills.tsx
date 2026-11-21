import {
  useEffect,
  useLayoutEffect,
  useRef,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';

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
 * una etiqueta, su propio `click` lo vuelve a encender después (manda el último gesto).
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
    };
  }, [sceneOn]);
}

/**
 * Sin viaje o sin escena, nada encendido: al desmontarse el viaje (ir a una ficha) o apagarse la escena, el grupo se
 * apaga. Si la escena se apaga con el foco del teclado en un grupo (deja de ser enfocable), el foco pasa al título
 * del capítulo y no cae a `body`: el siguiente Tab sigue desde ahí. Chromium suelta el foco en el mismo momento en que
 * se quita el `tabindex`, durante el commit de React (sus eventos están parados entonces): lo recoge un `focusout`
 * nativo. Un motor que lo suelte más tarde lo tiene aún en el grupo al limpiar (`useLayoutEffect`, en ese mismo
 * commit). Al irse el viaje, el foco lo pone la página nueva.
 */
function useTurnOffWithoutScene(
  sceneOn: boolean,
  groups: RefObject<HTMLUListElement | null>,
  title: RefObject<HTMLHeadingElement | null>,
): void {
  useLayoutEffect(() => {
    if (!sceneOn) return undefined;
    const list = groups.current;
    const heading = title.current;
    const keepFocus = ({ target, relatedTarget }: globalThis.FocusEvent): void => {
      if (relatedTarget !== null || !(target instanceof HTMLElement)) return;
      if (target.matches('[data-group]:not([tabindex])')) heading?.focus();
    };
    list?.addEventListener('focusout', keepFocus);
    return () => {
      list?.removeEventListener('focusout', keepFocus);
      setActiveSkillGroup(null);
      if (selectSceneOn(useUiStore.getState())) return;
      if (list?.contains(document.activeElement) === true) heading?.focus();
    };
  }, [sceneOn, groups, title]);
}

interface SkillGroupItemProps {
  readonly group: SkillGroup;
  /** Con la escena encendida el grupo enciende su constelación (ratón, foco y toque); sin ella, solo se resalta. */
  readonly sceneOn: boolean;
}

/**
 * Un grupo del panel (docs/03-diseno/componentes.md → «Grupo de habilidades»). Con la escena encendida es enfocable
 * (`aria-labelledby` con su título) y lo encienden el ratón (solo `mouse`: entrar enciende, salir suelta), el foco del
 * teclado y el toque; soltar apaga
 * solo si sigue siendo el encendido (manda el último gesto). Sin escena no entra en el Tab y no escribe nada. Cada
 * grupo elige solo si él está encendido: un gesto repinta los dos grupos que cambian, no el capítulo.
 */
function SkillGroupItem({ group, sceneOn }: SkillGroupItemProps): ReactNode {
  const locale = useLocale();
  const { id } = group;
  const hot = useUiStore((state) => selectSceneOn(state) && selectActiveSkillGroup(state) === id);
  const titleId = `skills-group-${id}`;
  const light = (): void => {
    if (sceneOn) setActiveSkillGroup(id);
  };
  const release = (): void => {
    releaseActiveSkillGroup(id);
  };

  return (
    // El teclado lo enciende con el foco (`onFocus`, solo `:focus-visible`); el `click` es el camino del toque.
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
      // Solo el foco del teclado enciende: el del puntero ya lo cubren `pointerenter` y `click`, y el que devuelve el
      // navegador al volver a la pestaña no es un gesto (el navegador recuerda la modalidad: `:focus-visible`).
      onFocus={(event: FocusEvent<HTMLLIElement>) => {
        if (event.currentTarget.matches(':focus-visible')) light();
      }}
      // Irse a otra ventana o pestaña no es soltar: el foco sigue en el grupo.
      onBlur={(event: FocusEvent<HTMLLIElement>) => {
        if (!document.hasFocus()) return;
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
 * Como todo capítulo, la sección deja pasar el ratón a las etiquetas de la escena: de este capítulo, solo el panel lo
 * recoge (docs/05-tecnico/arquitectura.md → «Puntero del viaje»).
 */
export function Skills(): ReactNode {
  const t = useT();
  const sceneOn = useUiStore(selectSceneOn);
  const groups = useRef<HTMLUListElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  useTapOutsideTurnsOff(sceneOn);
  useTurnOffWithoutScene(sceneOn, groups, title);

  return (
    <ChapterSection index={2} labelledBy={TITLE_ID}>
      <ChapterPanel>
        <Eyebrow text={t('skills.eyebrow')} />
        <h2 id={TITLE_ID} ref={title} tabIndex={-1}>
          {t('skills.title')}
        </h2>
        {/* Las dos instrucciones van en el HTML; el CSS muestra la del tipo de puntero, o ninguna sin escena (sin JS,
            sin saltos). */}
        <p>
          {t('skills.lead')} <span className={styles.leadPointer}>{t('skills.lead.pointer')}</span>
          <span className={styles.leadTouch}>{t('skills.lead.touch')}</span>
        </p>
        <ul ref={groups} role="list" className={cx(shared.plainList, styles.groups)}>
          {skillGroups.map((group) => (
            <SkillGroupItem key={group.id} group={group} sceneOn={sceneOn} />
          ))}
        </ul>
      </ChapterPanel>
    </ChapterSection>
  );
}
