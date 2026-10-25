import { Fragment, type ReactNode } from 'react';
import { useLocation, useParams } from 'react-router';

import { profile } from '~/content/profile';
import { projects } from '~/content/projects';
import type { Locale, Project } from '~/content/types';
import { NotFoundPage } from '~/features/errors/NotFoundPage/NotFoundPage';
import { LanguageNotice } from '~/features/navigation/LanguageNotice/LanguageNotice';
import { QuickMissionDialog } from '~/features/navigation/QuickMissionDialog/QuickMissionDialog';
import { SkipLink } from '~/features/navigation/SkipLink/SkipLink';
import { TopBar } from '~/features/navigation/TopBar/TopBar';
import { PROJECT_TITLE_ID } from '~/features/project/ProjectHeader/ProjectHeader';
import { ProjectPage } from '~/features/project/ProjectPage/ProjectPage';
import { SITE_ORIGIN } from '~/lib/env/site/site';
import { localeFromPathname } from '~/lib/i18n/locale/locale';
import { isLowerCasePathname, projectPath } from '~/lib/i18n/paths/paths';
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

/**
 * La página de un proyecto (`features/project/ProjectPage`), o la 404 del idioma si el slug no existe o
 * la ruta lleva mayúsculas. Lleva la interfaz fija del viaje salvo el raíl y el HUD (no hay capítulos):
 * Skip → barra → contenido → sugerencia de idioma, y el modo misión rápida. `EN / ES` y la sugerencia
 * llevan a esta misma página en el otro idioma (docs/02-experiencia/pagina-proyecto.md → «Layout»).
 *
 * Ir de un proyecto a otro es la misma ruta con otro `:slug`: la clave rehace la página entera, así que
 * nada de la ficha anterior pasa a la nueva (el modo misión rápida abierto, un «Copied», el visor).
 */
export default function ProjectRoute(): ReactNode {
  const { pathname } = useLocation();
  const project = findProject(pathname, useParams().slug);

  // Slug desconocido o ruta con mayúsculas: la misma página que la 404, sin lanzar error.
  if (project === undefined) return <NotFoundPage />;

  const { slug } = project;
  const pathFor = (locale: Locale): string => projectPath(locale, slug);

  return (
    <Fragment key={slug}>
      <SkipLink targetId={PROJECT_TITLE_ID} />
      <TopBar pathFor={pathFor} />
      <ProjectPage project={project} />
      <QuickMissionDialog />
      <LanguageNotice pathFor={pathFor} />
    </Fragment>
  );
}
