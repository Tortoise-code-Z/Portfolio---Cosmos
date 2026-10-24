import type { ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router';

import { profile } from '~/content/profile';
import { projects } from '~/content/projects';
import type { Project } from '~/content/types';
import { NotFoundPage } from '~/features/errors/NotFoundPage/NotFoundPage';
import { SITE_ORIGIN } from '~/lib/env/site/site';
import { localeFromPathname } from '~/lib/i18n/locale/locale';
import { homePath, isLowerCasePathname } from '~/lib/i18n/paths/paths';
import { useLocale, useT } from '~/lib/i18n/useT/useT';
import { notFoundMeta, projectMeta } from '~/lib/seo/meta/meta';

import type { Route } from './+types/project';

/**
 * El proyecto de la ruta, o `undefined` (404 sin redirección): el slug tiene que coincidir exacto y
 * la ruta entera ir en minúsculas (`/projects/Chessmate` y `/PROJECTS/chessmate` son 404).
 */
function findProject(pathname: string, slug: string | undefined): Project | undefined {
  if (!isLowerCasePathname(pathname)) return undefined;
  return projects.find((project) => project.slug === slug);
}

export function meta({ location, params }: Route.MetaArgs): Route.MetaDescriptors {
  const locale = localeFromPathname(location.pathname);
  const project = findProject(location.pathname, params.slug);
  return project === undefined
    ? notFoundMeta({ locale, profile })
    : projectMeta({ origin: SITE_ORIGIN, locale, profile, project });
}

// Página mínima: nombre, tagline, resumen y vuelta al caparazón. F2.7 la completa
// sin tocar la meta. Los datos van en el JS de esta ruta (deuda en STATE.md: se mide en F2.4).
export default function ProjectPage(): ReactNode {
  const t = useT();
  const locale = useLocale();
  const { pathname } = useLocation();
  const project = findProject(pathname, useParams().slug);

  // Slug desconocido o ruta con mayúsculas: la misma página que la 404, sin lanzar error.
  if (project === undefined) return <NotFoundPage />;

  return (
    <main>
      <h1>{project.name}</h1>
      <p>{project.tagline[locale]}</p>
      <p>{project.summary[locale]}</p>
      <p>
        <Link to={`${homePath(locale)}#projects`}>{t('project.back')}</Link>
      </p>
    </main>
  );
}
