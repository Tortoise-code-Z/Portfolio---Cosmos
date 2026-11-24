import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { projectEntries } from '../../src/content/projects/entries.ts';
import { assignPlates } from '../../src/scene/config/plateSlots/plateSlots.ts';
import { STILLS_EXCLUDED, STILLS_SCENE_PATHS } from '../../scripts/sceneModules.ts';

/**
 * Huella de lo que se ve en las fotos fijas del modo sin WebGL (ADR-029). De la escena, lo que dice la tabla única
 * (`scripts/sceneModules.ts`: las carpetas puras —formas, cámara, paleta, placas…—, los shaders y cada pieza con
 * `stills: true`, menos `STILLS_EXCLUDED`); de fuera de ella: las imágenes del retrato, las cuentas que comparten
 * (`lib/math` y el suavizado de `m`, `lib/scroll/smoothM`), los tramos del viaje y su `m` (`content/chapters.ts`,
 * `lib/scroll/mapM`: las fotos se sacan en el ancla, en su `base`; la llegada del epílogo, `lib/scroll/arrival`, que
 * comparten la cámara y el shader), el movimiento reducido (las fotos se sacan con el
 * reloj parado: `uTime` = 0), si es escritorio (`lib/device/mediaQuery`: el encuadre se aparta a un lado), los niveles,
 * cómo se sacan las fotos y las placas de la tortuga (una por proyecto). `npm run stills` la guarda en
 * `src/assets/scene-stills/stills.json` y `budgets.spec.ts` la compara: si cambia algo de esto sin rehacer las fotos,
 * el e2e falla y lo dice. Una carpeta nueva de `scene/` se clasifica en la tabla (su test lo exige); una de fuera
 * que cambie lo que se ve, aquí.
 */
export const STILLS_SOURCES: readonly string[] = [
  ...STILLS_SCENE_PATHS,
  'src/assets/portrait',
  'src/lib/math',
  'src/lib/scroll/smoothM',
  'src/lib/scroll/mapM',
  'src/lib/scroll/arrival',
  'src/content/chapters.ts',
  'src/lib/device/reducedMotion',
  'src/lib/device/mediaQuery',
  'src/lib/device/sceneLevel/sceneLevel.ts',
  'src/features/scene-mount/stillFrames/stillFrames.ts',
  'tests/stills/stills.spec.ts',
];

/** Escapa una ruta para usarla dentro de una expresión regular. */
const escapeRegExp = (text: string): string =>
  text.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

/**
 * Lo que no cambia las fotos: los tests y sus ayudas dentro de una carpeta de la lista (`mapM/chapterSteps.ts`, que la
 * web no usa: tocarla pediría `npm run stills` sin que cambiara ninguna foto) y lo que la tabla excluye con su motivo
 * (`STILLS_EXCLUDED`).
 */
const NOT_A_SOURCE = new RegExp(
  [
    String.raw`\.test\.tsx?$`,
    String.raw`\/mapM\/chapterSteps\.ts$`,
    ...Object.keys(STILLS_EXCLUDED).map((path) => `^${escapeRegExp(path)}/`),
  ].join('|'),
);
/**
 * Solo el código, los shaders, los estilos y las imágenes del retrato: un archivo suelto que no sigue git (un `.orig` de un merge, una nota)
 * cambiaría la huella en un equipo y no en el CI.
 */
const SOURCE_FILE = /\.(?:tsx?|glsl|css|jpg|png)$/;
/** Las imágenes (las del retrato) entran byte a byte; el resto, como texto con finales LF. */
const IMAGE_FILE = /\.(?:jpg|png)$/;

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
    hash.update(
      IMAGE_FILE.test(file)
        ? readFileSync(join(root, file))
        : readFileSync(join(root, file), 'utf8').replaceAll('\r\n', '\n'),
    );
    hash.update('\n');
  }
  // Las placas de la tortuga: una por proyecto, en su hueco. Solo las etiquetas, no el contenido de las fichas
  // (cambiar un texto no cambia la foto; añadir o quitar un proyecto, sí).
  hash.update(`plates ${JSON.stringify(assignPlates(projectEntries).map(({ label }) => label))}\n`);
  return hash.digest('hex');
}
