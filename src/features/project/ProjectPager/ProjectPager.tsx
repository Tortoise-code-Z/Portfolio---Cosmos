import type { ReactNode } from 'react';
import { Link } from 'react-router';

import type { Profile } from '~/content/types';
import { projectPath } from '~/lib/i18n/paths/paths';
import { useLocale, useT } from '~/lib/i18n/useT/useT';
import { ActionLink } from '~/ui/ActionLink/ActionLink';
import { Icon } from '~/ui/Icon/Icon';

import type { Neighbours } from '../neighbours/neighbours';
import styles from './ProjectPager.module.css';

interface ProjectPagerProps {
  readonly neighbours: Neighbours;
  readonly contact: Profile['contact'];
}

/**
 * Pie de la página de proyecto (pagina-proyecto.md → «Estructura», punto 10): proyecto anterior y
 * siguiente (sin vuelta: el que no existe no se pinta) y los enlaces a GitHub, LinkedIn y email.
 * Cada enlace de proyecto dice hacia dónde y a cuál va («Next project AstroHub»).
 */
export function ProjectPager({ neighbours, contact }: ProjectPagerProps): ReactNode {
  const t = useT();
  const locale = useLocale();
  const { prev, next } = neighbours;

  return (
    <footer className={styles.footer}>
      {prev === undefined && next === undefined ? null : (
        <nav aria-label={t('project.pager')}>
          <ul role="list" className={styles.pager}>
            {prev === undefined ? null : (
              <li className={styles.prev}>
                <Link to={projectPath(locale, prev.slug)} rel="prev" className={styles.link}>
                  <span className={styles.direction}>
                    <Icon name="arrow-left" /> {t('project.prev')}
                  </span>{' '}
                  <span className={styles.name}>{prev.name}</span>
                </Link>
              </li>
            )}
            {next === undefined ? null : (
              <li className={styles.next}>
                <Link to={projectPath(locale, next.slug)} rel="next" className={styles.link}>
                  <span className={styles.direction}>
                    {t('project.next')} <Icon name="arrow-right" />
                  </span>{' '}
                  <span className={styles.name}>{next.name}</span>
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}
      <ul role="list" aria-label={t('project.contact')} className={styles.contact}>
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
        <li>
          <ActionLink href={contact.email} kind="mail">
            {contact.email}
          </ActionLink>
        </li>
      </ul>
    </footer>
  );
}
