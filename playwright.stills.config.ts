import { defineConfig, devices } from '@playwright/test';

/**
 * Las fotos fijas del modo sin WebGL (ADR-029; docs/01-contenido/assets.md → «Fotos fijas de la escena»): las saca
 * `tests/stills/stills.spec.ts` del build de producción, siempre dentro de la imagen oficial de Playwright
 * (`npm run stills`), como las capturas: fuera, WebGL pinta distinto en cada equipo.
 */

const PORT = 4173;
/** La pone `scripts/stills.ts` al lanzar la imagen de Playwright (el mismo nombre allí). */
const STILLS_DOCKER_ENV = 'COSMOS_STILLS_DOCKER';
if (process.env[STILLS_DOCKER_ENV] !== '1') {
  throw new Error(
    'The scene stills are taken inside the Playwright Docker image: use `npm run stills`.',
  );
}

export default defineConfig({
  testDir: './tests/stills',
  testMatch: 'stills.spec.ts',
  // En orden y de uno en uno: el último paso escribe la huella de todas.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  // Cada encuadre son 4 fotos; SwiftShader tarda en montar la escena en Alto a densidad 2.
  timeout: 300_000,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://localhost:${String(PORT)}`,
    trace: 'off',
  },
  webServer: {
    command: `npm run preview -- --port ${String(PORT)} --strictPort`,
    url: `http://localhost:${String(PORT)}`,
    reuseExistingServer: true,
  },
});
