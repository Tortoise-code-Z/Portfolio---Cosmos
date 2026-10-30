/**
 * `npm run stills` (ADR-029; docs/01-contenido/assets.md → «Fotos fijas de la escena»): saca las fotos fijas del
 * modo sin WebGL de la escena real (`tests/stills/stills.spec.ts`) dentro de la imagen oficial de Playwright
 * (`playwrightImage.ts`), para que salgan igual en cualquier equipo. Se rehacen cuando cambian las formas, los
 * shaders o la cámara: si no, el e2e de su huella falla (`budgets.spec.ts`).
 */
import { runInPlaywrightImage } from './playwrightImage.ts';

runInPlaywrightImage({
  label: 'stills',
  script: 'scripts/stills-in-docker.sh',
  // La config de las fotos solo corre con esta variable. El mismo nombre está en `playwright.stills.config.ts`.
  dockerEnv: 'COSMOS_STILLS_DOCKER',
  args: process.argv.slice(2),
});
