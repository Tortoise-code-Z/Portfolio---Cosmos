/**
 * La tabla única de las piezas de la escena (`src/scene/*`): por carpeta, si el código puro no
 * puede importarla (`impure`), si va al 90 % de cobertura (`strict`) y si cambia las fotos fijas del modo sin WebGL
 * (`stills`). De aquí salen las tres listas que antes se escribían a mano:
 * - `IMPURE_SCENE_MODULES` de `eslint.config.js` (arquitectura.md → «Capas»);
 * - el umbral del 90 % de `vitest.config.ts` (calidad.md → «Cobertura»);
 * - la parte de `scene/` de `STILLS_SOURCES` y sus exclusiones (`tests/stills/fingerprint.ts`, ADR-029).
 *
 * `sceneModules.test.ts` exige que cada carpeta de `src/scene/` esté aquí (o en `PURE_SCENE_FOLDERS`), que `impure`
 * case con sus imports y que ESLint cierre de verdad cada pieza impura al código puro. Los shaders no se listan: los
 * tests los leen con `import.meta.glob` y `shaders/` entera va al 90 % y a la huella.
 *
 * **Una carpeta nueva de `scene/` se añade aquí**, con el motivo escrito si no va al 90 % o no entra en la huella.
 * Se importa desde `eslint.config.js` (Node 24 quita los tipos al cargarlo): solo sintaxis que se pueda borrar, sin
 * `enum` ni `namespace`.
 */

/** `true`, o el motivo por el que no. */
export type Reason = true | string;

export interface SceneModule {
  /**
   * El código puro (`PURE_SCENE_FOLDERS`, lo que va al worker) no puede importarla: usa Three, React, Zustand o un
   * store, directamente o a través de otra pieza que los usa. `true` o `false` lo comprueba el test contra sus
   * imports; un texto es una pieza que no los usa y se cierra igual por decisión (el motivo).
   */
  readonly impure: boolean | string;
  /** Al 90 % de cobertura (`true`) o el motivo por el que no. */
  readonly strict: Reason;
  /** Cambia las fotos fijas (`true`: entra en la huella) o el motivo por el que no. */
  readonly stills: Reason;
}

/** Las carpetas del código puro de la escena: van al worker o se prueban sin WebGL; enteras al 90 % y a la huella. */
export const PURE_SCENE_FOLDERS = ['config', 'math', 'shapes', 'worker'] as const;

const DOM_ONLY = 'solo mueve el DOM, que va oculto en las fotos';
const NOT_IN_STILLS = 'no cambia lo que se pinta en una foto quieta';

export const SCENE_MODULES = {
  BackgroundStars: { impure: true, strict: true, stills: true },
  CameraRig: { impure: true, strict: true, stills: true },
  ConstellationLabels: { impure: true, strict: true, stills: DOM_ONLY },
  Constellations: { impure: true, strict: true, stills: true },
  Particles: { impure: true, strict: true, stills: true },
  PlatePins: { impure: true, strict: true, stills: DOM_ONLY },
  SceneRoot: { impure: true, strict: true, stills: true },
  Sun: { impure: true, strict: true, stills: true },
  contextLoss: {
    impure: 'vive con el lienzo (escucha la pérdida del contexto WebGL)',
    strict: true,
    stills: 'solo actúa si se pierde el contexto',
  },
  fpsMeter: { impure: false, strict: true, stills: 'mide los frames, no pinta' },
  frameLoop: { impure: false, strict: true, stills: 'las fotos piden sus frames a mano' },
  labelWriter: { impure: false, strict: true, stills: DOM_ONLY },
  particleGeometry: { impure: true, strict: true, stills: true },
  pause: { impure: true, strict: true, stills: NOT_IN_STILLS },
  pointer: { impure: false, strict: true, stills: 'las fotos se sacan sin ratón' },
  sceneClock: { impure: false, strict: true, stills: true },
  sceneMaterials: { impure: true, strict: true, stills: true },
  shaders: { impure: false, strict: true, stills: true },
  useHotDegradation: { impure: true, strict: true, stills: NOT_IN_STILLS },
  usePortrait: { impure: true, strict: true, stills: true },
  useSceneShapes: { impure: true, strict: true, stills: true },
  voidColour: {
    impure: true,
    strict: true,
    stills: 'el fondo de las fotos lo fija la foto (#000)',
  },
} as const satisfies Record<string, SceneModule>;

export type SceneModuleName = keyof typeof SCENE_MODULES;

/**
 * Lo que, dentro de una carpeta que entra en la huella, no cambia las fotos (`NOT_A_SOURCE` de `fingerprint.ts`): la
 * ruta, con su motivo.
 */
export const STILLS_EXCLUDED: Readonly<Record<string, string>> = {
  'src/scene/math/labelFit': 'coloca las etiquetas y los pins (DOM, oculto en las fotos)',
  'src/scene/math/platePins': 'coloca los pins (DOM, oculto en las fotos)',
};

const entries = Object.entries(SCENE_MODULES) as [SceneModuleName, SceneModule][];

/** Las piezas que el código puro no puede importar (`impure` no es `false`). */
export const IMPURE_SCENE_NAMES: readonly SceneModuleName[] = entries
  .filter(([, module]) => module.impure !== false)
  .map(([name]) => name);

/** Las piezas al 90 % (además de `PURE_SCENE_FOLDERS`). */
export const STRICT_SCENE_NAMES: readonly SceneModuleName[] = entries
  .filter(([, module]) => module.strict === true)
  .map(([name]) => name);

/** Las piezas que entran en la huella de las fotos fijas, con las carpetas puras: rutas desde la raíz del repo. */
export const STILLS_SCENE_PATHS: readonly string[] = [
  ...PURE_SCENE_FOLDERS,
  ...entries.filter(([, module]) => module.stills === true).map(([name]) => name),
].map((name) => `src/scene/${name}`);

/** El código puro de la escena (`eslint.config.js` lo cierra a Three, React y stores; va entero al 90 %). */
export const PURE_SCENE_GLOB = `src/scene/{${PURE_SCENE_FOLDERS.join(',')}}/**`;

/** El glob del 90 % de las piezas de `scene/` (fuera las carpetas puras, que tienen el suyo). */
export const STRICT_SCENE_GLOB = `src/scene/{${STRICT_SCENE_NAMES.join(',')}}/**`;
