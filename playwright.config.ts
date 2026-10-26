import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const isCI = Boolean(process.env.CI);
// En el CI, un reintento basta para un fallo pasajero; con más, un test colgado alarga el job varias veces.
const CI_RETRIES = 1;
// Corta la ejecución antes que el `timeout-minutes` del job (ci.yml), para que el informe llegue a subirse.
const CI_GLOBAL_TIMEOUT_MS = 10 * 60 * 1000;

// Prueba el build de producción: ejecutar `npm run build` antes de `npm run e2e`.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? CI_RETRIES : 0,
  globalTimeout: isCI ? CI_GLOBAL_TIMEOUT_MS : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: `npm run preview -- --port ${String(PORT)} --strictPort`,
    url: `http://localhost:${String(PORT)}`,
    reuseExistingServer: !isCI,
  },
});
