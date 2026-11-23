import type { Project } from '~/content/types';

/**
 * Huecos del caparazón para las placas de proyecto (docs/04-escena/constelaciones-y-placas.md → «Huecos del
 * caparazón»): celdas de la rejilla hexagonal (coordenadas axiales `q, r`) por orden de prioridad, todas en la
 * parte de arriba. La etiqueta (20..26) es la que lleva cada partícula de esa celda en `aR.y`, separada de las
 * partes del cuerpo (0..14) para no chocar.
 */

export interface PlateSlot {
  readonly q: number;
  readonly r: number;
  readonly label: number;
}

export const PLATE_SLOTS: readonly PlateSlot[] = [
  { q: 0, r: 0, label: 20 },
  { q: -1, r: 0, label: 21 },
  { q: 1, r: 0, label: 22 },
  { q: 0, r: -1, label: 23 },
  { q: 0, r: 1, label: 24 },
  { q: 1, r: -1, label: 25 },
  { q: -1, r: 1, label: 26 },
];

export const FIRST_PLATE_LABEL = 20;
export const LAST_PLATE_LABEL = 26;
/** Ninguna placa: `uPlate` 0 no casa con ninguna etiqueta de placa. */
export const NO_PLATE = 0;

/** El resaltado de las placas (docs/04-escena/constelaciones-y-placas.md → «Resaltado»). */
export const PLATE_LOOK = {
  /** Su capítulo (la tortuga): su presencia, `math/chapterPresence`. */
  chapter: 3,
  /** A esta presencia o menos, ninguna placa encendida (el prototipo). */
  litFrom: 0.2,
  /** Sin nada señalado, una placa cada 2,6 s. */
  cycleSeconds: 2.6,
  /** Por encima de esta presencia los pins reciben el puntero (`data-live`). */
  interactiveFrom: 0.6,
} as const;

/**
 * El pin de una placa (docs/03-diseno/componentes.md → «Pin de placa»), en píxeles CSS salvo `liftY` (unidades de la
 * escena: el pie, un poco por encima del caparazón): el tallo de 46 px, un hueco de 4 y encima la etiqueta, que
 * empieza 2 px a la izquierda del tallo. La etiqueta es mono de 11 px (10 por debajo de 900 px) en mayúsculas, con
 * 0,6 em por letra más el espacio entre letras (`--tracking-micro`), 8 px de aire a los lados y 4 arriba y abajo, una
 * línea de 16 y su borde. Si choca con otro pin, sube un piso (el tallo crece una etiqueta y su hueco), hasta
 * `floors` pisos. El CSS de `scene/PlatePins` la sigue: lo comprueba su test.
 */
export const PLATE_PIN = {
  liftY: 0.06,
  stemPx: 46,
  gapPx: 4,
  tagLeftPx: 2,
  fontPx: 11,
  narrowFontPx: 10,
  advanceEm: 0.6,
  trackingEm: 0.1,
  padInlinePx: 8,
  padBlockPx: 4,
  lineHeightPx: 16,
  borderPx: 1,
  tagHeightPx: 26,
  floors: 3,
} as const;

/** Un proyecto en su placa. */
export interface PlateAssignment {
  readonly slug: string;
  readonly label: number;
}

/** Lo que mira la asignación: los proyectos llegan por parámetro (de `content`, solo el tipo). */
export type PlateProject = Pick<Project, 'slug' | 'order' | 'featured'>;

/**
 * Qué proyecto va en cada placa: el `featured` al hueco 0 y el resto, por `order`, a los siguientes. Como
 * mucho 7: los que sobren siguen en la lista del capítulo, pero no tienen placa.
 */
export function assignPlates(projects: readonly PlateProject[]): PlateAssignment[] {
  const ordered = [...projects].sort(
    (a, b) => Number(b.featured) - Number(a.featured) || a.order - b.order,
  );
  return PLATE_SLOTS.flatMap((slot, index) => {
    const project = ordered[index];
    return project === undefined ? [] : [{ slug: project.slug, label: slot.label }];
  });
}

/**
 * La etiqueta de la placa de un proyecto, o `NO_PLATE` (sin proyecto o sin placa). Sin objetos nuevos: va por frame.
 */
export function plateLabelOf(plates: readonly PlateAssignment[], slug: string | null): number {
  for (const plate of plates) if (plate.slug === slug) return plate.label;
  return NO_PLATE;
}

/** El proyecto de una placa, o `null` (ninguna, o una sin proyecto). */
export function plateSlugOf(plates: readonly PlateAssignment[], label: number): string | null {
  for (const plate of plates) if (plate.label === label) return plate.slug;
  return null;
}
