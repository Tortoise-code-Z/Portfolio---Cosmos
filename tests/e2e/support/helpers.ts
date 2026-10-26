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

/**
 * Espera a que el sitio decida la escena (el lienzo o el modo sin WebGL) y, si salió el aviso «sin WebGL»,
 * lo descarta. Para los tests que miden la posición del scroll al usar algo del pie de la ventana: en un
 * navegador sin WebGL (un motor del CI sin GPU) el aviso flota abajo y, por accesibilidad, sube lo
 * enfocado por encima de él (`Notice`), lo que movería la página. No vale si la sugerencia de idioma está
 * a la vista: el aviso sin WebGL espera su turno y saldría después.
 */
export async function settleScene(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      document.querySelector('canvas') !== null ||
      document.documentElement.classList.contains('no-gl'),
  );
  const gotIt = page.getByRole('button', { name: /^(?:Got it|Entendido)$/ });
  if (await gotIt.isVisible()) await gotIt.click();
}
