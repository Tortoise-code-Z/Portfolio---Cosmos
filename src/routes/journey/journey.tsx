import type { ReactNode } from 'react';
import { useLocation } from 'react-router';

import { profile } from '~/content/profile';
import { skillGroups } from '~/content/skills';
import { SITE_ORIGIN } from '~/lib/env/site/site';
import { localeFromPathname } from '~/lib/i18n/locale/locale';
import { isLowerCasePathname } from '~/lib/i18n/paths/paths';
import { useT } from '~/lib/i18n/useT/useT';
import { homeMeta, notFoundMeta } from '~/lib/seo/meta/meta';

import { NotFoundPage } from '../not-found/not-found';
import type { Route } from './+types/journey';

export function meta({ location }: Route.MetaArgs): Route.MetaDescriptors {
  const locale = localeFromPathname(location.pathname);
  // `/ES` casa esta ruta en el cliente, pero es 404 (ver `isLowerCasePathname`).
  if (!isLowerCasePathname(location.pathname)) return notFoundMeta({ locale, profile });
  return homeMeta({ origin: SITE_ORIGIN, locale, profile, skillGroups });
}

// Provisional hasta F2.4: página «hello» (nombre y frase del hero), ya con los textos del contenido.
// En F2.4 esta ruta monta los cinco capítulos.
export default function Journey(): ReactNode {
  const t = useT();
  const { pathname } = useLocation();

  if (!isLowerCasePathname(pathname)) return <NotFoundPage />;

  return (
    <main>
      <h1>{profile.name}</h1>
      <p>{t('hero.lead')}</p>
    </main>
  );
}
