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
 * Semiejes del caparazón de la tortuga (forma 3), cabeza hacia +X. Los usan el generador y los pins, que se anclan
 * sobre las placas (`math/platePins`).
 */
export const SHELL = { AX: 2.7, AY: 1.3, AZ: 2.15 } as const;

/** Tamaño de la rejilla hexagonal del caparazón (centro a vértice), *pointy-top*. */
export const HEX_SIZE = 0.95;

/**
 * Cómo se mece la tortuga entera al nadar (docs/04-escena/constelaciones-y-placas.md → «Pins»): gira sobre Y
 * `sin(t · yawRate) · yaw` radianes y sube y baja `sin(t · bobRate) · bob`. Lo aplica el shader (cabecera
 * `TURTLE_SWAY_*`) y, con la misma cuenta, los pins (`math/platePins`): un test los ata.
 */
export const TURTLE_SWAY = { yawRate: 0.25, yaw: 0.18, bobRate: 0.7, bob: 0.15 } as const;

/**
 * Cómo aparece y se va lo que la escena pinta por capítulo (`math/chapterPresence`): presencia
 * `clamp(1 − |m − capítulo| · fade, 0, 1)`, 1 en el capítulo y 0 a ±0,56. Una sola rampa para las constelaciones (2),
 * las placas y los pins (3), y el Sol y la gravedad sobre la Tierra (4).
 */
export const CHAPTER_PRESENCE_FADE = 1.8;

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
 * 4 Tierra · 5 retrato. Del 1 al 4, las cifras del prototipo ajustadas con capturas en los tamaños de referencia (F3.6c): cada
 * cámara algo más lejos de su objetivo, con el mismo ángulo, y la forma centrada en el hueco entre panel y raíl.
 */
export const CAMERA_KEYFRAMES = [
  { position: [0, 0, 14], target: [0, 0, 0], shiftX: 0 },
  { position: [0, 1.8, 18.4], target: [0, 0, 0], shiftX: -3.4 },
  { position: [0, 12.9, 14.2], target: [0, 0, 0], shiftX: -4.1 },
  { position: [4.8, 5.6, 9.9], target: [0, 0.6, 0], shiftX: -2.6 },
  { position: [0, 1.2, 12.1], target: [0, 0, 0], shiftX: -3.2 },
  { position: [0, 0, 8.2], target: [0, 0, 0], shiftX: 0 },
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

/**
 * Gravedad del cursor (docs/04-escena/particulas-y-shaders.md → «Gravedad del cursor»): su intensidad (`uGrav`, de 0
 * a 1) sube con el ratón dentro de la ventana y baja al salir con un suavizado de ritmo `rate` (≈ 0,25 s), sin
 * saltos; por debajo de `epsilon` llega. Con frames de 0,1 s (el tope del reloj: ≤ 10 fps, un frame atascado, el
 * primero tras una pausa) `rate · dt` llega a 1 y entra o se apaga de golpe: aceptado, a esos fps todo va a saltos.
 * La fórmula del remolino, con sus cifras, va en el shader.
 */
export const GRAVITY = { rate: 10, epsilon: 1e-3 } as const;

/**
 * El capítulo de la Tierra (forma 4): el del Sol y el de la gravedad suave. Uno solo, para que no se separen
 * (`config` no importa de `content`, donde están los capítulos del viaje).
 */
export const EARTH_CHAPTER = 4;

/**
 * La gravedad del cursor, más suave sobre la Tierra (docs/02-experiencia/capitulos/04-tierra.md → «Interacciones»):
 * `uGrav` por `lerp(1, scale, presencia)`, con la presencia de su capítulo (`math/chapterPresence`). En el retrato
 * (m = 5) la presencia ya es 0 y su giro con el ratón no cambia; a medio morph (hasta m ≈ 4,56) va suavizado.
 */
export const EARTH_GRAVITY = { chapter: EARTH_CHAPTER, scale: 0.5 } as const;

/**
 * El Sol del capítulo de la Tierra (docs/04-escena/particulas-y-shaders.md → «Sol»): un brillo de `size` unidades de
 * lado que mira a la cámara, en `position`: arriba a la izquierda de la Tierra, a la altura de su limbo superior y casi
 * en su plano (z = −1; el prototipo, −5). La luz de la Tierra
 * sale de aquí (`SUN_DIR` en la cabecera GLSL: la Tierra está en el origen), así que su lado de día mira siempre a
 * este Sol. No va donde el prototipo (−2,6, 3, −5 y 9): su halo cruzaba el borde del panel y el de la barra de arriba
 * y los dibujaba (`04-tierra.md` → «Layout»); más a la izquierda cae sobre el panel, y detrás de la Tierra ilumina su
 * cara de atrás, que se ve a través de las partículas. Late ± `pulse` a ritmo `pulseRate` (quieto con movimiento
 * reducido) y aparece con la presencia de su capítulo, hasta `opacity`.
 */
export const SUN = {
  chapter: EARTH_CHAPTER,
  position: [-1.4, 2.9, -1],
  size: 3.5,
  pulse: 0.15,
  pulseRate: 0.8,
  opacity: 0.95,
} as const satisfies {
  readonly chapter: number;
  readonly position: ScenePoint;
  readonly size: number;
  readonly pulse: number;
  readonly pulseRate: number;
  readonly opacity: number;
};

/** Subsemilla de las estrellas de fondo (como las de cada forma, `subSeed`). */
export const STARS_SEED_NAME = 'stars';

/**
 * Degradación en caliente (docs/04-escena/rendimiento.md → «Degradación en caliente»): la media de fps de cada
 * ventana de `windowS` segundos; con `slowWindows` ventanas seguidas por debajo de `minFps` (escritorio o móvil),
 * un nivel menos. Los primeros `warmupS` segundos de cada nivel no cuentan (la geometría nueva, el DPR y lo que
 * tarde el driver; el frame que compila el shader ya queda fuera: solo se mide con partículas pintadas).
 */
export const HOT_DEGRADATION = {
  windowS: 2,
  slowWindows: 3,
  warmupS: 2,
  minFps: { desktop: 45, handheld: 26 },
} as const;

/**
 * El retrato aparece (`uPor` de 0 a 1) en estos segundos reales cuando llega con la escena ya en la Tierra o en el
 * retrato (docs/04-escena/formas.md → «Retrato»): sin él, saltar al final por el raíl lo cambiaba de golpe. Cada
 * partícula pasa con su retraso del morph y el haz de barrido baja con la subida. Con movimiento reducido, de golpe.
 */
export const PORTRAIT_FADE_IN_S = 0.6;

/**
 * El capítulo del retrato (forma 7 del mapa de formas; el epílogo): donde la escena se mueve con el marco del Crew file
 * (`CameraRig`, ADR-042), con su presencia (`math/chapterPresence`). Uno solo, como `EARTH_CHAPTER` (`config` no
 * importa de `content`).
 */
export const PORTRAIT_CHAPTER = 5;

/**
 * Lo que gira el retrato con el ratón, en radianes, con el puntero en un borde de la ventana (`PORTRAIT_TURN` en la
 * cabecera de los shaders; docs/04-escena/particulas-y-shaders.md → «Retrato»): ~±12,6°. Poco: la cara sale de una
 * sola foto y por los lados y por detrás no está completa (antes, 0,44: ~±25°).
 */
export const PORTRAIT_TURN = 0.22;

/**
 * Las naves que traen las transmisiones (C.7 · naves; docs/02-experiencia/transiciones-naves.md, la prueba v8): cómo
 * se encaja su pantalla con lo que se ve y cómo llegan y se van (`math/shipPose`).
 *
 * - `screenHeight`: el alto de la pantalla de la nave en sus unidades (el ancho sale de la proporción del marco).
 * - `landscape`/`portrait`: la pantalla, en fracción de lo que se ve bajo la barra, con la nave ya de frente: en
 *   horizontal, el 86 % del ancho y hasta el 70 % del alto (y no más de 0,62 del ancho); en vertical, el 90 % del ancho
 *   y el 64 % del alto (los paneles del satélite van arriba y abajo).
 * - `cover`: cuánto más grande que la ventana es la pantalla cuando llena la vista (un margen: sus bordes no se ven).
 * - `birthScale`: su tamaño al nacer, en el centro de la forma de antes; `far`: lo lejos que se va al salir, en veces la
 *   distancia a la que encaja.
 * - `turn`: llega girada (radianes, en Y y en X) y se pone de frente al acercarse; `sway`, lo que se mece después
 *   (radianes, a `swayRate` radianes por segundo).
 * - `flag`: la bandera de Irlanda que cruza por detrás del satélite va `behind · h + gap` por detrás de su pantalla
 *   (`h`, medio alto de la pantalla: la misma cuenta que su sitio en el shader) y sale de la vista con `margin · h` de
 *   más (su ancho).
 */
export const SHIP_FRAME = {
  screenHeight: 2,
  landscape: { width: 0.86, height: 0.7, maxRatio: 0.62 },
  portrait: { width: 0.9, height: 0.64 },
  cover: 1.05,
  birthScale: 0.55,
  far: 3.2,
  turn: { yaw: 0.75, pitch: 0.3 },
  sway: 0.03,
  swayRate: 0.3,
  flag: { behind: 1.94, gap: 0.1, margin: 1.3 },
} as const;

/**
 * Cuándo la nave pasa de luz que se suma a puntos opacos (`uSolid`, `shipSolid`), en fracción del cambio de forma: sube
 * desde `rise` hasta que la nave está formada, y vuelve a ser luz en el primer `fall` del cambio que la deshace.
 */
export const SHIP_SOLID = { rise: 0.55, fall: 0.3 } as const;
