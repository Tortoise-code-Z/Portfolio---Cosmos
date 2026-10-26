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
 * Lente de la cámara (docs/04-escena/camara-y-encuadre.md → «Campo de visión»): 55° en vertical. El FOV de
 * móvil, los keyframes y el encuadre llegan con `CameraRig` (F3.4).
 */
export const CAMERA_LENS = { fov: 55, near: 0.1, far: 400 } as const;

/** Hasta F3.4, la cámara se queda fija en el keyframe del capítulo 0, mirando al origen. */
export const PROVISIONAL_CAMERA_POSITION = [0, 0, 14] as const;

/** Subsemilla de las estrellas de fondo (como las de cada forma, `subSeed`). */
export const STARS_SEED_NAME = 'stars';
