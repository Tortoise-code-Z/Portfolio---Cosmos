import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { NavigationType, useLocation, useNavigationType } from 'react-router';

import { CHAPTER_ANCHORS } from '~/content/chapters';
import { projectEntries } from '~/content/projects/entries';
import { cx } from '~/lib/css/cx/cx';
import { useT } from '~/lib/i18n/useT/useT';
import { takeVisitedProject } from '~/stores/uiStore/uiStore';

import { ChapterPanel } from '../ChapterPanel/ChapterPanel';
import { ChapterSection } from '../ChapterSection/ChapterSection';
import { Eyebrow } from '../Eyebrow/Eyebrow';
import { ProjectRow } from '../ProjectRow/ProjectRow';
import shared from '../shared.module.css';
import styles from './Projects.module.css';

const TITLE_ID = 'projects-title';

/** Ancla del capítulo: a ella llevan «Back to the shell» y «Projects» desde una página de proyecto. */
const PROJECTS_HASH = `#${CHAPTER_ANCHORS[3] ?? 'projects'}`;

/**
 * Al volver de una página de proyecto (docs/02-experiencia/navegacion.md → «Volver desde una página de
 * proyecto»), el foco queda en «View project» de la fila de ese proyecto, que se resalta como «hot»
 * (`:focus-within`). Vale para el botón Atrás del navegador (el scroll lo restaura React Router: el foco
 * no lo mueve) y para los enlaces a `#projects` («Back to the shell», «Projects» de la barra). Si se
 * vuelve a otro sitio (el logo, `#contact`), no se toca el foco. Desde F5, además, se ilumina la placa.
 */
function useFocusVisitedRow(list: RefObject<HTMLUListElement | null>): void {
  const navigationType = useNavigationType();
  const { hash } = useLocation();

  useEffect(() => {
    const slug = takeVisitedProject();
    if (slug === null) return;
    const back = navigationType === NavigationType.Pop;
    if (!back && hash !== PROJECTS_HASH) return;
    const link = list.current?.querySelector<HTMLAnchorElement>(
      `[data-project="${CSS.escape(slug)}"] a[href]`,
    );
    link?.focus({ preventScroll: back });
  }, [list, navigationType, hash]);
}

/**
 * Capítulo 3 · Tortuga cósmica · Proyectos (docs/02-experiencia/capitulos/03-tortuga.md): una fila por
 * proyecto en orden de lectura, con enlaces reales (funcionan sin escena). Al volver de una página de
 * proyecto, el foco queda en su fila.
 */
export function Projects(): ReactNode {
  const t = useT();
  const ordered = [...projectEntries].sort((a, b) => a.order - b.order);
  const list = useRef<HTMLUListElement>(null);
  useFocusVisitedRow(list);

  return (
    <ChapterSection index={3} labelledBy={TITLE_ID}>
      <ChapterPanel>
        <Eyebrow text={t('projects.eyebrow')} />
        <h2 id={TITLE_ID} tabIndex={-1}>
          {t('projects.title')}
        </h2>
        <p>{t('projects.lead')}</p>
        <ul ref={list} role="list" className={cx(shared.plainList, styles.rows)}>
          {ordered.map((project) => (
            <ProjectRow key={project.slug} project={project} />
          ))}
        </ul>
      </ChapterPanel>
    </ChapterSection>
  );
}
