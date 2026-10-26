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
import { NotFoundPage } from '~/features/errors/NotFoundPage/NotFoundPage';
import { SceneMount } from '~/features/scene-mount/SceneMount/SceneMount';
import { localeFromPathname } from '~/lib/i18n/locale/locale';
import { homePath } from '~/lib/i18n/paths/paths';
import { translate } from '~/lib/i18n/translate/translate';
import { useLocale, useT } from '~/lib/i18n/useT/useT';
import { notFoundMeta } from '~/lib/seo/meta/meta';

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
        <SceneMount />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

/**
 * Las rutas. La escena va en `Layout`, detrás de ellas: se monta una sola vez y no se recrea al navegar
 * ni al pasar por `HydrateFallback` o el `ErrorBoundary`, que `Layout` también envuelve; así el HTML de
 * cualquier página (también el `404.html`) lleva siempre su región de aviso, y solo una
 * (docs/05-tecnico/arquitectura.md → «Carga de la escena»).
 */
export default function App(): ReactNode {
  return <Outlet />;
}

/**
 * Lo que se pinta mientras el cliente descarga el módulo de una ruta que el HTML servido no traía:
 * pasa cuando ese HTML no es el de la ruta que casa el cliente. Casi siempre es el `404.html` con un
 * slug desconocido (`/projects/no-existe`) o una ruta con mayúsculas (`/projects/Chessmate`, `/ES`;
 * React Router 8.4 no pasa `caseSensitive` a las rutas del cliente). Pinta la misma 404 y `Layout` le
 * añade la escena, como al pre-renderizar, así que coincide con ese HTML; sin esto React dejaba su
 * `<main>` y añadía otro (dos `<h1>`). No es el único
 * caso: `/index.html` sirve la home y el cliente casa la ruta `*` (en F7, `cleanUrls` en Vercel).
 */
export function HydrateFallback(): ReactNode {
  return <NotFoundPage />;
}

/** Sin error (`null` o `undefined`) o con un 404 de ruta: se pinta la 404. */
function isNotFound(error: unknown): boolean {
  return (
    error === undefined || error === null || (isRouteErrorResponse(error) && error.status === 404)
  );
}

/**
 * Meta de reserva. React Router pinta la `meta` de la ruta más profunda que la exporta, así que esta
 * se ve con un error o mientras se hidrata una 404 con otra ruta (ver `HydrateFallback`, llega
 * `error: null`): la de la 404, la misma del HTML servido. Una ruta que no exporte `meta` heredaría
 * esta, con `noindex`: todas exportan la suya (lo comprueba `root.test.tsx`). Un error no previsto
 * tampoco se indexa.
 */
export function meta({ error, location }: Route.MetaArgs): Route.MetaDescriptors {
  const locale = localeFromPathname(location.pathname);
  if (isNotFound(error)) return notFoundMeta({ locale, profile });
  return [{ title: translate(locale, 'meta.error.title') }, { name: 'robots', content: 'noindex' }];
}

/** Error en cualquier ruta: la 404 si es un 404 de ruta; si no, aviso en el idioma de la página. */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps): ReactNode {
  console.error('[root] Unhandled route error', error);
  if (isNotFound(error)) return <NotFoundPage />;
  return <ErrorPage />;
}

function ErrorPage(): ReactNode {
  const t = useT();
  const locale = useLocale();

  return (
    <main>
      <h1>{t('error.title')}</h1>
      <p>{t('error.body')}</p>
      <p>
        {/* `<a>` y no `<Link>`: tras un fallo no previsto, una recarga completa empieza de cero. */}
        <a href={homePath(locale)}>{t('notFound.cta')}</a>
      </p>
    </main>
  );
}
