import type { FocusEvent, PointerEvent, ReactNode } from 'react';

import type { ProjectEntry } from '~/content/types';
import { localize } from '~/lib/i18n/localize/localize';
import { projectPath } from '~/lib/i18n/paths/paths';
import { useLocale, useT } from '~/lib/i18n/useT/useT';
import {
  releaseActiveProject,
  selectActiveProject,
  selectSceneOn,
  setActiveProject,
  useUiStore,
} from '~/stores/uiStore/uiStore';
import { ActionLink } from '~/ui/ActionLink/ActionLink';
import { VisuallyHidden } from '~/ui/VisuallyHidden/VisuallyHidden';

import shared from '../shared.module.css';
import styles from './ProjectRow.module.css';

interface ProjectRowProps {
  readonly project: ProjectEntry;
  /** Con la escena encendida la fila ilumina su placa (ratón, foco del teclado y toque); sin ella, solo se resalta. */
  readonly sceneOn: boolean;
}

/**
 * Fila de proyecto del capítulo 3 (docs/03-diseno/componentes.md → «Fila de proyecto»): nombre, año,
 * metadatos (destacado, rol, contexto, stack principal), resumen y acciones. Cada enlace lleva el nombre
 * del proyecto oculto para el lector de pantalla («View project Chessmate»): fuera de la fila se entiende.
 *
 * Con la escena encendida señala su proyecto (`uiStore.activeProject`: la escena ilumina su placa y para el ciclo
 * automático): el ratón (solo `mouse`: entrar señala, salir suelta), el foco del teclado en uno de sus enlaces
 * (`:focus-visible`) y un toque. Soltar solo apaga si sigue siendo el señalado (manda el último gesto). Se marca
 * (`data-hot`) solo si su proyecto es el señalado, venga de la fila o de la escena: el ciclo automático no la marca.
 * Cada fila elige solo si ella está señalada: un gesto repinta las dos filas que cambian, no el capítulo.
 */
export function ProjectRow({ project, sceneOn }: ProjectRowProps): ReactNode {
  const t = useT();
  const locale = useLocale();
  const { slug } = project;
  const hot = useUiStore((state) => selectSceneOn(state) && selectActiveProject(state) === slug);
  const point = (): void => {
    if (sceneOn) setActiveProject(slug);
  };
  const release = (): void => {
    releaseActiveProject(slug);
  };
  // Un espacio de texto real antes del nombre oculto: así todos los motores leen «View project Chessmate».
  const which = (
    <>
      {' '}
      <VisuallyHidden>{project.name}</VisuallyHidden>
    </>
  );

  return (
    // El teclado señala con el foco de sus enlaces (`onFocus`, que sube desde ellos); el `click` es el camino del toque.
    // eslint-disable-next-line jsx-a11y-x/no-noninteractive-element-interactions, jsx-a11y-x/click-events-have-key-events
    <li
      className={styles.row}
      data-project={slug}
      data-hot={hot ? '' : undefined}
      onPointerEnter={(event: PointerEvent) => {
        if (event.pointerType === 'mouse') point();
      }}
      onPointerLeave={(event: PointerEvent) => {
        if (event.pointerType === 'mouse') release();
      }}
      // Solo el foco del teclado señala: el del puntero ya lo cubren `pointerenter` y `click`, y el que devuelve el
      // navegador al volver a la pestaña no es un gesto (el navegador recuerda la modalidad: `:focus-visible`).
      onFocus={(event: FocusEvent<HTMLLIElement>) => {
        if (event.target.matches(':focus-visible')) point();
      }}
      // Irse a otra ventana o pestaña no es soltar: el foco sigue en la fila.
      onBlur={(event: FocusEvent<HTMLLIElement>) => {
        if (!document.hasFocus()) return;
        if (!event.currentTarget.contains(event.relatedTarget)) release();
      }}
      onClick={point}
    >
      <div className={styles.top}>
        <h3 className={styles.name}>{project.name}</h3>
        <span className={styles.year}>{String(project.year)}</span>
      </div>
      <ul role="list" className={shared.dotted} data-meta="">
        {project.featured ? <li className={styles.featured}>{t('projects.featured')}</li> : null}
        <li>{t(`projects.role.${project.role}`)}</li>
        <li>{t(`projects.context.${project.context}`)}</li>
        {project.stack.core.map((label) => {
          const text = localize(locale, label);
          return <li key={text}>{text}</li>;
        })}
      </ul>
      <p className={styles.summary}>{project.summary[locale]}</p>
      <ul role="list" className={styles.actions}>
        <li>
          <ActionLink href={projectPath(locale, project.slug)} kind="internal" icon="arrow-right">
            {t('projects.open')}
            {which}
          </ActionLink>
        </li>
        {project.links.demo === null ? null : (
          <li>
            <ActionLink href={project.links.demo} kind="external">
              {t('projects.demo')}
              {which}
            </ActionLink>
          </li>
        )}
        <li>
          <ActionLink href={project.links.code} kind="external">
            {t('projects.code')}
            {which}
          </ActionLink>
        </li>
      </ul>
    </li>
  );
}
