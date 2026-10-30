/**
 * Lanza un script dentro de la imagen oficial de Playwright, la misma del CI (ADR-010, ADR-024): lo usan
 * `npm run visual` (las capturas) y `npm run stills` (las fotos fijas del modo sin WebGL, ADR-029), que tienen que
 * salir igual en cualquier equipo (las letras, las fuentes y WebGL pintan distinto en cada sistema). La imagen es la
 * de la versión de `@playwright/test` de `package.json`. Los `node_modules` del contenedor van en un volumen de
 * Docker propio: los del equipo (Windows) no se tocan. Necesita Docker Desktop abierto.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** El volumen de Docker con los `node_modules` de Linux (se reutiliza entre ejecuciones y entre scripts). */
const NODE_MODULES_VOLUME = 'cosmos-portfolio-visual-node-modules';
/** Una versión exacta (`save-exact` en `.npmrc`): con un rango, el nombre de la imagen no existiría. */
const EXACT_VERSION = /^\d+\.\d+\.\d+$/;

/** La versión de `@playwright/test` de `package.json`, si es exacta. */
function playwrightVersion(packageJson: unknown): string | null {
  if (typeof packageJson !== 'object' || packageJson === null) return null;
  const dev: unknown = (packageJson as { devDependencies?: unknown }).devDependencies;
  if (typeof dev !== 'object' || dev === null) return null;
  const version: unknown = (dev as Record<string, unknown>)['@playwright/test'];
  return typeof version === 'string' && EXACT_VERSION.test(version) ? version : null;
}

export interface PlaywrightImageRun {
  /** Prefijo de los mensajes (`visual`, `stills`). */
  readonly label: string;
  /** El script de bash que corre dentro, relativo a la raíz del repo. */
  readonly script: string;
  /** La variable que deja correr la config de Playwright de ese script (fuera de la imagen, falla a propósito). */
  readonly dockerEnv: string;
  /** Lo que se le pasa al script. */
  readonly args: readonly string[];
}

/** Corre `script` en la imagen con el repo montado en `/work` y sale con su código. */
export function runInPlaywrightImage({
  label,
  script,
  dockerEnv,
  args,
}: PlaywrightImageRun): never {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
  const packageJson: unknown = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  const version = playwrightVersion(packageJson);
  if (version === null) {
    console.error(
      `[${label}] package.json needs an exact @playwright/test version in devDependencies (like 1.64.0)`,
    );
    process.exit(1);
  }

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
      `${dockerEnv}=1`,
      '--volume',
      `${root}:/work`,
      '--volume',
      `${NODE_MODULES_VOLUME}:/work/node_modules`,
      '--workdir',
      '/work',
      `mcr.microsoft.com/playwright:v${version}-noble`,
      'bash',
      script,
      ...args,
    ],
    { stdio: 'inherit' },
  );
  if (result.error !== undefined) {
    // Solo pasa si no se puede lanzar `docker`; con Docker Desktop cerrado, el propio `docker` da su error.
    console.error(
      `[${label}] Could not run \`docker\` (is Docker Desktop installed and on the PATH?)`,
      result.error.message,
    );
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}
