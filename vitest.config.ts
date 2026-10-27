import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

import { PROJECT_IMAGE_WIDTHS, SHARE_IMAGE_WIDTH } from './src/content/imageWidths.ts';

/** Ancho y alto de un PNG, de su cabecera (IHDR). Las capturas son PNG (docs/01-contenido/assets.md). */
async function pngSize(file: string): Promise<{ width: number; height: number }> {
  const bytes = await readFile(file);
  if (bytes.toString('latin1', 12, 16) !== 'IHDR') throw new Error(`No es un PNG: ${file}`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

/**
 * Sustituto de los presets de imagen de vite.config.ts (`?project`, `?share`): los tests no generan las
 * variantes (lento), pero reciben la misma forma con las medidas reales del archivo, leídas de su
 * cabecera. Si el archivo no existe, el import falla como en el build.
 */
function projectImagesStub(): Plugin {
  return {
    name: 'cosmos:project-images-stub',
    enforce: 'pre',
    async load(id) {
      const match = /^(.+\.png)\?(project|share)$/.exec(id);
      if (match === null) return null;
      const [, file = '', preset] = match;
      const { width, height } = await pngSize(file);
      const name = basename(file, extname(file));
      const scaled = (target: number): { width: number; height: number } => {
        const w = Math.min(target, width);
        return { width: w, height: Math.round((height * w) / width) };
      };
      if (preset === 'share') {
        const size = scaled(SHARE_IMAGE_WIDTH);
        return `export default ${JSON.stringify({ src: `/assets/${name}.jpeg`, ...size })};`;
      }
      // Como imagetools sin `allowUpscale`: un ancho mayor que el archivo se queda en el del archivo, sin
      // repetir (con un PNG de 1500 px: 640, 1280 y 1500).
      const widths = [...new Set(PROJECT_IMAGE_WIDTHS.map((w) => Math.min(w, width)))];
      const srcset = (format: string): string =>
        widths.map((w) => `/assets/${name}-${String(w)}.${format} ${String(w)}w`).join(', ');
      const largest = scaled(widths.at(-1) ?? width);
      return `export default ${JSON.stringify({
        src: `/assets/${name}-${String(largest.width)}.webp`,
        ...largest,
        sources: { avif: srcset('avif'), webp: srcset('webp') },
      })};`;
    },
  };
}

// Los umbrales salen de docs/05-tecnico/calidad.md: el CI falla por debajo.
const STRICT = { lines: 90, functions: 90, branches: 90, statements: 90 };

export default defineConfig({
  plugins: [projectImagesStub(), react()],
  resolve: {
    alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      // Fuera de la cobertura: root.tsx (el documento HTML solo lo pintan los e2e; su lógica, `meta`,
      // `ErrorBoundary` y `HydrateFallback`, la prueba root.test.tsx), routes.ts (configuración) y la entrada
      // del worker de las formas (solo conecta el mensaje con `handleShapesRequest`, que sí se prueba).
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/root.tsx',
        'src/routes.ts',
        'src/scene/worker/shapes.worker.ts',
      ],
      thresholds: {
        lines: 70,
        'src/lib/**': STRICT,
        'src/content/**': STRICT,
        'src/scene/{shapes,math,config,worker}/**': STRICT,
        // Lógica de la escena que se prueba sin WebGL (el bucle, el reloj, uniforms y materiales, la geometría,
        // la cabecera y la limpieza del GLSL, el color de fondo, la pausa, el ratón, la pérdida del contexto y la
        // degradación en caliente): también al 90 %.
        'src/scene/{frameLoop,sceneClock,sceneMaterials,particleGeometry,voidColour,pause,pointer,contextLoss,fpsMeter,useHotDegradation}/**':
          STRICT,
        'src/scene/shaders/**': STRICT,
      },
    },
  },
});
