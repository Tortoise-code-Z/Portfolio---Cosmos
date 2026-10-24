import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useStore } from 'zustand';

import type { Locale } from '~/content/types';
import { languageSuggestion } from '~/lib/i18n/locale/locale';
import { translate } from '~/lib/i18n/translate/translate';
import { useLocale } from '~/lib/i18n/useT/useT';
import { readStorage, writeStorage } from '~/lib/storage/storage/storage';
import { sceneStore, selectActiveChapter } from '~/stores/sceneStore/sceneStore';
import { ButtonOutline } from '~/ui/ButtonOutline/ButtonOutline';
import { Notice } from '~/ui/Notice/Notice';

import { chapterHref } from '../goToChapter/goToChapter';
import styles from './LanguageNotice.module.css';

/** Se recuerda que ya se contestó (ir al otro idioma o «No, thanks»): no vuelve a salir. */
export const LANGUAGE_NOTICE_KEY = 'cosmos.languageNotice';
const ANSWERED = 'answered';

/**
 * Apunta que ya se contestó. Lo usan el propio aviso y el selector `EN / ES`: elegir idioma a mano es
 * una respuesta explícita y el aviso no vuelve a ofrecer el otro.
 */
export function rememberLanguageAnswer(): void {
  writeStorage(LANGUAGE_NOTICE_KEY, ANSWERED);
}

/**
 * El idioma del navegador (`languagechange`) y lo guardado (`storage`) no se escuchan a propósito: basta con
 * leerlos al hidratar (contestar en otra pestaña se nota al recargar).
 */
function noSubscription(): () => void {
  return () => undefined;
}

/** En el pre-render no hay navegador: nunca se sugiere nada (el aviso aparece al hidratar). */
function nothingOnServer(): null {
  return null;
}

/**
 * Sugerencia de idioma (docs/02-experiencia/navegacion.md → «Idioma»): en una página en inglés, si el
 * navegador prefiere el español, un aviso discreto abajo lo ofrece. Habla en el idioma que ofrece
 * (`lang`): «Esta página también está en español.», «Ver en español» (la misma página en español, con
 * el capítulo en el que estás) y «No, gracias». Aceptar o descartar se recuerda y no vuelve a salir.
 * Nunca cambia el idioma solo (ADR-006).
 */
interface LanguageNoticeProps {
  /** La misma página en el idioma que se ofrece, fuera del viaje. Sin ella, el capítulo activo. */
  readonly pathFor?: (locale: Locale) => string;
}

export function LanguageNotice({ pathFor }: LanguageNoticeProps): ReactNode {
  const locale = useLocale();
  const chapter = useStore(sceneStore, selectActiveChapter);
  const suggested = useSyncExternalStore<Locale | null>(
    noSubscription,
    () =>
      readStorage(LANGUAGE_NOTICE_KEY) === null
        ? languageSuggestion(locale, navigator.languages)
        : null,
    nothingOnServer,
  );
  const [answered, setAnswered] = useState(false);
  const target = answered ? null : suggested;

  function answer(): void {
    rememberLanguageAnswer();
    setAnswered(true);
  }

  return (
    <Notice open={target !== null} lang={target ?? undefined}>
      {target === null ? null : (
        <>
          <p>{translate(target, 'langNotice.text')}</p>
          <div className={styles.actions}>
            <Link
              to={pathFor === undefined ? chapterHref(target, chapter) : pathFor(target)}
              hrefLang={target}
              className={styles.accept}
              onClick={answer}
            >
              {translate(target, 'langNotice.accept')}
            </Link>
            <ButtonOutline onClick={answer}>
              {translate(target, 'langNotice.dismiss')}
            </ButtonOutline>
          </div>
        </>
      )}
    </Notice>
  );
}
