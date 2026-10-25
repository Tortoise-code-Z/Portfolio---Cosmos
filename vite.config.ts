import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { reactRouter } from '@react-router/dev/vite';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { imagetools, type OutputFormat } from 'vite-imagetools';

import { PROJECT_IMAGE_WIDTHS, SHARE_IMAGE_WIDTH } from './src/content/imageWidths.ts';
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

/**
 * Capturas de proyectos (docs/01-contenido/assets.md). Dos presets por directiva, para no repetir
 * parámetros en cada import:
 * - `?project` → AVIF y WebP a 640, 1280 y 1920 px y, como salida, `{ src, width, height, sources }`
 *   (la forma de `ResponsiveImage` en `content/types`): `src` y las medidas son las de la WebP mayor (el
 *   respaldo del `<img>`) y `sources`, el `srcset` de cada formato.
 * - `?share` → JPEG de 1200 px para `og:image` (no todas las redes leen WebP) como `{ src, width, height }`.
 * Los anchos salen de `src/content/imageWidths.ts`, que comparten el sustituto de Vitest, las reglas del
 * contenido y los e2e. Su tipo está en `src/env.d.ts` y Vitest los sustituye por datos de las medidas
 * reales (vitest.config.ts).
 */
const IMAGE_PRESETS: Readonly<Record<string, Record<string, string>>> = {
  project: { w: PROJECT_IMAGE_WIDTHS.join(';'), format: 'avif;webp', as: 'project' },
  share: { w: String(SHARE_IMAGE_WIDTH), format: 'jpeg', quality: '80', as: 'share' },
};

type ProcessedImage = Parameters<ReturnType<OutputFormat>>[0][number];

/** Las variantes de un formato, de menor a mayor ancho. */
function variants(images: readonly ProcessedImage[], format: string): ProcessedImage[] {
  return images
    .filter((image) => (image.transforms.format ?? image.sharpMetadata.format) === format)
    .sort((a, b) => a.info.width - b.info.width);
}

function srcset(images: readonly ProcessedImage[]): string {
  return images.map((image) => `${image.src} ${String(image.info.width)}w`).join(', ');
}

const projectFormat: OutputFormat = () => (images) => {
  const avif = variants(images, 'avif');
  const webp = variants(images, 'webp');
  const fallback = webp.at(-1);
  if (avif.length === 0 || fallback === undefined) {
    throw new Error('vite-imagetools: «?project» debe dar variantes AVIF y WebP.');
  }
  return {
    src: fallback.src,
    width: fallback.info.width,
    height: fallback.info.height,
    sources: { avif: srcset(avif), webp: srcset(webp) },
  };
};

const shareFormat: OutputFormat = () => (images) => {
  const [image] = images;
  if (image === undefined || images.length !== 1) {
    throw new Error('vite-imagetools: «?share» debe dar una sola imagen.');
  }
  return { src: image.src, width: image.info.width, height: image.info.height };
};

function projectImages(): Plugin {
  return imagetools({
    defaultDirectives: (url) => {
      const preset = Object.keys(IMAGE_PRESETS).find((name) => url.searchParams.has(name));
      return new URLSearchParams(preset === undefined ? {} : IMAGE_PRESETS[preset]);
    },
    extendOutputFormats: (builtins) => ({
      ...builtins,
      project: projectFormat,
      share: shareFormat,
    }),
  });
}

export default defineConfig(({ mode }) => {
  // Falla el build, el servidor de desarrollo y el preview con un mensaje claro si VITE_SITE_URL
  // falta o no es https: canónicas, hreflang y Open Graph son URL absolutas.
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  parseSiteUrl(env.VITE_SITE_URL);

  return {
    plugins: [projectImages(), reactRouter(), previewDirectoryIndex()],
    // Un solo CSS para todo el sitio (ADR-019): el <head> de la 404 servida coincide con el que pinta el
    // cliente aunque case otra ruta (`/ES`, slug desconocido), y la hidratación no falla.
    build: {
      cssCodeSplit: false,
      // Las dependencias (React, React Router…) en un solo chunk con la entrada del cliente: el
      // presupuesto de JS mide aparte el framework y el código propio de cada página (ADR-020).
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [{ name: 'framework', test: /node_modules[\\/]/ }],
          },
        },
      },
    },
    resolve: {
      alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) },
    },
  };
});
