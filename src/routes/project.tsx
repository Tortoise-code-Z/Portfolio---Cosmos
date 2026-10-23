import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';

import { profile } from '~/content/profile';
import { projects } from '~/content/projects';
import type { Project } from '~/content/types';
import { SITE_ORIGIN } from '~/lib/env/site';
import { localeFromPathname } from '~/lib/i18n/locale';
import { homePath } from '~/lib/i18n/paths';
import { useLocale, useT } from '~/lib/i18n/useT';
import { notFoundMeta, projectMeta } from '~/lib/seo/meta';

import { NotFoundPage } from './not-found';
import type { Route } from './+types/project';

/** El slug tiene que coincidir exacto (en minúsculas): `/projects/Chessmate` es 404, sin redirección. */
function findProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export function meta({ location, params }: Route.MetaArgs): Route.MetaDescriptors {
  const locale = localeFromPathname(location.pathname);
  const project = findProject(params.slug);
  return project === undefined
    ? notFoundMeta({ locale, profile })
    : projectMeta({ origin: SITE_ORIGIN, locale, profile, project });
}

// Página mínima (EST-F2-3-1): nombre, tagline, resumen y vuelta al caparazón. F2.7 la completa
// sin tocar la meta. Los datos van en el JS de esta ruta (EST-F2-3-3, se mide en F2.4).
export default function ProjectPage(): ReactNode {
  const t = useT();
  const locale = useLocale();
  const project = findProject(useParams().slug ?? '');

  // Slug desconocido: la misma página que la 404, sin lanzar error (viva S4 #39).
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
