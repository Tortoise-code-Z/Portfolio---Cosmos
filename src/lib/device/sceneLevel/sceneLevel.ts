/**
 * Niveles de rendimiento de la escena (docs/04-escena/rendimiento.md → «Niveles»). Viven en `lib` porque
 * los usan la interfaz (`uiStore` guarda el nivel elegido) y la escena (cuántas partículas genera, el DPR
 * del lienzo). Sin Three: la tabla, la elección inicial (pura), el nivel de debajo y si es un móvil (para la
 * degradación en caliente: `nextLowerLevel`, `isHandheld`), y `readBrowserSignals` / `readHandheldSignals`, que
 * leen las señales en el cliente.
 */

/** `off` es el modo sin WebGL: no hay lienzo. */
export type SceneLevel = 'high' | 'medium' | 'low' | 'off';

/** Los niveles que pintan algo, de más a menos. */
export type RenderLevel = Exclude<SceneLevel, 'off'>;

export interface LevelSettings {
  /** Partículas de las formas. */
  readonly particles: number;
  /** Estrellas de fondo. */
  readonly stars: number;
  /** Densidad de píxeles máxima del lienzo (el DPR real del dispositivo, como mucho este). */
  readonly maxDpr: number;
  /** Estela de la tortuga y luces de ciudad (los extras que se quitan en Bajo). */
  readonly extras: boolean;
}

export const LEVEL_SETTINGS: Readonly<Record<RenderLevel, LevelSettings>> = {
  high: { particles: 60_000, stars: 5_000, maxDpr: 2, extras: true },
  medium: { particles: 36_000, stars: 3_500, maxDpr: 1.5, extras: true },
  low: { particles: 20_000, stars: 2_000, maxDpr: 1, extras: false },
};

/** Lo que mira la elección inicial. Lo que el navegador no expone llega como `undefined`. */
export interface BrowserSignals {
  /** `navigator.connection.saveData` (solo Chromium). */
  readonly saveData: boolean | undefined;
  /** `navigator.deviceMemory`, en GB (solo Chromium, redondeado a la baja). */
  readonly deviceMemory: number | undefined;
  /** `navigator.hardwareConcurrency`. */
  readonly hardwareConcurrency: number | undefined;
  /** Puntero principal grueso (táctil): `(pointer: coarse)`. */
  readonly coarsePointer: boolean;
  /** Ancho de la ventana en px CSS. */
  readonly viewportWidth: number;
  /**
   * WebGL2 solo sin `failIfMajorPerformanceCaveat`: pinta con la CPU, sin tarjeta gráfica usable
   * (`detectWebGL2` → `software`, en `lib/device/webgl2`).
   */
  readonly softwareRendering: boolean;
}

/** Con esta memoria o menos (GB), Bajo. */
export const LOW_MEMORY_GB = 2;
/** Por debajo de este ancho (px CSS), Bajo: un móvil, aunque tenga ratón. */
export const NARROW_VIEWPORT_PX = 760;
/** Con estos núcleos o menos, Medio. */
export const FEW_CORES = 4;

/**
 * ¿Es un móvil (o una tableta)? Táctil o estrecho, aunque tenga ratón. Lo miran la elección inicial (Bajo) y la
 * degradación en caliente (su umbral de fps).
 */
export function isHandheld({
  coarsePointer,
  viewportWidth,
}: Pick<BrowserSignals, 'coarsePointer' | 'viewportWidth'>): boolean {
  return coarsePointer || viewportWidth < NARROW_VIEWPORT_PX;
}

/**
 * Nivel con el que arranca la visita. En orden: pintado por software, ahorro de datos o poca memoria →
 * Bajo; táctil o estrecho → Bajo; pocos núcleos → Medio; si no, Alto. Una señal que el navegador no da no
 * baja el nivel. Después solo puede bajar: la degradación en caliente (`nextLowerLevel`).
 */
export function chooseInitialLevel(signals: BrowserSignals): RenderLevel {
  const { saveData, deviceMemory, hardwareConcurrency } = signals;
  if (
    signals.softwareRendering ||
    saveData === true ||
    (deviceMemory !== undefined && deviceMemory <= LOW_MEMORY_GB)
  ) {
    return 'low';
  }
  if (isHandheld(signals)) return 'low';
  if (hardwareConcurrency !== undefined && hardwareConcurrency <= FEW_CORES) return 'medium';
  return 'high';
}

/**
 * El nivel de debajo, al que lleva la degradación en caliente (docs/04-escena/rendimiento.md → «Degradación en
 * caliente»). Bajo es el suelo: los fps nunca apagan la escena. El `switch` cubre todos los niveles sin `default`:
 * uno nuevo no compila hasta tener su caso (la función se quedaría sin `return`).
 */
export function nextLowerLevel(level: RenderLevel): RenderLevel | null {
  switch (level) {
    case 'high':
      return 'medium';
    case 'medium':
      return 'low';
    case 'low':
      return null;
  }
}

/** Las APIs que no están en todos los navegadores (ni en los tipos del DOM). */
interface NavigatorExtras {
  readonly connection?: { readonly saveData?: unknown };
  readonly deviceMemory?: unknown;
}

/** Puntero principal grueso (táctil). */
const COARSE_POINTER_QUERY = '(pointer: coarse)';

function positiveNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

/**
 * Las señales de «¿es un móvil?» (`isHandheld`), leídas ahora (solo en cliente): las comparten la elección inicial
 * y la degradación en caliente, así que las dos usan el mismo criterio. Sin `matchMedia`, el puntero no es grueso.
 */
export function readHandheldSignals(): Pick<BrowserSignals, 'coarsePointer' | 'viewportWidth'> {
  return {
    coarsePointer:
      typeof window.matchMedia === 'function' && window.matchMedia(COARSE_POINTER_QUERY).matches,
    viewportWidth: window.innerWidth,
  };
}

/**
 * Lee las señales del navegador en el momento de elegir (solo en cliente). Si pinta por software lo dice
 * quien detectó WebGL2 (`detectWebGL2`): se pregunta una sola vez, antes de elegir.
 */
export function readBrowserSignals({
  softwareRendering,
}: Pick<BrowserSignals, 'softwareRendering'>): BrowserSignals {
  const extras = navigator as Navigator & NavigatorExtras;
  const saveData = extras.connection?.saveData;
  return {
    saveData: typeof saveData === 'boolean' ? saveData : undefined,
    deviceMemory: positiveNumber(extras.deviceMemory),
    hardwareConcurrency: positiveNumber(navigator.hardwareConcurrency),
    ...readHandheldSignals(),
    softwareRendering,
  };
}
