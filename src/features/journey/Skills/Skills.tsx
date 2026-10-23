import type { ReactNode } from 'react';

import { skillGroups } from '~/content/skills';
import { cx } from '~/lib/css/cx/cx';
import { localize } from '~/lib/i18n/localize/localize';
import { useLocale, useT } from '~/lib/i18n/useT/useT';

import { ChapterPanel } from '../ChapterPanel/ChapterPanel';
import { ChapterSection } from '../ChapterSection/ChapterSection';
import { Eyebrow } from '../Eyebrow/Eyebrow';
import shared from '../shared.module.css';
import styles from './Skills.module.css';

const TITLE_ID = 'skills-title';

/**
 * Capítulo 2 · Galaxia · Habilidades (docs/02-experiencia/capitulos/02-galaxia.md). El panel es la
 * versión completa y accesible: los 4 grupos con todas sus skills. Sin escena aún, un grupo solo se
 * resalta con el puntero o con el foco dentro; encender su constelación llega en F4.
 */
export function Skills(): ReactNode {
  const t = useT();
  const locale = useLocale();

  return (
    <ChapterSection index={2} labelledBy={TITLE_ID}>
      <ChapterPanel>
        <Eyebrow text={t('skills.eyebrow')} />
        <h2 id={TITLE_ID}>{t('skills.title')}</h2>
        {/* Las dos frases van en el HTML; el CSS muestra la del tipo de puntero (sin JS, sin saltos). */}
        <p className={styles.leadPointer}>{t('skills.lead.pointer')}</p>
        <p className={styles.leadTouch}>{t('skills.lead.touch')}</p>
        <ul className={cx(shared.plainList, styles.groups)}>
          {skillGroups.map((group) => {
            const titleId = `skills-group-${group.id}`;
            return (
              <li key={group.id} className={styles.group} data-group={group.id}>
                <h3 id={titleId} className={cx(shared.label, styles.groupTitle)}>
                  {localize(locale, group.title)}
                </h3>
                <ul aria-labelledby={titleId} className={cx(shared.dotted, styles.skills)}>
                  {group.skills.map((skill) => (
                    <li key={skill.id}>{localize(locale, skill.label)}</li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </ChapterPanel>
    </ChapterSection>
  );
}
