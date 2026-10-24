import { useEffect, type ReactNode } from 'react';

import { profile } from '~/content/profile';
import { projects } from '~/content/projects';
import type { Project } from '~/content/types';
import { useLocale, useT } from '~/lib/i18n/useT/useT';
import { setVisitedProject } from '~/stores/uiStore/uiStore';
import { ArrowText } from '~/ui/ArrowText/ArrowText';

import { neighbours } from '../neighbours/neighbours';
import { ProjectGallery } from '../ProjectGallery/ProjectGallery';
import { ProjectHeader } from '../ProjectHeader/ProjectHeader';
import { ProjectNote } from '../ProjectNote/ProjectNote';
import { ProjectPager } from '../ProjectPager/ProjectPager';
import { ProjectSection } from '../ProjectSection/ProjectSection';
import { hasStack, ProjectStack } from '../ProjectStack/ProjectStack';
import { ProjectTryIt } from '../ProjectTryIt/ProjectTryIt';
import styles from './ProjectPage.module.css';

interface ProjectPageProps {
  readonly project: Project;
}

/**
 * Página de proyecto (docs/02-experiencia/pagina-proyecto.md): un documento normal, sin capítulos, en
 * una columna de lectura. Las secciones van en el orden de la spec y la que no tiene datos no se pinta
 * (Cosmos no tiene proceso ni «Try it»; ninguna portada ni galería existe hasta F2.8). Es el `<main>` de la ruta.
 * Apunta el proyecto como visto: al volver al viaje, el foco queda en su fila.
 */
export function ProjectPage({ project }: ProjectPageProps): ReactNode {
  const t = useT();
  const locale = useLocale();
  const about = project.about[locale];
  const process = project.process[locale];
  const { cover } = project;

  // Al volver al viaje, su fila recibe el foco (Projects → `takeVisitedProject`).
  useEffect(() => {
    setVisitedProject(project.slug);
  }, [project.slug]);

  return (
    <main className={styles.page}>
      <div className={styles.column}>
        <ProjectHeader project={project} />

        {cover === null ? null : (
          <figure className={styles.cover}>
            <img
              src={cover.src}
              width={cover.width}
              height={cover.height}
              alt={cover.alt[locale]}
              className={styles.coverImage}
            />
          </figure>
        )}

        {about.length === 0 ? null : (
          <ProjectSection titleId="project-about" title={t('project.about')}>
            {about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </ProjectSection>
        )}

        {project.features.length === 0 ? null : (
          <ProjectSection titleId="project-features" title={t('project.features')}>
            <ul role="list" className={styles.features}>
              {project.features.map((feature) => (
                <li key={feature.en} className={styles.feature}>
                  <ArrowText text={feature[locale]} />
                </li>
              ))}
            </ul>
          </ProjectSection>
        )}

        {hasStack(project.stack) ? (
          <ProjectSection titleId="project-stack" title={t('project.stack')}>
            <ProjectStack stack={project.stack} />
          </ProjectSection>
        ) : null}

        <ProcessSection project={project} process={process} />

        {project.notes.length === 0 ? null : (
          <ProjectSection titleId="project-notes" title={t('project.notes')}>
            <ul role="list" className={styles.notes}>
              {project.notes.map((note) => (
                <li key={note.text.en}>
                  <ProjectNote kind={note.kind}>{note.text[locale]}</ProjectNote>
                </li>
              ))}
            </ul>
          </ProjectSection>
        )}

        {project.tryIt === null ? null : (
          <ProjectSection titleId="project-try-it" title={t('project.tryIt')}>
            <ProjectTryIt tryIt={project.tryIt} readme={project.links.readme} />
          </ProjectSection>
        )}

        {project.gallery.length === 0 ? null : (
          <ProjectSection titleId="project-gallery" title={t('project.gallery')}>
            <ProjectGallery images={project.gallery} />
          </ProjectSection>
        )}

        <ProjectPager neighbours={neighbours(projects, project.slug)} contact={profile.contact} />
      </div>
    </main>
  );
}

interface ProcessSectionProps {
  readonly project: Project;
  readonly process: readonly string[];
}

/**
 * «Development process» con sus «Technical highlights» (`h3`) debajo. Sin párrafos de proceso, los
 * retos van solos con su propio `h2`; sin ninguno de los dos, no se pinta.
 */
function ProcessSection({ project, process }: ProcessSectionProps): ReactNode {
  const t = useT();
  const locale = useLocale();
  const { highlights } = project;
  if (process.length === 0 && highlights.length === 0) return null;

  const list =
    highlights.length === 0 ? null : (
      <ul role="list" className={styles.highlights}>
        {highlights.map((highlight) => (
          <li key={highlight.en} className={styles.highlight}>
            {highlight[locale]}
          </li>
        ))}
      </ul>
    );

  if (process.length === 0) {
    return (
      <ProjectSection titleId="project-highlights" title={t('project.highlights')}>
        {list}
      </ProjectSection>
    );
  }

  return (
    <ProjectSection titleId="project-process" title={t('project.process')}>
      {process.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {list === null ? null : (
        <>
          <h3 className={styles.subtitle}>{t('project.highlights')}</h3>
          {list}
        </>
      )}
    </ProjectSection>
  );
}
