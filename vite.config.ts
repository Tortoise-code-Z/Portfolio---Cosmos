import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { reactRouter } from '@react-router/dev/vite';
import { defineConfig, loadEnv, type Plugin } from 'vite';

import { parseSiteUrl } from './src/lib/env/siteUrl.ts';

/**
 * `vite preview` sirve `/es` con el `index.html` de la raíz (fallback de SPA) en vez de
 * `/es/index.html`, al contrario que Vercel. Este plugin, solo de preview, reescribe las rutas
 * sin barra final a su `index.html` pre-renderizado si existe, para que los e2e prueben lo mismo
 * que se despliega.
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
        if (isDirectoryLike && existsSync(join(outDir, pathname, 'index.html'))) {
          req.url = `${pathname}/index.html${query === undefined ? '' : `?${query}`}`;
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Falla el build, el servidor de desarrollo y el preview con un mensaje claro si VITE_SITE_URL
  // falta o no es https (EST-F2-3-15): canónicas, hreflang y Open Graph son URL absolutas.
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  parseSiteUrl(env.VITE_SITE_URL);

  return {
    plugins: [reactRouter(), previewDirectoryIndex()],
    resolve: {
      alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) },
    },
  };
});
