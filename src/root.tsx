import type { ReactNode } from 'react';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from 'react-router';

import anybodyLatin from '@fontsource-variable/anybody/files/anybody-latin-standard-normal.woff2?url';
import geologicaLatin from '@fontsource-variable/geologica/files/geologica-latin-wght-normal.woff2?url';

import { localeFromPathname } from '~/lib/i18n/locale';
import { homePath } from '~/lib/i18n/paths';
import { translate } from '~/lib/i18n/translate';
import { useLocale, useT } from '~/lib/i18n/useT';

import '~/styles/fonts.css';
import '~/styles/tokens.css';
import '~/styles/global.css';

import type { Route } from './+types/root';

/**
 * Precarga las dos fuentes que pinta la primera pantalla (título display y texto), para que
 * lleguen antes y el cambio de la fuente de reserva a la buena se note menos.
 * Mismos archivos que `styles/fonts.css`: Vite los sirve una sola vez con el mismo hash.
 */
export const links: Route.LinksFunction = () =>
  [anybodyLatin, geologicaLatin].map((href) => ({
    rel: 'preload',
    href,
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous',
  }));

export function Layout({ children }: { readonly children: ReactNode }): ReactNode {
  const { pathname } = useLocation();

  return (
    <html lang={localeFromPathname(pathname)}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="color-scheme" content="dark" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App(): ReactNode {
  return <Outlet />;
}

/** Título de la página de error de la raíz: la `meta` de la ruta más profunda que se pinta. */
export function meta({ error, location }: Route.MetaArgs): Route.MetaDescriptors {
  if (error === undefined) return [];
  const locale = localeFromPathname(location.pathname);
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return [{ title: translate(locale, notFound ? 'meta.notFound.title' : 'meta.error.title') }];
}

/** Error no previsto en cualquier ruta: aviso en el idioma de la página y vuelta al inicio. */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps): ReactNode {
  console.error('[root] Unhandled route error', error);
  const t = useT();
  const locale = useLocale();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <main>
      <h1>{t(notFound ? 'notFound.title' : 'error.title')}</h1>
      <p>{t(notFound ? 'notFound.body' : 'error.body')}</p>
      <p>
        <a href={homePath(locale)}>{t('notFound.cta')}</a>
      </p>
    </main>
  );
}
