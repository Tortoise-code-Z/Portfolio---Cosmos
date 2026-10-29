import { test as base } from '@playwright/test';

import { forceLowScene } from './helpers.ts';

/** Las opciones propias de los e2e (`test.use({ … })` en un `describe` las cambia). */
interface SceneOptions {
  /** La escena arranca en Bajo, en los tres motores. Por defecto sí; los e2e que fuerzan otra cosa lo apagan. */
  sceneInLow: boolean;
}

/**
 * El `test` de los e2e: el de Playwright con una sola diferencia. En cada página del contexto del test (la `page`,
 * las de `context.newPage()` y los popups), WebGL se presenta como GPU y la escena arranca en Bajo
 * (`forceLowScene`), como en las capturas: sin GPU, el `renderer` de software llevaría al modo sin WebGL (ADR-029);
 * el nivel no depende de la máquina y la degradación en caliente no lo cambia a mitad de un test. Un contexto propio
 * (`browser.newContext()`) no pasa por aquí. Los e2e que necesitan otra cosa apagan `sceneInLow` y la fuerzan ellos
 * (los de la degradación arrancan en Alto; los de «por software», con el `renderer` de SwiftShader). ESLint obliga a
 * importar `test` de aquí en los specs.
 */
export const test = base.extend<SceneOptions>({
  sceneInLow: [true, { option: true }],
  context: async ({ context, sceneInLow }, provide) => {
    if (sceneInLow) await forceLowScene(context);
    await provide(context);
  },
});
