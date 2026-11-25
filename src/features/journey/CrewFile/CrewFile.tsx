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
/** Los campos de la ficha que van a la izquierda del visor en escritorio ancho (el resto, a la derecha). */
const LEFT_FIELDS = 3;
const EMAIL_ID = 'crew-file-email';
const SEPARATOR = ' · ';

/** El orden de la línea en el teletipo de la transmisión (`[data-line]`, `--_line`). */
function lineStyle(line: number): CSSProperties {
  return { '--_line': line } as CSSProperties;
}

/**
 * Capítulo 5 · Crew file, el epílogo (docs/02-experiencia/capitulos/05-crew-file.md): el último capítulo, en el canal
 * verde, abierto sobre la escena (`open`): el retrato en partículas se ve en el visor del centro (decorativo: esquinas
 * y «Identity verified», que ya dice el aviso de arriba). La ficha (puesto, base, permiso de trabajo, disponibilidad,
 * idiomas y formación) es una lista de definiciones real; en el DOM, «Download CV» va justo después del visor (lo
 * primero que se busca en móvil), y después la ficha, el email con «Copy» y el pie del sitio. En escritorio ancho la
 * ficha se reparte a los lados del visor y «Download CV» baja junto al email (CrewFile.module.css). En su llegada
 * (C.7), las esquinas que bajan de la ventana encajan en el marco del visor (`data-arrival-target`) y, al encajar, la
 * ficha se escribe y las líneas guía salen del visor.
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
    // Como en Contacto y la misión rápida: solo si busca trabajo (lo demás sigue siendo verdad).
    ...(availability.openToWork
      ? [
          [
            t('crewFile.availability'),
            [
              ...(availability.availableNow ? [t('contact.availability.now')] : []),
              workModesText(locale, availability.modes),
              ...(availability.openToRelocation ? [t('contact.availability.relocation')] : []),
            ].join(SEPARATOR),
          ] as const,
        ]
      : []),
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
      className={styles.crewFile}
      open
    >
      <p className={styles.lead} data-line="" style={lineStyle(0)}>
        {t('crewFile.lead')}
      </p>
      <div className={styles.visor} aria-hidden="true" data-crew-visor="">
        {/* El destino de la llegada: las esquinas que bajan de la ventana se cierran sobre este marco. */}
        <div className={styles.frame} data-arrival-target="">
          <span className={styles.verified} style={lineStyle(1 + record.length)}>
            {t('crewFile.verified')}
          </span>
        </div>
      </div>
      {cv === null ? null : (
        <p className={styles.cv} data-line="" style={lineStyle(1)}>
          <ActionLink href={cv} kind="download">
            {t('contact.cv')}
          </ActionLink>
        </p>
      )}
      <dl className={styles.record}>
        {record.map(([term, value], index) => (
          <div
            key={term}
            className={cx(styles.field, index < LEFT_FIELDS ? styles.left : styles.right)}
            data-line=""
            style={lineStyle(2 + index)}
          >
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
      <footer className={styles.site}>
        {/*
         * Año: en la primera carga se ve el del build (con `suppressHydrationWarning`, React conserva el texto
         * pre-renderizado y no lo corrige al hidratar); si se vuelve a montar en el cliente, el del navegador. La
         * captura del epílogo lo tapa (`data-site-year`): cambia cada 1 de enero.
         */}
        <p suppressHydrationWarning data-site-year="">
          {t('footer.line', { year: String(new Date().getFullYear()) })}
        </p>
        <ActionLink href={SITE_REPOSITORY} kind="external">
          {t('footer.source')}
        </ActionLink>
      </footer>
    </Transmission>
  );
}
