import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Huella de lo que se ve en las fotos fijas del modo sin WebGL (ADR-029): las formas, los shaders, la cámara, la
 * paleta, los niveles, cómo se monta el lienzo y cómo se sacan las fotos. `npm run stills` la guarda en
 * `src/assets/scene-stills/stills.json` y `budgets.spec.ts` la compara: si cambia algo de esto sin rehacer las fotos
 * (F4: constelaciones, Sol, cámara), el e2e falla y lo dice.
 */
export const STILLS_SOURCES = [
  'src/scene/config',
  'src/scene/shapes',
  'src/scene/shaders',
  'src/scene/math',
  'src/scene/BackgroundStars',
  'src/scene/CameraRig',
  'src/scene/Particles',
  'src/scene/SceneRoot',
  'src/scene/particleGeometry',
  'src/scene/sceneMaterials',
  'src/lib/device/sceneLevel/sceneLevel.ts',
  'src/features/scene-mount/stillFrames/stillFrames.ts',
  'tests/stills/stills.spec.ts',
] as const;

/** Lo que no cambia las fotos: los tests. */
const NOT_A_SOURCE = /\.test\.tsx?$/;

/** Los archivos de una ruta (un archivo o una carpeta, entera), relativos a `root`, con `/`. */
function filesUnder(root: string, path: string): string[] {
  if (!statSync(join(root, path)).isDirectory()) return [path];
  return readdirSync(join(root, path), { recursive: true, encoding: 'utf8' })
    .map((name) => `${path}/${name.replaceAll('\\', '/')}`)
    .filter((file) => statSync(join(root, file)).isFile());
}

/**
 * La huella (sha256) de `STILLS_SOURCES` en `root`: cada archivo con su ruta, en orden y con finales de línea LF
 * (en Windows el árbol de trabajo puede tenerlos CRLF; el repo los guarda LF, `.gitattributes`).
 */
export function stillsFingerprint(root: string): string {
  const hash = createHash('sha256');
  const files = STILLS_SOURCES.flatMap((path) => filesUnder(root, path))
    .filter((file) => !NOT_A_SOURCE.test(file))
    .sort();
  for (const file of files) {
    hash.update(`${file}\n`);
    hash.update(readFileSync(join(root, file), 'utf8').replaceAll('\r\n', '\n'));
    hash.update('\n');
  }
  return hash.digest('hex');
}
