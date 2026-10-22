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

import { localeFromPathname } from '~/lib/i18n/locale';

import type { Route } from './+types/root';

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
