import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { profile } from '~/content/profile';
import { localeFromPathname } from '~/lib/i18n/locale/locale';
import { homePath } from '~/lib/i18n/paths/paths';
import { useLocale, useT } from '~/lib/i18n/useT/useT';
import { notFoundMeta } from '~/lib/seo/meta/meta';

import type { Route } from './+types/not-found';

export function meta({ location }: Route.MetaArgs): Route.MetaDescriptors {
  return notFoundMeta({ locale: localeFromPathname(location.pathname), profile });
}

/**
 * Página «te has perdido» en el idioma del prefijo. La pintan la ruta `*`, las de página con un slug
 * desconocido o con mayúsculas, y en `root.tsx` el `ErrorBoundary` (con un 404) y el
 * `HydrateFallback`: el mismo HTML que el 404 pre-renderizado, así que hidrata sin errores. La
 * maquetación completa llega en F2.7.
 */
export function NotFoundPage(): ReactNode {
  const t = useT();
  const locale = useLocale();

  return (
    <main>
      <h1>{t('notFound.title')}</h1>
      <p>{t('notFound.body')}</p>
      <p>
        <Link to={homePath(locale)}>{t('notFound.cta')}</Link>
      </p>
    </main>
  );
}

export default function NotFound(): ReactNode {
  return <NotFoundPage />;
}
