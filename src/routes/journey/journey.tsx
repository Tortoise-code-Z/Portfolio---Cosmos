import type { ReactNode } from 'react';
import { useLocation } from 'react-router';

import { profile } from '~/content/profile';
import { skillGroups } from '~/content/skills';
import { About } from '~/features/journey/About/About';
import { Contact } from '~/features/journey/Contact/Contact';
import { Hero } from '~/features/journey/Hero/Hero';
import { Projects } from '~/features/journey/Projects/Projects';
import { Skills } from '~/features/journey/Skills/Skills';
import { SITE_ORIGIN } from '~/lib/env/site/site';
import { localeFromPathname } from '~/lib/i18n/locale/locale';
import { isLowerCasePathname } from '~/lib/i18n/paths/paths';
import { homeMeta, notFoundMeta } from '~/lib/seo/meta/meta';

import { NotFoundPage } from '../not-found/not-found';
import type { Route } from './+types/journey';

export function meta({ location }: Route.MetaArgs): Route.MetaDescriptors {
  const locale = localeFromPathname(location.pathname);
  // `/ES` casa esta ruta en el cliente, pero es 404 (ver `isLowerCasePathname`).
  if (!isLowerCasePathname(location.pathname)) return notFoundMeta({ locale, profile });
  return homeMeta({ origin: SITE_ORIGIN, locale, profile, skillGroups });
}

/** El viaje: los cinco capítulos en orden (docs/02-experiencia/README.md), sin escena (F2.4). */
export default function Journey(): ReactNode {
  const { pathname } = useLocation();

  if (!isLowerCasePathname(pathname)) return <NotFoundPage />;

  return (
    <main>
      <Hero />
      <About />
      <Skills />
      <Projects />
      <Contact />
    </main>
  );
}
