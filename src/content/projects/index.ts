import type { Project, ProjectMedia } from '../types';
import { projectEntries } from './entries';
import { projectMedia } from './media';

const NO_MEDIA: ProjectMedia = { cover: null, gallery: [] };

/** Todos los proyectos con sus imágenes, en orden de lectura (`order`): lo que pinta el sitio. */
export const projects: readonly Project[] = projectEntries.map((entry) => ({
  ...entry,
  ...(projectMedia[entry.slug] ?? NO_MEDIA),
}));
