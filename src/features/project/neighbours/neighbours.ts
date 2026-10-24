import type { Project } from '~/content/types';

export interface Neighbours {
  readonly prev: Project | undefined;
  readonly next: Project | undefined;
}

/**
 * Proyecto anterior y siguiente en el orden de lectura (docs/02-experiencia/pagina-proyecto.md → «Pie
 * del proyecto»). Sin vuelta: el primero no tiene anterior y el último no tiene siguiente, así que
 * nadie da vueltas sin saber dónde acaba la lista. Un slug que no está devuelve los dos vacíos.
 */
export function neighbours(projects: readonly Project[], slug: string): Neighbours {
  const index = projects.findIndex((project) => project.slug === slug);
  if (index === -1) return { prev: undefined, next: undefined };
  return { prev: projects[index - 1], next: projects[index + 1] };
}
