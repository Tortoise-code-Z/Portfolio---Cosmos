/**
 * `npm run visual` / `npm run visual:update` (docs/05-tecnico/calidad.md → «Regresión visual», ADR-010): las
 * capturas se hacen dentro de la imagen oficial de Playwright, la misma del CI, para que las referencias salgan
 * igual en cualquier equipo (las letras, las fuentes y WebGL pintan distinto en cada sistema). La imagen es la de la
 * versión de `@playwright/test` de `package.json` (como los e2e, ADR-024). Los `node_modules` del contenedor van en
 * un volumen de Docker propio: los del equipo (Windows) no se tocan. Necesita Docker Desktop abierto.
 *
 * Los argumentos van a Playwright tal cual (`npm run visual -- --grep about`); `--update` es su
 * `--update-snapshots`.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** El volumen de Docker con los `node_modules` de Linux (se reutiliza entre ejecuciones). */
const NODE_MODULES_VOLUME = 'cosmos-portfolio-visual-node-modules';
/** Una versión exacta (`save-exact` en `.npmrc`): con un rango, el nombre de la imagen no existiría. */
const EXACT_VERSION = /^\d+\.\d+\.\d+$/;
/**
 * La config de las capturas solo corre con esta variable (o en el CI): fuera de Docker saldrían otras. El mismo
 * nombre está en `playwright.visual.config.ts` (este script no se importa: correría al importarlo).
 */
const VISUAL_DOCKER_ENV = 'COSMOS_VISUAL_DOCKER';

/** La versión de `@playwright/test` de `package.json`, si es exacta. */
function playwrightVersion(packageJson: unknown): string | null {
  if (typeof packageJson !== 'object' || packageJson === null) return null;
  const dev: unknown = (packageJson as { devDependencies?: unknown }).devDependencies;
  if (typeof dev !== 'object' || dev === null) return null;
  const version: unknown = (dev as Record<string, unknown>)['@playwright/test'];
  return typeof version === 'string' && EXACT_VERSION.test(version) ? version : null;
}

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const packageJson: unknown = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const version = playwrightVersion(packageJson);
if (version === null) {
  console.error(
    '[visual] package.json needs an exact @playwright/test version in devDependencies (like 1.64.0)',
  );
  process.exit(1);
}

const playwrightArgs = process.argv
  .slice(2)
  .map((arg) => (arg === '--update' ? '--update-snapshots' : arg));
const result = spawnSync(
  'docker',
  [
    'run',
    '--rm',
    '--init',
    // Chromium necesita más memoria compartida que la que Docker da por defecto.
    '--ipc=host',
    // Husky no hace falta dentro (y tocaría la configuración de git del repo montado).
    '--env',
    'HUSKY=0',
    '--env',
    `${VISUAL_DOCKER_ENV}=1`,
    '--volume',
    `${root}:/work`,
    '--volume',
    `${NODE_MODULES_VOLUME}:/work/node_modules`,
    '--workdir',
    '/work',
    `mcr.microsoft.com/playwright:v${version}-noble`,
    'bash',
    'scripts/visual-in-docker.sh',
    ...playwrightArgs,
  ],
  { stdio: 'inherit' },
);
if (result.error !== undefined) {
  // Solo pasa si no se puede lanzar `docker`; con Docker Desktop cerrado, el propio `docker` da su error.
  console.error(
    '[visual] Could not run `docker` (is Docker Desktop installed and on the PATH?)',
    result.error.message,
  );
  process.exit(1);
}
process.exit(result.status ?? 1);
