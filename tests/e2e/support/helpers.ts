import type { Page } from '@playwright/test';

import { projectEntries } from '../../../src/content/projects/entries.ts';
import type { ProjectEntry } from '../../../src/content/types.ts';

/**
 * Ayudas compartidas por los e2e (una sola copia: DEVELOPMENT_RULES.md §5, «sin duplicación»).
 */

/**
 * Recoge los errores de la página y de la consola desde este momento, para exigir «0 errores» (métrica
 * del brief). Se llama antes de `page.goto` y se compara al final con `expect(errors).toEqual([])`.
 */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

/** El proyecto del contenido con ese slug; si no existe, el spec falla al cargar con un mensaje claro. */
export function projectBySlug(slug: string): ProjectEntry {
  const project = projectEntries.find((candidate) => candidate.slug === slug);
  if (project === undefined) throw new Error(`No hay ningún proyecto «${slug}» en el contenido`);
  return project;
}
