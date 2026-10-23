import type { ReactNode } from 'react';

import { projects } from '~/content/projects';
import { cx } from '~/lib/css/cx/cx';
import { useT } from '~/lib/i18n/useT/useT';

import { ChapterPanel } from '../ChapterPanel/ChapterPanel';
import { ChapterSection } from '../ChapterSection/ChapterSection';
import { Eyebrow } from '../Eyebrow/Eyebrow';
import { ProjectRow } from '../ProjectRow/ProjectRow';
import shared from '../shared.module.css';
import styles from './Projects.module.css';

const TITLE_ID = 'projects-title';

/**
 * Capítulo 3 · Tortuga cósmica · Proyectos (docs/02-experiencia/capitulos/03-tortuga.md): una fila por
 * proyecto en orden de lectura, con enlaces reales (funcionan sin escena).
 */
export function Projects(): ReactNode {
  const t = useT();
  const ordered = [...projects].sort((a, b) => a.order - b.order);

  return (
    <ChapterSection index={3} labelledBy={TITLE_ID}>
      <ChapterPanel>
        <Eyebrow text={t('projects.eyebrow')} />
        <h2 id={TITLE_ID} tabIndex={-1}>
          {t('projects.title')}
        </h2>
        <p>{t('projects.lead')}</p>
        <ul role="list" className={cx(shared.plainList, styles.rows)}>
          {ordered.map((project) => (
            <ProjectRow key={project.slug} project={project} />
          ))}
        </ul>
      </ChapterPanel>
    </ChapterSection>
  );
}
