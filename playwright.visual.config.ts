import { defineConfig, devices } from '@playwright/test';

/**
 * Regresión visual (docs/05-tecnico/calidad.md → «Regresión visual»): un estado por capítulo en los dos tamaños
 * de referencia, siempre dentro de la imagen oficial de Playwright (`npm run visual`, el job `visual` del CI), así
 * que las referencias no llevan el sistema en el nombre. Prueba el build de producción, como los e2e.
 */

const PORT = 4173;
const isCI = Boolean(process.env.CI);
/** La pone `scripts/visual.ts` al lanzar la imagen de Playwright (el mismo nombre allí). */
const VISUAL_DOCKER_ENV = 'COSMOS_VISUAL_DOCKER';
if (!isCI && process.env[VISUAL_DOCKER_ENV] !== '1') {
  // Fuera de la imagen, las letras, las fuentes y WebGL pintan distinto: unas referencias de Windows con el mismo
  // nombre harían fallar el CI sin pista clara.
  throw new Error(
    'The visual regression captures run inside the Playwright Docker image: use `npm run visual` (or `npm run visual:update`).',
  );
}
/** Lo que puede tardar en quedar quieta una captura (SwiftShader pinta la escena con la CPU). */
const SCREENSHOT_TIMEOUT_MS = 15_000;
/**
 * Cuánto puede cambiar el color de un píxel sin que cuente como distinto (0–1, en el espacio YIQ de Playwright; su
 * valor por defecto, 0,2, deja pasar ~20 % de brillo). La misma imagen y el mismo build pintan igual y la escena es
 * oscura y tenue: un retoque del shader (alfa, brillo, color) tiene que verse.
 */
const PIXEL_COLOUR_THRESHOLD = 0.05;
/** Píxeles distintos que se toleran en toda la captura: alguno suelto de borde si SwiftShader redondea distinto. */
const MAX_DIFF_PIXELS = 50;

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
      threshold: PIXEL_COLOUR_THRESHOLD,
      maxDiffPixels: MAX_DIFF_PIXELS,
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
