import type { CSSProperties, ReactNode } from 'react';

import { EPILOGUE } from '~/content/chapters';
import { profile } from '~/content/profile';
import { SITE_REPOSITORY } from '~/content/site';
import { cx } from '~/lib/css/cx/cx';
import { workModesText } from '~/lib/i18n/availability/availability';
import { formatNumber } from '~/lib/i18n/format/format';
import { localize } from '~/lib/i18n/localize/localize';
import { useLocale, useT } from '~/lib/i18n/useT/useT';
import { ActionLink } from '~/ui/ActionLink/ActionLink';
import { CopyButton } from '~/ui/CopyButton/CopyButton';

import shared from '../shared.module.css';
import { Transmission } from '../Transmission/Transmission';
import styles from './CrewFile.module.css';

const TITLE_ID = 'crew-file-title';
const EMAIL_ID = 'crew-file-email';
const SEPARATOR = ' · ';

/** El orden de la línea en el teletipo de la transmisión (`[data-line]`, `--_line`). */
function lineStyle(line: number): CSSProperties {
  return { '--_line': line } as CSSProperties;
}

/**
 * Capítulo 5 · Crew file, el epílogo (docs/02-experiencia/capitulos/05-crew-file.md): el último capítulo, en el canal
 * verde. La ficha (puesto, base, permiso de trabajo, disponibilidad, idiomas y formación) es una lista de definiciones
 * real; «Download CV» va justo después del título (lo primero que se busca), y debajo el email con «Copy» y el pie del
 * sitio. El retrato en partículas llega en C.6b: hasta entonces la escena se queda en la Tierra.
 */
export function CrewFile(): ReactNode {
  const t = useT();
  const locale = useLocale();
  const { availability, contact, location } = profile;
  const cv = profile.cv[locale];

  const record: readonly (readonly [string, ReactNode])[] = [
    [t('crewFile.role'), `${localize(locale, profile.role)}${SEPARATOR}${t('crewFile.stack')}`],
    [t('crewFile.base'), `${location.city}, ${localize(locale, location.country)}`],
    [t('crewFile.rightToWork'), localize(locale, availability.workPermit)],
    [
      t('crewFile.availability'),
      [
        ...(availability.availableNow ? [t('contact.availability.now')] : []),
        workModesText(locale, availability.modes),
        ...(availability.openToRelocation ? [t('contact.availability.relocation')] : []),
      ].join(SEPARATOR),
    ],
    [
      t('crewFile.languages'),
      profile.languages.map((language) => localize(locale, language)).join(SEPARATOR),
    ],
    [
      t('crewFile.training'),
      <ul key="training" role="list" className={cx(shared.plainList, styles.training)}>
        {profile.education.map((item) => (
          <li key={item.id}>
            <span className={styles.trainingTitle}>{item.title[locale]}</span>
            <span className={styles.trainingDetail}>
              {[
                item.school,
                t('education.hours', { n: formatNumber(locale, item.hours) }),
                ...(item.grade === undefined ? [] : [localize(locale, item.grade)]),
              ].join(SEPARATOR)}
            </span>
          </li>
        ))}
      </ul>,
    ],
  ];

  return (
    <Transmission
      chapter={EPILOGUE}
      channel="green"
      channelLabel={t('crewFile.channel')}
      stripEnd={t('crewFile.closed')}
      incoming={t('crewFile.incoming')}
      titleId={TITLE_ID}
      title={t('crewFile.title')}
      footer={t('crewFile.footer')}
    >
      <p className={styles.lead} data-line="" style={lineStyle(0)}>
        {t('crewFile.lead')}
      </p>
      {cv === null ? null : (
        <p className={styles.cv} data-line="" style={lineStyle(1)}>
          <ActionLink href={cv} kind="download">
            {t('contact.cv')}
          </ActionLink>
        </p>
      )}
      <dl className={styles.record}>
        {record.map(([term, value], index) => (
          <div key={term} className={styles.field} data-line="" style={lineStyle(2 + index)}>
            <dt>{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className={styles.emailRow} data-line="" style={lineStyle(2 + record.length)}>
        <a id={EMAIL_ID} className={styles.email} href={`mailto:${contact.email}`}>
          {contact.email}
        </a>
        <CopyButton text={contact.email} targetId={EMAIL_ID} subject={t('contact.copy.subject')} />
      </div>
      <div className={styles.site}>
        {/*
         * Año: en la primera carga se ve el del build (con `suppressHydrationWarning`, React conserva el texto
         * pre-renderizado y no lo corrige al hidratar); si se vuelve a montar en el cliente, el del navegador.
         */}
        <p suppressHydrationWarning>
          {t('footer.line', { year: String(new Date().getFullYear()) })}
        </p>
        <ActionLink href={SITE_REPOSITORY} kind="external">
          {t('footer.source')}
        </ActionLink>
      </div>
    </Transmission>
  );
}
