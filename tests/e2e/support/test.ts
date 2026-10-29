import { test as base } from '@playwright/test';

import { forceSoftwareWebGL } from './helpers.ts';

/** Las opciones propias de los e2e (`test.use({ … })` en un `describe` las cambia). */
interface SceneOptions {
  /** En Chromium, la escena arranca en Bajo. Por defecto sí; los e2e que fuerzan otro nivel lo apagan. */
  sceneInLow: boolean;
}

/**
 * El `test` de los e2e: el de Playwright con una sola diferencia. En Chromium, la escena de cada página del contexto
 * del test (la `page`, las de `context.newPage()` y los popups) arranca en Bajo (`forceSoftwareWebGL`), como en las
 * capturas: el nivel no depende de la máquina y la degradación en caliente no lo cambia a mitad de un test. Un
 * contexto propio (`browser.newContext()`) no pasa por aquí. Los e2e que necesitan otro nivel apagan `sceneInLow`
 * y lo fuerzan ellos (los de la degradación arrancan en Alto). ESLint obliga a importar `test` de aquí en los specs.
 */
export const test = base.extend<SceneOptions>({
  sceneInLow: [true, { option: true }],
  context: async ({ context, browserName, sceneInLow }, provide) => {
    if (sceneInLow && browserName === 'chromium') await forceSoftwareWebGL(context);
    await provide(context);
  },
});
