import type { BrowserContext, Page } from '@playwright/test';

import { projectEntries } from '../../../src/content/projects/entries.ts';
import type { ProjectEntry } from '../../../src/content/types.ts';
import { LOW_MEMORY_GB } from '../../../src/lib/device/sceneLevel/sceneLevel.ts';

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

/** La escena montada de verdad: `SceneRoot` lo marca cuando existe el renderer (no basta el `<canvas>`). */
export const SCENE_READY = '[data-ready="true"]:has(canvas)';

/**
 * Espera a que el sitio decida la escena (la escena montada o el modo sin WebGL) y, si salió el aviso «sin WebGL»,
 * lo descarta. Para los tests que miden la posición del scroll al usar algo del pie de la ventana: en un
 * navegador sin WebGL (un motor del CI sin GPU) el aviso flota abajo y, por accesibilidad, sube lo
 * enfocado por encima de él (`Notice`), lo que movería la página. No vale si la sugerencia de idioma está
 * a la vista: el aviso sin WebGL espera su turno y saldría después.
 */
export async function settleScene(page: Page): Promise<void> {
  await page.waitForFunction(
    (ready) =>
      document.querySelector(ready) !== null ||
      document.documentElement.classList.contains('no-gl'),
    SCENE_READY,
  );
  const gotIt = page.getByRole('button', { name: /^(?:Got it|Entendido)$/ });
  if (await gotIt.isVisible()) await gotIt.click();
}

/**
 * El `renderer` que dicen tener los navegadores de los tests que se presentan como GPU (`presentWebGLAsHardware`):
 * un nombre de ANGLE inventado, sin nada de los de software (`isSoftwareRenderer`).
 */
export const FAKE_GPU_RENDERER = 'ANGLE (e2e, Fake GPU for the tests, Direct3D11)';

/**
 * El `renderer` de Chromium sin GPU, tal cual (el de la imagen de Playwright y el de PageSpeed): para fingir WebGL
 * pintado por software (`presentWebGLAsRenderer`).
 */
export const SWIFTSHADER_RENDERER =
  'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)';

/**
 * WebGL que dice pintar con `renderer` para la detección (`detectWebGL2`, ADR-029): `RENDERER` y
 * `UNMASKED_RENDERER_WEBGL` devuelven ese nombre y el contexto se da aunque se pida `failIfMajorPerformanceCaveat`
 * (como Chromium sin GPU). Solo cambia lo que se lee: se sigue pintando con lo que haya (SwiftShader en la imagen).
 * Va antes de cargar la página (`addInitScript`): en una página, solo para ella; en un contexto, para todas las suyas.
 */
export async function presentWebGLAsRenderer(
  target: Page | BrowserContext,
  renderer: string,
): Promise<void> {
  await target.addInitScript((name) => {
    // eslint-disable-next-line @typescript-eslint/unbound-method -- se llama con `.call(this, …)`
    const getContext = HTMLCanvasElement.prototype.getContext;
    function withoutCaveat(
      this: HTMLCanvasElement,
      type: string,
      attributes?: WebGLContextAttributes,
    ): RenderingContext | null {
      const rest = { ...attributes };
      delete rest.failIfMajorPerformanceCaveat;
      return getContext.call(this, type, rest);
    }
    HTMLCanvasElement.prototype.getContext = withoutCaveat as typeof getContext;
    // `RENDERER` y `WEBGL_debug_renderer_info.UNMASKED_RENDERER_WEBGL` (los números del estándar).
    const RENDERER_PARAMETERS: readonly number[] = [0x1f01, 0x9246];
    const prototypes = [
      window.WebGLRenderingContext as typeof WebGLRenderingContext | undefined,
      window.WebGL2RenderingContext as typeof WebGL2RenderingContext | undefined,
    ].flatMap((kind) => (kind === undefined ? [] : [kind.prototype]));
    for (const prototype of prototypes) {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- se llama con `.call(this, …)`
      const getParameter = prototype.getParameter;
      prototype.getParameter = function named(this: WebGLRenderingContext, parameter: number) {
        return RENDERER_PARAMETERS.includes(parameter)
          ? name
          : (getParameter.call(this, parameter) as unknown);
      } as typeof getParameter;
    }
  }, renderer);
}

/**
 * WebGL «en la tarjeta gráfica» para la detección (`detectWebGL2` → `hardware`): en la imagen de Playwright y en
 * PageSpeed, Chromium pinta con SwiftShader y lo dice en su `renderer`, así que sin esto el sitio iría al modo sin
 * WebGL (ADR-029). Los motores del CI sin GPU que sí tengan WebGL2 también: los tests con escena no dependen de qué
 * `renderer` dé cada uno.
 */
export async function presentWebGLAsHardware(target: Page | BrowserContext): Promise<void> {
  await presentWebGLAsRenderer(target, FAKE_GPU_RENDERER);
}

/**
 * La escena arranca en Bajo, sea cual sea la máquina: WebGL en la tarjeta gráfica (`presentWebGLAsHardware`) y
 * poca memoria (`navigator.deviceMemory`, que el resto del sitio no lee; se define también donde el navegador no
 * lo tiene). Sin esto, en escritorio arrancaría en Alto o Medio según los núcleos y la degradación en caliente
 * (SwiftShader no llega a 45 fps) podría cambiar el nivel a mitad de un test o de una captura.
 */
export async function forceLowScene(target: Page | BrowserContext): Promise<void> {
  await presentWebGLAsHardware(target);
  await target.addInitScript((memory) => {
    Object.defineProperty(Navigator.prototype, 'deviceMemory', {
      configurable: true,
      get: () => memory,
    });
  }, LOW_MEMORY_GB);
}
