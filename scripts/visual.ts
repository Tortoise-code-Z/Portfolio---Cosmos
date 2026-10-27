/**
 * `npm run visual` / `npm run visual:update` (docs/05-tecnico/calidad.md → «Regresión visual»): las capturas se
 * hacen dentro de la imagen oficial de Playwright, la misma del CI, para que las referencias salgan igual en
 * cualquier equipo (las letras, las fuentes y WebGL pintan distinto en cada sistema). La imagen es la de la
 * versión de `@playwright/test` de `package.json` (ADR-024). Los `node_modules` del contenedor van en un volumen de
 * Docker propio: los del equipo (Windows) no se tocan. Necesita Docker Desktop abierto.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

interface PackageJson {
  readonly devDependencies?: Readonly<Record<string, string>>;
}

/** El volumen de Docker con los `node_modules` de Linux (se reutiliza entre ejecuciones). */
const NODE_MODULES_VOLUME = 'cosmos-portfolio-visual-node-modules';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as PackageJson;
const version = pkg.devDependencies?.['@playwright/test'];
if (version === undefined) {
  console.error('[visual] @playwright/test is not in the devDependencies of package.json');
  process.exit(1);
}

const update = process.argv.includes('--update');
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
    '--volume',
    `${root}:/work`,
    '--volume',
    `${NODE_MODULES_VOLUME}:/work/node_modules`,
    '--workdir',
    '/work',
    `mcr.microsoft.com/playwright:v${version}-noble`,
    'bash',
    'scripts/visual-in-docker.sh',
    ...(update ? ['--update-snapshots'] : []),
  ],
  { stdio: 'inherit' },
);
if (result.error !== undefined) {
  console.error(
    '[visual] Docker could not be started (is Docker Desktop running?)',
    result.error.message,
  );
  process.exit(1);
}
process.exit(result.status ?? 1);
