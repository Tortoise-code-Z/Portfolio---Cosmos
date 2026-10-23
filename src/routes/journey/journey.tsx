import type { ReactNode } from 'react';

import { profile } from '~/content/profile';
import { skillGroups } from '~/content/skills';
import { SITE_ORIGIN } from '~/lib/env/site/site';
import { localeFromPathname } from '~/lib/i18n/locale/locale';
import { useT } from '~/lib/i18n/useT/useT';
import { homeMeta } from '~/lib/seo/meta/meta';

import type { Route } from './+types/journey';

export function meta({ location }: Route.MetaArgs): Route.MetaDescriptors {
  return homeMeta({
    origin: SITE_ORIGIN,
    locale: localeFromPathname(location.pathname),
    profile,
    skillGroups,
  });
}

// Provisional hasta F2.4: página «hello» (nombre y frase del hero), ya con los textos del contenido.
// En F2.4 esta ruta monta los cinco capítulos.
export default function Journey(): ReactNode {
  const t = useT();

  return (
    <main>
      <h1>{profile.name}</h1>
      <p>{t('hero.lead')}</p>
    </main>
  );
}
