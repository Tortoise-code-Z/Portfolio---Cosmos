import type { ReactNode } from 'react';

import type { Project } from '~/content/types';
import { localize } from '~/lib/i18n/localize/localize';
import { projectPath } from '~/lib/i18n/paths/paths';
import { useLocale, useT } from '~/lib/i18n/useT/useT';
import { ActionLink } from '~/ui/ActionLink/ActionLink';
import { VisuallyHidden } from '~/ui/VisuallyHidden/VisuallyHidden';

import shared from '../shared.module.css';
import styles from './ProjectRow.module.css';

interface ProjectRowProps {
  readonly project: Project;
}

/**
 * Fila de proyecto del capítulo 3 (docs/03-diseno/componentes.md → «Fila de proyecto»): nombre, año,
 * metadatos (destacado, rol, contexto, stack principal), resumen y acciones. Cada enlace lleva el nombre
 * del proyecto oculto para el lector de pantalla («View project Chessmate»): fuera de la fila se entiende.
 */
export function ProjectRow({ project }: ProjectRowProps): ReactNode {
  const t = useT();
  const locale = useLocale();
  // Un espacio de texto real antes del nombre oculto: así todos los motores leen «View project Chessmate».
  const which = (
    <>
      {' '}
      <VisuallyHidden>{project.name}</VisuallyHidden>
    </>
  );

  return (
    <li className={styles.row} data-project={project.slug}>
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
