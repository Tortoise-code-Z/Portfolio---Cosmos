import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Los umbrales salen de docs/05-tecnico/calidad.md: el CI falla por debajo.
const STRICT = { lines: 90, functions: 90, branches: 90, statements: 90 };

export default defineConfig({
  plugins: [react()],
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
      // `ErrorBoundary` y `HydrateFallback`, la prueba root.test.tsx) y routes.ts (configuración).
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts', 'src/root.tsx', 'src/routes.ts'],
      thresholds: {
        lines: 70,
        'src/lib/**': STRICT,
        'src/content/**': STRICT,
        'src/scene/{shapes,math,config}/**': STRICT,
      },
    },
  },
});
