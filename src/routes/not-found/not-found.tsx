import type { ReactNode } from 'react';

import { profile } from '~/content/profile';
import { NotFoundPage } from '~/features/errors/NotFoundPage/NotFoundPage';
import { localeFromPathname } from '~/lib/i18n/locale/locale';
import { notFoundMeta } from '~/lib/seo/meta/meta';

import type { Route } from './+types/not-found';

export function meta({ location }: Route.MetaArgs): Route.MetaDescriptors {
  return notFoundMeta({ locale: localeFromPathname(location.pathname), profile });
}

/** La ruta `*`: la 404 del idioma del prefijo (`features/errors/NotFoundPage`). */
export default function NotFound(): ReactNode {
  return <NotFoundPage />;
}
