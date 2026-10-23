import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useStore } from 'zustand';

import { LOCALES, type Locale, type UiKey } from '~/content/types';
import { useLocale, useT } from '~/lib/i18n/useT/useT';
import { sceneStore, selectActiveChapter } from '~/stores/sceneStore/sceneStore';

import { chapterHref } from '../goToChapter/goToChapter';
import styles from './LanguageSwitch.module.css';

const NAME_KEYS = {
  en: 'nav.langEn',
  es: 'nav.langEs',
} as const satisfies Readonly<Record<Locale, UiKey>>;

/**
 * Selector EN / ES de la barra (docs/02-experiencia/navegacion.md → «Idioma»; componentes.md →
 * «Barra superior»): un par de enlaces a la misma página en cada idioma, que conservan el capítulo en
 * el que estás aunque la URL no lleve su ancla (el activo según el scroll). El idioma actual va
 * subrayado en ámbar y con `aria-current="true"`. Cada enlace se nombra en su propio idioma.
 */
export function LanguageSwitch(): ReactNode {
  const t = useT();
  const locale = useLocale();
  const chapter = useStore(sceneStore, selectActiveChapter);

  return (
    <div role="group" aria-label={t('nav.language')} className={styles.switch}>
      {LOCALES.map((target, index) => (
        <Fragment key={target}>
          {index > 0 && (
            <span aria-hidden="true" className={styles.separator}>
              /
            </span>
          )}
          <Link
            to={chapterHref(target, chapter)}
            className={styles.link}
            lang={target}
            hrefLang={target}
            aria-label={t(NAME_KEYS[target])}
            aria-current={target === locale ? 'true' : undefined}
          >
            {target.toUpperCase()}
          </Link>
        </Fragment>
      ))}
    </div>
  );
}
