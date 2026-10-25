import type { ReactNode } from 'react';

import { profile } from '~/content/profile';
import { projectEntries } from '~/content/projects/entries';
import { skillGroups } from '~/content/skills';
import type { ProjectEntry } from '~/content/types';
import { workModesText } from '~/lib/i18n/availability/availability';
import { formatNumber } from '~/lib/i18n/format/format';
import { localize } from '~/lib/i18n/localize/localize';
import { projectPath } from '~/lib/i18n/paths/paths';
import { useLocale, useT } from '~/lib/i18n/useT/useT';
import { ActionLink } from '~/ui/ActionLink/ActionLink';
import { CopyButton } from '~/ui/CopyButton/CopyButton';
import { VisuallyHidden } from '~/ui/VisuallyHidden/VisuallyHidden';

import styles from './QuickMissionContent.module.css';

const EMAIL_ID = 'quick-email';
const SEPARATOR = ' · ';

/**
 * Todo el contenido del viaje en una página limpia, para el modo misión rápida
 * (docs/02-experiencia/navegacion.md → «Modo misión rápida»): sobre mí, proyectos (con su página, demo
 * y código), habilidades, formación, disponibilidad y contacto. Lee los mismos datos que los capítulos
 * (`src/content/`), con un marcado propio y compacto: entre features no se comparten componentes
 * (ADR-022). Las secciones son una rejilla de columnas de 280 px como mínimo.
 */
export function QuickMissionContent(): ReactNode {
  const t = useT();
  const locale = useLocale();
  const { availability, contact, location } = profile;
  const cv = profile.cv[locale];
  const ordered = [...projectEntries].sort((a, b) => a.order - b.order);

  return (
    <div className={styles.grid}>
      <section className={styles.section}>
        <h3 className={styles.heading}>{t('quick.about')}</h3>
        {profile.bio[locale].map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <p className={styles.meta}>
          {`${t('about.strengths')}: ${profile.strengths.map((item) => localize(locale, item)).join(SEPARATOR)}`}
        </p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.heading}>{t('quick.projects')}</h3>
        <ul role="list" className={styles.list}>
          {ordered.map((project) => (
            <QuickProject key={project.slug} project={project} />
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h3 className={styles.heading}>{t('quick.skills')}</h3>
        <ul role="list" className={styles.list}>
          {skillGroups.map((group) => (
            <li key={group.id}>
              <span className={styles.term}>{`${localize(locale, group.title)}: `}</span>
              {group.skills.map((skill) => localize(locale, skill.label)).join(', ')}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h3 className={styles.heading}>{t('quick.education')}</h3>
        <ul role="list" className={styles.list}>
          {profile.education.map((item) => (
            <li key={item.id}>
              <span className={styles.term}>{item.title[locale]}</span>
              <span className={styles.meta}>
                {[
                  item.school,
                  item.period,
                  t('education.hours', { n: formatNumber(locale, item.hours) }),
                ].join(SEPARATOR)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {availability.openToWork ? (
        <section className={styles.section}>
          <h3 className={styles.heading}>{t('quick.availability')}</h3>
          <ul role="list" className={styles.list}>
            <li className={styles.open}>{t('nav.availability')}</li>
            <li>{workModesText(locale, availability.modes)}</li>
            {availability.openToRelocation ? <li>{t('contact.availability.relocation')}</li> : null}
            <li>{`${location.city}, ${localize(locale, location.country)}`}</li>
          </ul>
        </section>
      ) : null}

      <section className={styles.section}>
        <h3 className={styles.heading}>{t('quick.contact')}</h3>
        <div className={styles.emailRow}>
          <a id={EMAIL_ID} className={styles.email} href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
          <CopyButton
            text={contact.email}
            targetId={EMAIL_ID}
            subject={t('contact.copy.subject')}
          />
        </div>
        <ul role="list" className={styles.links}>
          <li>
            <ActionLink href={contact.github} kind="external">
              GitHub
            </ActionLink>
          </li>
          <li>
            <ActionLink href={contact.linkedin} kind="external">
              LinkedIn
            </ActionLink>
          </li>
          {cv === null ? null : (
            <li>
              <ActionLink href={cv} kind="download">
                {t('contact.cv')}
              </ActionLink>
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

/** Un proyecto en una ficha corta: nombre y año, metadatos, resumen y enlaces. */
function QuickProject({ project }: { readonly project: ProjectEntry }): ReactNode {
  const t = useT();
  const locale = useLocale();
  const meta = [
    ...(project.featured ? [t('projects.featured')] : []),
    t(`projects.role.${project.role}`),
    t(`projects.context.${project.context}`),
    ...project.stack.core.map((label) => localize(locale, label)),
  ];
  // Un espacio de texto real antes del nombre oculto: así todos los motores leen «Code Chessmate».
  const which = (
    <>
      {' '}
      <VisuallyHidden>{project.name}</VisuallyHidden>
    </>
  );

  return (
    <li className={styles.project}>
      <div className={styles.projectTop}>
        <h4 className={styles.projectName}>{project.name}</h4>
        <span className={styles.year}>{String(project.year)}</span>
      </div>
      <p className={styles.meta}>{meta.join(SEPARATOR)}</p>
      <p>{project.summary[locale]}</p>
      <ul role="list" className={styles.links}>
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
