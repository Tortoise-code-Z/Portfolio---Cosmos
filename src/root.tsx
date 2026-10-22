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

// Provisional (F1): la página de error localizada llega en F2.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps): ReactNode {
  console.error('[root] Unhandled route error', error);
  const status = isRouteErrorResponse(error) ? error.status : null;

  return (
    <main>
      <h1>{status === 404 ? 'Lost in space' : 'Something went wrong'}</h1>
      <p>
        <a href="/">Back to the start</a>
      </p>
    </main>
  );
}
