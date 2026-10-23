import { render, screen } from '@testing-library/react';
import type { MetaDescriptor } from 'react-router';
import { createRoutesStub, data } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { ErrorBoundary, HydrateFallback, meta } from './root';
import routes from './routes';

// Excepción de ADR-018: React Router fija el nombre y el sitio de `root.tsx`, así que su test va al lado.

type RootMetaArgs = Parameters<typeof meta>[0];

function rootMeta(pathname: string, error: unknown): MetaDescriptor[] {
  const args: RootMetaArgs = {
    location: { pathname, search: '', hash: '', state: null, key: 'default' },
    params: {},
    loaderData: undefined,
    matches: [{ id: 'root', params: {}, pathname, meta: [], loaderData: undefined }],
    error,
  };
  return meta(args);
}

function titleOf(descriptors: readonly MetaDescriptor[]): string | undefined {
  for (const descriptor of descriptors) if ('title' in descriptor) return String(descriptor.title);
  return undefined;
}

function robotsOf(descriptors: readonly MetaDescriptor[]): string[] {
  return descriptors.flatMap((descriptor) =>
    'name' in descriptor && descriptor.name === 'robots' ? [String(descriptor.content)] : [],
  );
}

/** Lo que recibe `meta` cuando un `loader` lanza un 404 (la forma que reconoce `isRouteErrorResponse`). */
const ROUTE_404 = { status: 404, statusText: 'Not Found', internal: false, data: null };

const NOT_FOUND = {
  en: 'Lost in space · Víctor Pérez',
  es: 'Perdido en el espacio · Víctor Pérez',
};
const ERROR = { en: 'Something went wrong · Víctor Pérez', es: 'Algo ha fallado · Víctor Pérez' };

describe('meta de la raíz (reserva)', () => {
  it.each([
    ['sin error (null, mientras se hidrata una 404)', null],
    ['sin error (undefined)', undefined],
    ['con un 404 de ruta', ROUTE_404],
  ])('%s: la de la 404 del idioma, con noindex', (_case, error) => {
    for (const [pathname, locale] of [
      ['/x', 'en'],
      ['/es/x', 'es'],
    ] as const) {
      const descriptors = rootMeta(pathname, error);
      expect(titleOf(descriptors)).toBe(NOT_FOUND[locale]);
      expect(robotsOf(descriptors)).toEqual(['noindex']);
    }
  });

  it('con un error no previsto: título de error del idioma, con noindex', () => {
    for (const [pathname, locale] of [
      ['/x', 'en'],
      ['/es/x', 'es'],
    ] as const) {
      const descriptors = rootMeta(pathname, new Error('boom'));
      expect(titleOf(descriptors)).toBe(ERROR[locale]);
      expect(robotsOf(descriptors)).toEqual(['noindex']);
    }
  });
});

function Boom(): never {
  throw new Error('boom');
}

const Stub = createRoutesStub([
  { path: '/x', Component: Boom, ErrorBoundary },
  { path: '/es/x', Component: Boom, ErrorBoundary },
  {
    path: '/projects/gone',
    Component: () => null,
    ErrorBoundary,
    loader: () => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- React Router lo convierte en un 404 de ruta
      throw data(null, { status: 404 });
    },
  },
]);

describe('ErrorBoundary de la raíz', () => {
  it.each([
    ['/x', 'Something went wrong', 'Back to the start', '/'],
    ['/es/x', 'Algo ha fallado', 'Volver al inicio', '/es'],
  ])(
    'error no previsto en %s: aviso del idioma y vuelta a su home',
    async (path, h1, cta, home) => {
      const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      render(<Stub initialEntries={[path]} />);
      expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(h1);
      expect(screen.getByRole('link', { name: cta })).toHaveAttribute('href', home);
      expect(log).toHaveBeenCalledWith('[root] Unhandled route error', expect.any(Error));
    },
  );

  it('un 404 de ruta pinta la página 404 (la misma que la ruta *)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<Stub initialEntries={['/projects/gone']} />);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Lost in space');
    expect(screen.getByRole('link', { name: 'Back to the start' })).toHaveAttribute('href', '/');
  });
});

describe('HydrateFallback', () => {
  it('pinta la 404 del idioma del prefijo', async () => {
    const FallbackStub = createRoutesStub([{ path: '*', Component: HydrateFallback }]);
    render(<FallbackStub initialEntries={['/es/projects/x']} />);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'Perdido en el espacio',
    );
  });
});

// Una ruta sin `meta` heredaría la de reserva (la de la 404, con noindex) sin que nada avise.
const routeModules = import.meta.glob<Record<string, unknown>>(
  ['./routes/**/*.tsx', '!./routes/**/*.test.tsx'],
  { eager: true },
);

describe('rutas de routes.ts', () => {
  it.each(routes.map((route) => [route.id ?? route.file, route.file]))(
    '%s exporta su propia meta',
    (_id, file) => {
      const module = routeModules[`./${file}`];
      expect(module, `no se encuentra ${file}`).toBeDefined();
      expect(typeof module?.meta).toBe('function');
    },
  );
});
