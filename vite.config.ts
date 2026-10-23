import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { reactRouter } from '@react-router/dev/vite';
import { defineConfig, loadEnv, type Plugin } from 'vite';

import { parseSiteUrl } from './src/lib/env/siteUrl/siteUrl.ts';

/**
 * `vite preview` sirve `/es` con el `index.html` de la raíz (fallback de SPA) en vez de
 * `/es/index.html`, al contrario que Vercel. Este plugin, solo de preview, reescribe las rutas
 * sin barra final a su `index.html` pre-renderizado si existe y, si no, a la 404 de su idioma
 * (`/es/…` → `es/404/index.html`; el resto → `404.html`), para que los e2e prueben lo mismo que
 * se desplegará (la 404 ES en Vercel se configura en F7). El estado HTTP sigue siendo 200 aquí.
 * Una ruta con mayúsculas va siempre a la 404, como en el disco de Vercel, que las distingue: en
 * Windows (NTFS) `existsSync` no las distingue y `/ES` daría el `index.html` de `/es`. Es la regla
 * de `isLowerCasePathname` (`lib/i18n/paths`), escrita aquí porque importarla mete en la config la
 * cadena de imports de `content/` (Vite avisa de los imports sin extensión).
 */
function previewDirectoryIndex(): Plugin {
  return {
    name: 'cosmos:preview-directory-index',
    configurePreviewServer(server) {
      // React Router fija la salida del cliente en su entorno `client` (build/client).
      const clientOutDir =
        server.config.environments.client?.build.outDir ?? server.config.build.outDir;
      const outDir = resolve(server.config.root, clientOutDir);
      server.middlewares.use((req, _res, next) => {
        const [pathname = '/', query] = (req.url ?? '/').split('?', 2);
        const isDirectoryLike =
          !pathname.endsWith('/') && !pathname.includes('.') && !pathname.includes('..');
        if (isDirectoryLike) {
          const isSpanish = pathname === '/es' || pathname.startsWith('/es/');
          const target =
            pathname === pathname.toLowerCase() && existsSync(join(outDir, pathname, 'index.html'))
              ? `${pathname}/index.html`
              : isSpanish
                ? '/es/404/index.html'
                : '/404.html';
          req.url = `${target}${query === undefined ? '' : `?${query}`}`;
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Falla el build, el servidor de desarrollo y el preview con un mensaje claro si VITE_SITE_URL
  // falta o no es https: canónicas, hreflang y Open Graph son URL absolutas.
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  parseSiteUrl(env.VITE_SITE_URL);

  return {
    plugins: [reactRouter(), previewDirectoryIndex()],
    // Un solo CSS para todo el sitio (ADR-019): el <head> de la 404 servida coincide con el que pinta el
    // cliente aunque case otra ruta (`/ES`, slug desconocido), y la hidratación no falla.
    build: { cssCodeSplit: false },
    resolve: {
      alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) },
    },
  };
});
