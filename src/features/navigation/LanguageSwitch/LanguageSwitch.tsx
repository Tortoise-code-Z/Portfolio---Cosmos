import { Fragment, type MouseEvent, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useStore } from 'zustand';

import { LOCALES, type Locale, type UiKey } from '~/content/types';
import { useLocale, useT } from '~/lib/i18n/useT/useT';
import { sceneStore, selectActiveChapter } from '~/stores/sceneStore/sceneStore';

import { chapterHref, isPlainClick } from '../goToChapter/goToChapter';
import styles from './LanguageSwitch.module.css';

/** El enlace del idioma en el que ya estás no navega con un clic normal (no te mueve ni ensucia «Atrás»). */
function stayHere(event: MouseEvent): void {
  if (isPlainClick(event)) event.preventDefault();
}

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
interface LanguageSwitchProps {
  /** La misma página en otro idioma, fuera del viaje (`/es/projects/chessmate`). Sin ella, el capítulo activo. */
  readonly pathFor?: ((locale: Locale) => string) | undefined;
}

export function LanguageSwitch({ pathFor }: LanguageSwitchProps): ReactNode {
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
            to={pathFor === undefined ? chapterHref(target, chapter) : pathFor(target)}
            className={styles.link}
            lang={target}
            hrefLang={target}
            aria-label={t(NAME_KEYS[target])}
            aria-current={target === locale ? 'true' : undefined}
            onClick={target === locale ? stayHere : undefined}
          >
            {target.toUpperCase()}
          </Link>
        </Fragment>
      ))}
    </div>
  );
}
