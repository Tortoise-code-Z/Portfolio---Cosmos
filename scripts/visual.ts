/**
 * `npm run visual` / `npm run visual:update` (docs/05-tecnico/calidad.md → «Regresión visual», ADR-010): las
 * capturas se hacen dentro de la imagen oficial de Playwright (`playwrightImage.ts`), para que las referencias salgan
 * igual en cualquier equipo.
 *
 * Los argumentos van a Playwright tal cual (`npm run visual -- --grep about`); `--update` es su
 * `--update-snapshots`.
 */
import { runInPlaywrightImage } from './playwrightImage.ts';

runInPlaywrightImage({
  label: 'visual',
  script: 'scripts/visual-in-docker.sh',
  // La config de las capturas solo corre con esta variable (o en el CI). El mismo nombre está en
  // `playwright.visual.config.ts` (este script no se importa: correría al importarlo).
  dockerEnv: 'COSMOS_VISUAL_DOCKER',
  args: process.argv.slice(2).map((arg) => (arg === '--update' ? '--update-snapshots' : arg)),
});
