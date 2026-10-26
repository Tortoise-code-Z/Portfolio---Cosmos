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
