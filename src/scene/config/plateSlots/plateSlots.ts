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
