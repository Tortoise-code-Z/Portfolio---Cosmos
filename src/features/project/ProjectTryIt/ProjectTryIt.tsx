import { useId, type ReactNode } from 'react';

import type { TryIt } from '~/content/types';
import { useLocale, useT } from '~/lib/i18n/useT/useT';
import { ActionLink } from '~/ui/ActionLink/ActionLink';
import { ArrowText } from '~/ui/ArrowText/ArrowText';
import { CopyButton } from '~/ui/CopyButton/CopyButton';

import styles from './ProjectTryIt.module.css';

interface ProjectTryItProps {
  readonly tryIt: TryIt;
  /** Guía completa en el README del proyecto. */
  readonly readme: string;
}

/**
 * «Try it» de la página de proyecto (pagina-proyecto.md → «Estructura», punto 8): introducción, pasos
 * numerados (las «→» del texto, con el icono), las cuentas de demo (públicas, de ejemplo: nunca una
 * credencial real) con un botón copiar por dato y el enlace a la guía del README.
 */
export function ProjectTryIt({ tryIt, readme }: ProjectTryItProps): ReactNode {
  const t = useT();
  const locale = useLocale();
  const idPrefix = useId();

  return (
    <>
      <p>{tryIt.intro[locale]}</p>
      <ol role="list" className={styles.steps}>
        {tryIt.steps.map((step) => (
          <li key={step.en} className={styles.step}>
            {/* Un solo hijo: el texto y sus flechas fluyen juntos junto al número. */}
            <span>
              <ArrowText text={step[locale]} />
            </span>
          </li>
        ))}
      </ol>
      {tryIt.credentials.length === 0 ? null : (
        <div className={styles.account}>
          <h3 className={styles.accountTitle}>{t('project.credentials')}</h3>
          <div className={styles.grid}>
            {tryIt.credentials.map((credential, index) => {
              const account = credential.label[locale];
              const userId = `${idPrefix}-${String(index)}-user`;
              const passwordId = `${idPrefix}-${String(index)}-password`;
              return (
                <div key={credential.user} className={styles.credential}>
                  <p className={styles.accountName}>{account}</p>
                  <dl className={styles.fields}>
                    <dt className={styles.field}>{t('project.credentials.user')}</dt>
                    <dd className={styles.row}>
                      <code id={userId} className={styles.value}>
                        {credential.user}
                      </code>
                      <CopyButton
                        text={credential.user}
                        targetId={userId}
                        subject={t('project.copy.user', { account })}
                      />
                    </dd>
                    <dt className={styles.field}>{t('project.credentials.password')}</dt>
                    <dd className={styles.row}>
                      <code id={passwordId} className={styles.value}>
                        {credential.password}
                      </code>
                      <CopyButton
                        text={credential.password}
                        targetId={passwordId}
                        subject={t('project.copy.password', { account })}
                      />
                    </dd>
                  </dl>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <p>
        <ActionLink href={readme} kind="external">
          {t('project.readme')}
        </ActionLink>
      </p>
    </>
  );
}
