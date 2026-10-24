import type { ReactNode } from 'react';

import type { Project } from '~/content/types';
import { homePath } from '~/lib/i18n/paths/paths';
import { useLocale, useT } from '~/lib/i18n/useT/useT';
import { ActionLink } from '~/ui/ActionLink/ActionLink';

import styles from './ProjectHeader.module.css';

/** Id del nombre del proyecto (`h1`, enfocable por código): destino de «Skip to content» en la página. */
export const PROJECT_TITLE_ID = 'project-title';

interface ProjectHeaderProps {
  readonly project: Project;
}

/**
 * Cabecera de la página de proyecto (docs/02-experiencia/pagina-proyecto.md → «Estructura», punto 1):
 * vuelta al caparazón, nombre en display grande, tagline, metadatos (destacado, año, rol, contexto) y
 * las acciones Live demo (si hay) y Code.
 */
export function ProjectHeader({ project }: ProjectHeaderProps): ReactNode {
  const t = useT();
  const locale = useLocale();

  return (
    <header className={styles.header}>
      <p className={styles.back}>
        <ActionLink href={`${homePath(locale)}#projects`} kind="internal" leadingIcon="arrow-left">
          {t('project.back')}
        </ActionLink>
      </p>
      <h1 id={PROJECT_TITLE_ID} className={styles.name} tabIndex={-1}>
        {project.name}
      </h1>
      <p className={styles.tagline}>{project.tagline[locale]}</p>
      <ul role="list" className={styles.meta}>
        {project.featured ? <li className={styles.featured}>{t('projects.featured')}</li> : null}
        <li>{String(project.year)}</li>
        <li>{t(`projects.role.${project.role}`)}</li>
        <li>{t(`projects.context.${project.context}`)}</li>
      </ul>
      <ul role="list" className={styles.actions}>
        {project.links.demo === null ? null : (
          <li>
            <ActionLink href={project.links.demo} kind="external">
              {t('projects.demo')}
            </ActionLink>
          </li>
        )}
        <li>
          <ActionLink href={project.links.code} kind="external">
            {t('projects.code')}
          </ActionLink>
        </li>
      </ul>
    </header>
  );
}
