import type { ReactNode } from 'react';

import { profile } from '~/content/profile';
import { cx } from '~/lib/css/cx/cx';
import { workModesText } from '~/lib/i18n/availability/availability';
import { localize } from '~/lib/i18n/localize/localize';
import { useLocale, useT } from '~/lib/i18n/useT/useT';
import { ActionLink } from '~/ui/ActionLink/ActionLink';
import { CopyButton } from '~/ui/CopyButton/CopyButton';

import { ChapterPanel } from '../ChapterPanel/ChapterPanel';
import { ChapterSection } from '../ChapterSection/ChapterSection';
import { Eyebrow } from '../Eyebrow/Eyebrow';
import shared from '../shared.module.css';
import styles from './Contact.module.css';

const TITLE_ID = 'contact-title';
const EMAIL_ID = 'contact-email';

/**
 * Capítulo 4 · Tierra · Contacto (docs/02-experiencia/capitulos/04-tierra.md): disponibilidad (sale del
 * perfil), email (enlace `mailto:` seleccionable y botón de copiar), enlaces y CV si existe el del idioma.
 * La formación y el pie del sitio se mudaron al epílogo (`CrewFile`, C.6).
 */
export function Contact(): ReactNode {
  const t = useT();
  const locale = useLocale();
  const { availability, contact, location } = profile;
  const cv = profile.cv[locale];

  return (
    <ChapterSection index={4} labelledBy={TITLE_ID}>
      <ChapterPanel wide>
        <Eyebrow text={t('contact.eyebrow')} />
        <h2 id={TITLE_ID} tabIndex={-1}>
          {t('contact.title')}
        </h2>
        <p>{t('contact.lead')}</p>

        {availability.openToWork ? (
          <ul role="list" className={cx(shared.dotted, styles.availability)} data-availability="">
            <li className={styles.open}>{t('nav.availability')}</li>
            {availability.availableNow ? <li>{t('contact.availability.now')}</li> : null}
            <li>{workModesText(locale, availability.modes)}</li>
            {availability.openToRelocation ? <li>{t('contact.availability.relocation')}</li> : null}
            <li>{`${location.city}, ${localize(locale, location.country)}`}</li>
            <li>{localize(locale, availability.workPermit)}</li>
          </ul>
        ) : null}

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
      </ChapterPanel>
    </ChapterSection>
  );
}
