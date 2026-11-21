import type { ReactNode } from 'react';

import { profile } from '~/content/profile';
import { useLocale, useT } from '~/lib/i18n/useT/useT';

import { ChapterPanel } from '../ChapterPanel/ChapterPanel';
import { ChapterSection } from '../ChapterSection/ChapterSection';
import { Eyebrow } from '../Eyebrow/Eyebrow';

const TITLE_ID = 'about-title';

/**
 * Capítulo 1 · Nebulosa · Sobre mí (docs/02-experiencia/capitulos/01-nebulosa.md): la bio. Las fortalezas salieron
 * en la fase C (ADR-034); la experiencia va justo después, en el Mission log.
 */
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
      </ChapterPanel>
    </ChapterSection>
  );
}
