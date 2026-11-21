import type { CSSProperties, ReactNode } from 'react';

import { INTERLUDE } from '~/content/chapters';
import { experience } from '~/content/experience';
import { formatList } from '~/lib/i18n/format/format';
import { localize } from '~/lib/i18n/localize/localize';
import { useLocale, useT } from '~/lib/i18n/useT/useT';

import { Transmission } from '../Transmission/Transmission';
import styles from './MissionLog.module.css';

const TITLE_ID = 'mission-log-title';
const MANIFEST_ID = 'mission-log-manifest';
const LOG_ID = 'mission-log-log';
const REFERENCE_ID = 'mission-log-reference';

/** Número de una entrada del registro, con dos cifras: 01, 02… */
function entryNumber(entry: number): string {
  return String(entry).padStart(2, '0');
}

/** Orden de una línea del teletipo (`--_line`): la escribe una tras otra al encenderse la transmisión. */
function lineStyle(line: number): CSSProperties {
  return { '--_line': line } as CSSProperties;
}

/**
 * Interludio 1 · Mission log (docs/02-experiencia/capitulos/interludio-1-mission-log.md): la experiencia de las
 * prácticas como el registro de la primera misión, en el canal ámbar. Ficha, manifiesto (herramientas, para qué y qué
 * entradas del registro les tocan), registro y la referencia de quien la firmó. Solo lo que hizo Víctor: nada de qué
 * es ni cómo está construido el producto de la empresa.
 */
export function MissionLog(): ReactNode {
  const t = useT();
  const locale = useLocale();
  const record = [
    [t('missionLog.source'), experience.company],
    [t('missionLog.role'), localize(locale, experience.role)],
    [t('missionLog.position'), localize(locale, experience.location)],
    [t('missionLog.window'), localize(locale, experience.period)],
    [t('missionLog.status'), localize(locale, experience.status)],
  ] as const;
  const firstLogLine = record.length + 1;

  return (
    <Transmission
      id="mission-log"
      anchor={INTERLUDE['mission-log'].anchor}
      channel="amber"
      channelLabel={t('missionLog.channel')}
      incoming={t('missionLog.incoming')}
      titleId={TITLE_ID}
      title={t('missionLog.title')}
      clock={t('missionLog.clock')}
    >
      <div className={styles.head}>
        <dl className={styles.record}>
          {record.map(([term, value], index) => (
            <div key={term} className={styles.field} data-line="" style={lineStyle(index)}>
              <dt>{term}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <p className={styles.summary}>{localize(locale, experience.summary)}</p>
      </div>

      <div className={styles.columns}>
        <section aria-labelledby={MANIFEST_ID} className={styles.manifest}>
          <h3 id={MANIFEST_ID} className={styles.heading}>
            {t('missionLog.manifest')}
          </h3>
          <ol role="list" aria-labelledby={MANIFEST_ID} className={styles.modules}>
            {experience.modules.map((module) => (
              <li key={module.id} className={styles.module}>
                <span className={styles.moduleName}>{localize(locale, module.name)}</span>
                <span className={styles.modulePurpose}>{localize(locale, module.purpose)}</span>
                <span className={styles.moduleEntries}>
                  {t('missionLog.entries', {
                    list: formatList(locale, module.entries.map(entryNumber), 'conjunction'),
                  })}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby={LOG_ID} className={styles.log}>
          <h3 id={LOG_ID} className={styles.heading}>
            {t('missionLog.log')}
          </h3>
          <ol role="list" aria-labelledby={LOG_ID} className={styles.entries}>
            {experience.log.map((entry, index) => (
              <li
                key={localize('en', entry.text)}
                className={styles.entry}
                data-line=""
                style={lineStyle(firstLogLine + index)}
              >
                <span className={styles.entryNumber}>{entryNumber(index + 1)}</span>
                <span className={styles.entryTag}>{localize(locale, entry.tag)}</span>
                <span className={styles.entryText}>{localize(locale, entry.text)}</span>
              </li>
            ))}
          </ol>
          <p
            className={styles.end}
            data-line=""
            style={lineStyle(firstLogLine + experience.log.length)}
          >
            {t('interlude.end')}
            <span className={styles.cursor} aria-hidden="true" />
          </p>
        </section>
      </div>

      {experience.reference === null ? null : (
        <figure aria-labelledby={REFERENCE_ID} className={styles.reference}>
          <h3 id={REFERENCE_ID} className={styles.heading}>
            {t('missionLog.reference')}
          </h3>
          <blockquote lang={locale}>
            <p>{t('missionLog.quote', { quote: localize(locale, experience.reference.quote) })}</p>
          </blockquote>
          <figcaption>
            {t('missionLog.by', {
              author: experience.reference.author,
              title: localize(locale, experience.reference.title),
            })}
          </figcaption>
        </figure>
      )}
    </Transmission>
  );
}
