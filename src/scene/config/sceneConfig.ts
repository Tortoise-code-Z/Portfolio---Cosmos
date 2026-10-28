/**
 * Constantes de la escena que comparten varias piezas (docs/04-escena/formas.md). Las de una sola forma
 * van con su generador, junto a la fórmula que las usa; aquí solo lo que tiene que cuadrar entre fases.
 */

/**
 * Semilla del proyecto (ADR-011): el mismo universo en cada visita. Cada forma usa su subsemilla
 * (`subSeed`), así que retocar una no mueve las demás.
 */
export const SCENE_SEED = 0x7a4f_1c2b;

/**
 * Semiejes del caparazón de la tortuga (forma 3), cabeza hacia +X. Los usan el generador y, en F4.4, los
 * pins que se anclan sobre las placas.
 */
export const SHELL = { AX: 2.7, AY: 1.3, AZ: 2.15 } as const;

/** Tamaño de la rejilla hexagonal del caparazón (centro a vértice), *pointy-top*. */
export const HEX_SIZE = 0.95;

/**
 * Lente de la cámara (docs/04-escena/camara-y-encuadre.md → «Campo de visión»): 55° en vertical. Son las
 * props del `<Canvas>`: R3F las copia a la cámara, así que aquí no va nada más.
 */
export const CAMERA_LENS = { fov: 55, near: 0.1, far: 400 } as const;

/**
 * Pantallas estrechas: por debajo de este aspecto (vertical o casi cuadrado) se conserva el campo horizontal
 * que tendría a 1,25, con un tope de 100° en vertical (`cameraFov`). Así la galaxia y la tortuga caben enteras
 * en un móvil.
 */
export const CAMERA_FIT = { minAspect: 1.25, maxFov: 100 } as const;

/** Un punto de la escena: `[x, y, z]`. */
export type ScenePoint = readonly [x: number, y: number, z: number];

export interface CameraKeyframe {
  readonly position: ScenePoint;
  readonly target: ScenePoint;
  /**
   * Desplazamiento en X del encuadre en escritorio: se suma a la posición y al objetivo (el ángulo no cambia)
   * y lleva la escena a la derecha para dejar sitio a los paneles.
   */
  readonly shiftX: number;
}

/**
 * La cámara en cada capítulo (camara-y-encuadre.md → «Keyframes por capítulo»); entre dos, `smoothstep` de la
 * parte decimal de `m` (`cameraPose`). Uno por forma: 0 singularidad · 1 nebulosa · 2 galaxia · 3 tortuga ·
 * 4 Tierra. Del 1 al 4, las cifras del prototipo ajustadas con capturas en los tamaños de referencia (F3.6c): cada
 * cámara algo más lejos de su objetivo, con el mismo ángulo, y la forma centrada en el hueco entre panel y raíl.
 */
export const CAMERA_KEYFRAMES = [
  { position: [0, 0, 14], target: [0, 0, 0], shiftX: 0 },
  { position: [0, 1.8, 18.4], target: [0, 0, 0], shiftX: -3.4 },
  { position: [0, 12.9, 14.2], target: [0, 0, 0], shiftX: -4.1 },
  { position: [4.8, 5.6, 9.9], target: [0, 0.6, 0], shiftX: -2.6 },
  { position: [0, 1.2, 12.1], target: [0, 0, 0], shiftX: -3.2 },
] as const satisfies readonly CameraKeyframe[];

/**
 * Escritorio para el encuadre: la misma condición que el CSS de los paneles (desde md, 900 px; `tokens.css`
 * lista los cortes en su cabecera), para que la escena se aparte justo cuando el texto pasa a un lado.
 */
export const WIDE_LAYOUT_QUERY = '(width >= 900px)';

/**
 * Paralaje con el ratón (camara-y-encuadre.md): la posición se mueve hasta `x` e `y` unidades con el puntero en
 * el borde de la pantalla, y lo sigue con un suavizado de ritmo `rate` (`min(1, dt · rate)`). Sin ratón dentro
 * de la ventana, vuelve al centro al mismo ritmo.
 */
export const PARALLAX = { x: 0.7, y: 0.45, rate: 2 } as const;

/** Subsemilla de las estrellas de fondo (como las de cada forma, `subSeed`). */
export const STARS_SEED_NAME = 'stars';

/**
 * Suavizado de `m` en la escena (docs/02-experiencia/scroll-y-escena.md → «Suavizado», ADR-028): persigue a
 * `mTarget` a ritmo `rate` (`min(1, dt · rate)`), `reducedRate` con movimiento reducido (casi sin inercia), y llega
 * cuando le falta menos de `epsilon`.
 */
export const M_SMOOTHING = { rate: 3.4, reducedRate: 12, epsilon: 1e-4 } as const;

/**
 * Degradación en caliente (docs/04-escena/rendimiento.md → «Degradación en caliente»): la media de fps de cada
 * ventana de `windowS` segundos; con `slowWindows` ventanas seguidas por debajo de `minFps` (escritorio o móvil),
 * un nivel menos. Los primeros `warmupS` segundos de cada nivel no cuentan (el primer frame compila el shader y
 * sube la geometría).
 */
export const HOT_DEGRADATION = {
  windowS: 2,
  slowWindows: 3,
  warmupS: 2,
  minFps: { desktop: 45, handheld: 26 },
} as const;
