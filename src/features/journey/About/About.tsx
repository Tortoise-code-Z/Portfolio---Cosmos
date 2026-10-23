import type { ReactNode } from 'react';

import { profile } from '~/content/profile';
import { cx } from '~/lib/css/cx/cx';
import { localize } from '~/lib/i18n/localize/localize';
import { useLocale, useT } from '~/lib/i18n/useT/useT';

import { ChapterPanel } from '../ChapterPanel/ChapterPanel';
import { ChapterSection } from '../ChapterSection/ChapterSection';
import { Eyebrow } from '../Eyebrow/Eyebrow';
import shared from '../shared.module.css';
import styles from './About.module.css';

const TITLE_ID = 'about-title';
const STRENGTHS_ID = 'about-strengths';

/** Capítulo 1 · Nebulosa · Sobre mí (docs/02-experiencia/capitulos/01-nebulosa.md). */
export function About(): ReactNode {
  const t = useT();
  const locale = useLocale();

  return (
    <ChapterSection index={1} labelledBy={TITLE_ID}>
      <ChapterPanel>
        <Eyebrow text={t('about.eyebrow')} />
        {/* Enfocable por código: la detonación del hero deja aquí el foco (00-singularidad.md). */}
        <h2 id={TITLE_ID} tabIndex={-1}>
          {t('about.title')}
        </h2>
        {profile.bio[locale].map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <h3 id={STRENGTHS_ID} className={cx(shared.label, styles.strengthsTitle)}>
          {t('about.strengths')}
        </h3>
        <ul
          role="list"
          aria-labelledby={STRENGTHS_ID}
          className={cx(shared.plainList, styles.tags)}
        >
          {profile.strengths.map((strength) => {
            const label = localize(locale, strength);
            return (
              <li key={label} className={styles.tag}>
                {label}
              </li>
            );
          })}
        </ul>
      </ChapterPanel>
    </ChapterSection>
  );
}
