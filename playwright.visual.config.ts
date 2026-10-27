import { defineConfig, devices } from '@playwright/test';

/**
 * Regresión visual (docs/05-tecnico/calidad.md → «Regresión visual»): un estado por capítulo en los dos tamaños
 * de referencia, siempre dentro de la imagen oficial de Playwright (`npm run visual`, el job `visual` del CI), así
 * que las referencias no llevan el sistema en el nombre. Prueba el build de producción, como los e2e.
 */

const PORT = 4173;
const isCI = Boolean(process.env.CI);
/** Lo que puede tardar en quedar quieta una captura (SwiftShader pinta la escena con la CPU). */
const SCREENSHOT_TIMEOUT_MS = 15_000;
/**
 * Píxeles que pueden cambiar sin que cuente como diferencia: la misma imagen y el mismo build pintan igual, así
 * que es casi cero (un margen por si SwiftShader redondea distinto algún borde).
 */
const MAX_DIFF_PIXEL_RATIO = 0.001;

export default defineConfig({
  testDir: './tests/visual',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: isCI,
  // Una diferencia de píxeles no es un fallo pasajero: sin reintentos.
  retries: 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  expect: {
    timeout: SCREENSHOT_TIMEOUT_MS,
    toHaveScreenshot: {
      maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
      animations: 'disabled',
      caret: 'hide',
    },
  },
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    // Quieta para la foto: con movimiento reducido el reloj de la escena no avanza y no hay oscilaciones
    // (docs/04-escena/particulas-y-shaders.md → «Uniforms»), y la interfaz no anima.
    reducedMotion: 'reduce',
    locale: 'en-US',
    trace: 'off',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: `npm run preview -- --port ${String(PORT)} --strictPort`,
    url: `http://localhost:${String(PORT)}`,
    reuseExistingServer: !isCI,
  },
});
