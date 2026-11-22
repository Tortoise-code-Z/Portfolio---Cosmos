import type { Project, ProjectDetail, ProjectEntry, ProjectMedia } from '../types';
import { astrohub } from './details/astrohub';
import { chessmate } from './details/chessmate';
import { cosmos } from './details/cosmos';
import { projectEntries } from './entries';
import { projectMedia } from './media';

const NO_MEDIA: ProjectMedia = { cover: null, gallery: [] };

type BySlug<T> = Readonly<Partial<Record<string, T>>>;

/**
 * El detalle de cada proyecto, por `slug`. Solo se importa aquí (ESLint), y este módulo, solo desde la
 * página de proyecto y los tests: la home lee las tarjetas (`entries.ts`) y no carga estos textos
 * (ADR-036).
 */
export const projectDetails: BySlug<ProjectDetail> = { chessmate, astrohub, cosmos };

/**
 * Junta cada tarjeta con su detalle (el stack, entero) y sus imágenes (sin entrada: ninguna). Un proyecto
 * sin detalle lanza: rompe el build, porque el pre-renderizado carga este módulo.
 */
export function assembleProjects(
  entries: readonly ProjectEntry[],
  details: BySlug<ProjectDetail>,
  media: BySlug<ProjectMedia>,
): Project[] {
  return entries.map((entry) => {
    const detail = details[entry.slug];
    if (detail === undefined) throw new Error(`El proyecto «${entry.slug}» no tiene detalle`);
    return {
      ...entry,
      ...detail,
      stack: { ...entry.stack, ...detail.stack },
      ...(media[entry.slug] ?? NO_MEDIA),
    };
  });
}

/** Todos los proyectos enteros, en orden de lectura (`order`): lo que pinta la página de proyecto. */
export const projects: readonly Project[] = assembleProjects(
  projectEntries,
  projectDetails,
  projectMedia,
);
