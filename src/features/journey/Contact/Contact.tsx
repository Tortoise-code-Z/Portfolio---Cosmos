import type { ReactNode } from 'react';

import { profile } from '~/content/profile';
import { SITE_REPOSITORY } from '~/content/site';
import { cx } from '~/lib/css/cx/cx';
import { workModesText } from '~/lib/i18n/availability/availability';
import { formatNumber } from '~/lib/i18n/format/format';
import { localize } from '~/lib/i18n/localize/localize';
import { useLocale, useT } from '~/lib/i18n/useT/useT';
import { ActionLink } from '~/ui/ActionLink/ActionLink';

import { ChapterPanel } from '../ChapterPanel/ChapterPanel';
import { ChapterSection } from '../ChapterSection/ChapterSection';
import { Eyebrow } from '../Eyebrow/Eyebrow';
import shared from '../shared.module.css';
import styles from './Contact.module.css';

const TITLE_ID = 'contact-title';
const EDUCATION_ID = 'contact-education';

/**
 * Capítulo 4 · Tierra · Contacto (docs/02-experiencia/capitulos/04-tierra.md): disponibilidad (sale del
 * perfil), email, enlaces, CV si existe el del idioma, formación y pie. El botón de copiar el email llega
 * en F2.6; hasta entonces el email es un enlace `mailto:` seleccionable.
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
        <h2 id={TITLE_ID}>{t('contact.title')}</h2>
        <p>{t('contact.lead')}</p>

        {availability.openToWork ? (
          <ul role="list" className={cx(shared.dotted, styles.availability)} data-availability="">
            <li className={styles.open}>{t('nav.availability')}</li>
            <li>{workModesText(locale, availability.modes)}</li>
            {availability.openToRelocation ? <li>{t('contact.availability.relocation')}</li> : null}
            <li>{`${location.city}, ${localize(locale, location.country)}`}</li>
          </ul>
        ) : null}

        <a className={styles.email} href={`mailto:${contact.email}`}>
          {contact.email}
        </a>

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

        <h3 id={EDUCATION_ID} className={cx(shared.label, styles.educationTitle)}>
          {t('education.title')}
        </h3>
        <ul
          role="list"
          aria-labelledby={EDUCATION_ID}
          className={cx(shared.plainList, styles.orbits)}
        >
          {profile.education.map((item) => (
            <li key={item.id} className={styles.orbit}>
              <span className={styles.orbitTitle}>{item.title[locale]}</span>
              <span className={styles.orbitWhen}>
                {`${item.period} · ${t('education.hours', { n: formatNumber(locale, item.hours) })}`}
              </span>
              <span className={styles.orbitDetail}>
                {`${item.school} · ${item.skills.join(', ')}`}
              </span>
            </li>
          ))}
        </ul>

        <footer className={styles.footer}>
          {/*
           * Año: en la primera carga se ve el del build (con `suppressHydrationWarning`, React conserva
           * el texto pre-renderizado y no lo corrige al hidratar); si Contact se vuelve a montar en el
           * cliente (navegar y volver), el del navegador.
           */}
          <p suppressHydrationWarning>
            {t('footer.line', { year: String(new Date().getFullYear()) })}
          </p>
          <ActionLink href={SITE_REPOSITORY} kind="external">
            {t('footer.source')}
          </ActionLink>
        </footer>
      </ChapterPanel>
    </ChapterSection>
  );
}
