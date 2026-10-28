import { test as base } from '@playwright/test';

import { forceSoftwareWebGL } from './helpers.ts';

/**
 * El `test` de los e2e: el de Playwright con una sola diferencia. En Chromium, la escena arranca siempre en Bajo
 * (`forceSoftwareWebGL`), como en las capturas: el nivel no depende de la máquina y la degradación en caliente no
 * lo cambia a mitad de un test. Los e2e que necesitan otro nivel lo fuerzan ellos (los de la degradación arrancan
 * en Alto: su script va después y gana). ESLint obliga a importar `test` de aquí en los specs.
 */
export const test = base.extend({
  page: async ({ page, browserName }, provide) => {
    if (browserName === 'chromium') await forceSoftwareWebGL(page);
    await provide(page);
  },
});
