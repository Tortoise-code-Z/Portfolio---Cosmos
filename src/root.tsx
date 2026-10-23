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

import { profile } from '~/content/profile';
import { localeFromPathname } from '~/lib/i18n/locale';
import { homePath } from '~/lib/i18n/paths';
import { translate } from '~/lib/i18n/translate';
import { useLocale, useT } from '~/lib/i18n/useT';
import { notFoundMeta } from '~/lib/seo/meta';
import { NotFoundPage } from '~/routes/not-found';

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

/**
 * Lo que se pinta mientras el cliente descarga el módulo de una ruta que el HTML no traía. Solo
 * pasa cuando el servidor da una 404 (`404.html`, ruta `*`) y el cliente casa otra ruta: un slug
 * desconocido (`/projects/no-existe`) o en mayúsculas (`/projects/Chessmate`; React Router 8.4 no
 * pasa `caseSensitive` a las rutas del cliente). Pinta la misma 404, así que coincide con el HTML
 * servido; sin esto React dejaba ese `<main>` y añadía otro (dos `<h1>`, viva S5 #1).
 */
export function HydrateFallback(): ReactNode {
  return <NotFoundPage />;
}

/**
 * Solo se pinta la `meta` de la ruta más profunda, y cada ruta tiene la suya: la de la raíz se ve
 * con un error (título de la página de error) o mientras se hidrata una 404 con otra ruta (ver
 * `HydrateFallback`). En ese caso llega `error: null` y devuelve la meta de la 404, la misma del
 * HTML servido; si no, React dejaba esas etiquetas y añadía otras (viva S5 #4).
 */
export function meta({ error, location }: Route.MetaArgs): Route.MetaDescriptors {
  const locale = localeFromPathname(location.pathname);
  if (error === undefined || error === null) return notFoundMeta({ locale, profile });
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
