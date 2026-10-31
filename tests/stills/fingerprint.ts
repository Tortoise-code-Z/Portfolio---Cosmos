import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { projectEntries } from '../../src/content/projects/entries.ts';
import { assignPlates } from '../../src/scene/config/plateSlots/plateSlots.ts';

/**
 * Huella de lo que se ve en las fotos fijas del modo sin WebGL (ADR-029): las formas, los shaders, la cámara, la
 * paleta, los niveles, las cuentas que comparten (`lib/math` y el suavizado de `m`, `lib/scroll/smoothM`), cómo se
 * piden las formas, cómo se monta el lienzo, el reloj y el movimiento reducido (las fotos se sacan con el reloj
 * parado: `uTime` = 0), cómo se sacan las fotos y las placas de la tortuga (una por proyecto). `npm run stills` la guarda en
 * `src/assets/scene-stills/stills.json` y `budgets.spec.ts` la compara: si cambia algo de esto sin rehacer las fotos
 * (F4: constelaciones, Sol, cámara), el e2e falla y lo dice. Si F4 crea una carpeta nueva en `scene/` que cambie lo
 * que se ve, va también aquí.
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
  'src/scene/useSceneShapes',
  'src/scene/sceneClock',
  'src/lib/math',
  'src/lib/scroll/smoothM',
  'src/lib/device/reducedMotion',
  'src/lib/device/sceneLevel/sceneLevel.ts',
  'src/features/scene-mount/stillFrames/stillFrames.ts',
  'tests/stills/stills.spec.ts',
] as const;

/** Lo que no cambia las fotos: los tests. */
const NOT_A_SOURCE = /\.test\.tsx?$/;
/**
 * Solo el código, los shaders y los estilos: un archivo suelto que no sigue git (un `.orig` de un merge, una nota)
 * cambiaría la huella en un equipo y no en el CI.
 */
const SOURCE_FILE = /\.(?:tsx?|glsl|css)$/;

/** Los archivos de una ruta (un archivo o una carpeta, entera), relativos a `root`, con `/`. */
function filesUnder(root: string, path: string): string[] {
  if (!statSync(join(root, path)).isDirectory()) return [path];
  return readdirSync(join(root, path), { recursive: true, encoding: 'utf8' })
    .map((name) => `${path}/${name.replaceAll('\\', '/')}`)
    .filter((file) => statSync(join(root, file)).isFile());
}

/**
 * La huella (sha256) de `STILLS_SOURCES` en `root`: cada archivo con su ruta, en orden y con finales de línea LF
 * (en Windows el árbol de trabajo puede tenerlos CRLF; el repo los guarda LF, `.gitattributes`), y las placas.
 */
export function stillsFingerprint(root: string): string {
  const hash = createHash('sha256');
  const files = STILLS_SOURCES.flatMap((path) => filesUnder(root, path))
    .filter((file) => SOURCE_FILE.test(file) && !NOT_A_SOURCE.test(file))
    .sort();
  for (const file of files) {
    hash.update(`${file}\n`);
    hash.update(readFileSync(join(root, file), 'utf8').replaceAll('\r\n', '\n'));
    hash.update('\n');
  }
  // Las placas de la tortuga: una por proyecto, en su hueco. Solo las etiquetas, no el contenido de las fichas
  // (cambiar un texto no cambia la foto; añadir o quitar un proyecto, sí).
  hash.update(`plates ${JSON.stringify(assignPlates(projectEntries).map(({ label }) => label))}\n`);
  return hash.digest('hex');
}
