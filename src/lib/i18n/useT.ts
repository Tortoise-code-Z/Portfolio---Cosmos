import { useMemo } from 'react';
import { useLocation } from 'react-router';

import type { Locale, UiKey } from '~/content/types';

import { localeFromPathname } from './locale';
import { translate, type TranslateParams } from './translate';

/** Idioma de la página actual, sacado del prefijo de la ruta (ADR-006). */
export function useLocale(): Locale {
  return localeFromPathname(useLocation().pathname);
}

export type Translate = <K extends UiKey>(key: K, ...params: TranslateParams<K>) => string;

/** `translate` atado al idioma de la página: `const t = useT(); t('nav.skip')`. */
export function useT(): Translate {
  const locale = useLocale();
  return useMemo<Translate>(
    () =>
      (key, ...params) =>
        translate(locale, key, ...params),
    [locale],
  );
}
