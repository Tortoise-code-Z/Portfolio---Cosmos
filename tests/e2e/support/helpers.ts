import {
  expect,
  type BrowserContext,
  type Locator,
  type Page,
  type TestInfo,
} from '@playwright/test';

import { projectEntries } from '../../../src/content/projects/entries.ts';
import type { ProjectEntry } from '../../../src/content/types.ts';
import { LOW_MEMORY_GB } from '../../../src/lib/device/sceneLevel/sceneLevel.ts';
import { FAKE_GPU_RENDERER, RENDERER_PARAMETER, UNMASKED_RENDERER_PARAMETER } from './renderers.ts';

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

/** El HUD (decorativo, `aria-hidden`): el único bloque oculto al lector que empieza por el tiempo cósmico. */
export const hud = (page: Page): ReturnType<Page['locator']> =>
  page.locator('[aria-hidden="true"]', {
    hasText: /^t [=≈]/,
  });

/** La escena montada de verdad: `SceneRoot` lo marca cuando existe el renderer (no basta el `<canvas>`). */
export const SCENE_READY = '[data-ready="true"]:has(canvas)';

/** Partículas pintadas (`SceneRoot` → `data-particles`): las esperan los e2e, las capturas y las fotos fijas. */
export const PARTICLES_PAINTED = '[data-particles="painted"]:has(canvas)';

/** ¿Tiene este navegador WebGL2? (en el CI, Firefox o WebKit sin GPU pueden no tenerlo). */
export async function browserHasWebGL2(page: Page): Promise<boolean> {
  return page.evaluate(() => document.createElement('canvas').getContext('webgl2') !== null);
}

/**
 * Salta el test si este navegador no tiene WebGL2 aquí. Mira en `about:blank`, sin cargar el sitio (la página se
 * queda ahí: cada test va después adonde necesite). Chromium siempre lo tiene (SwiftShader sin GPU): si le faltara,
 * el test falla en vez de saltarse en silencio.
 */
export async function skipWithoutWebGL2(page: Page, testInfo: TestInfo): Promise<void> {
  await page.goto('about:blank');
  const hasWebGL2 = await browserHasWebGL2(page);
  // Por el motor, no por el nombre del proyecto de Playwright (que puede cambiar o repetirse).
  if (page.context().browser()?.browserType().name() === 'chromium')
    expect(hasWebGL2, 'Chromium must have WebGL2').toBe(true);
  testInfo.skip(!hasWebGL2, 'This browser has no WebGL2 here');
}

/**
 * Este navegador dice no a WebGL (como uno sin GPU o con WebGL desactivado). El sitio solo usa `<canvas>` para la
 * escena, así que basta con que ningún lienzo dé contexto. Va antes de cargar la página (`addInitScript`).
 */
export async function withoutWebGL(page: Page): Promise<void> {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
}

/**
 * Espera `frames` frames de la página y, como mínimo, `minMs`. Para lo que no pasa (no se puede sondear): una espera
 * solo en milisegundos son 1–2 frames con WebKit sin GPU (~3 fps en el CI), y la escena avanza por frames (como mucho
 * `MAX_STEP_S` de reloj por frame).
 */
export async function waitFrames(page: Page, frames: number, minMs = 0): Promise<void> {
  await page.evaluate(
    ([count, ms]) =>
      new Promise<void>((resolve) => {
        const start = performance.now();
        let left = count;
        const next = (): void => {
          left -= 1;
          if (left <= 0 && performance.now() - start >= ms) resolve();
          else requestAnimationFrame(next);
        };
        requestAnimationFrame(next);
      }),
    [frames, minMs] as const,
  );
}

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
 * WebGL que dice pintar con `renderer` para la detección (`detectWebGL2`, ADR-029): `RENDERER` y
 * `UNMASKED_RENDERER_WEBGL` devuelven ese nombre y el contexto se da aunque se pida `failIfMajorPerformanceCaveat`
 * (como Chromium sin GPU). Solo cambia lo que se lee: se sigue pintando con lo que haya (SwiftShader en la imagen).
 * Va antes de cargar la página (`addInitScript`): en una página, solo para ella; en un contexto, para todas las suyas.
 */
export async function presentWebGLAsRenderer(
  target: Page | BrowserContext,
  renderer: string,
): Promise<void> {
  await target.addInitScript(
    ({ name, parameters }) => {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- se llama con `.call(this, …)`
      const getContext = HTMLCanvasElement.prototype.getContext;
      function ignoringPerformanceCaveat(
        this: HTMLCanvasElement,
        type: string,
        attributes?: WebGLContextAttributes,
      ): RenderingContext | null {
        const rest = { ...attributes };
        delete rest.failIfMajorPerformanceCaveat;
        return getContext.call(this, type, rest);
      }
      HTMLCanvasElement.prototype.getContext = ignoringPerformanceCaveat as typeof getContext;
      const prototypes = [
        window.WebGLRenderingContext as typeof WebGLRenderingContext | undefined,
        window.WebGL2RenderingContext as typeof WebGL2RenderingContext | undefined,
      ].flatMap((kind) => (kind === undefined ? [] : [kind.prototype]));
      for (const prototype of prototypes) {
        // eslint-disable-next-line @typescript-eslint/unbound-method -- se llama con `.call(this, …)`
        const getParameter = prototype.getParameter;
        prototype.getParameter = function named(this: WebGLRenderingContext, parameter: number) {
          return parameters.includes(parameter)
            ? name
            : (getParameter.call(this, parameter) as unknown);
        } as typeof getParameter;
      }
    },
    { name: renderer, parameters: [RENDERER_PARAMETER, UNMASKED_RENDERER_PARAMETER] },
  );
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
 * Una máquina capaz, sea cual sea la del test: WebGL en la tarjeta gráfica (`presentWebGLAsHardware`), 8 núcleos y
 * 8 GB (`navigator.deviceMemory`, que se define también donde el navegador no lo tiene). En escritorio, la elección
 * inicial da Alto; en una pantalla estrecha, Bajo (por ser un móvil). La usan la degradación en caliente
 * (`scene.spec.ts`, que arranca en Alto) y las fotos fijas (`tests/stills`).
 */
export async function presentCapableMachine(target: Page | BrowserContext): Promise<void> {
  await presentWebGLAsHardware(target);
  await target.addInitScript(() => {
    const CAPABLE = { hardwareConcurrency: 8, deviceMemory: 8 } as const;
    Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', {
      configurable: true,
      get: () => CAPABLE.hardwareConcurrency,
    });
    Object.defineProperty(Navigator.prototype, 'deviceMemory', {
      configurable: true,
      get: () => CAPABLE.deviceMemory,
    });
  });
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

/** Una línea del teletipo de las transmisiones ya escrita: el recorte se abre más allá de la caja (no corta su brillo). */
export const TELETYPE_WRITTEN = 'inset(-24px)';

/** El `clip-path` calculado de cada línea del teletipo de una transmisión (`none` sin armar, o `TELETYPE_WRITTEN`). */
export const lineClips = (section: Locator): Promise<string[]> =>
  section
    .locator('[data-line]')
    .evaluateAll((lines) => lines.map((line) => getComputedStyle(line).clipPath));

/**
 * Las palabras partidas por la mitad (`overflow-wrap: anywhere` las corta cuando no caben en su caja): cada palabra de
 * cada texto visible de la sección, medida con un `Range`; partida, da más de un rectángulo (uno por renglón). Un guion
 * es un corte legítimo: las palabras se separan por espacios y por guiones.
 */
export const brokenWords = (section: Locator): Promise<string[]> =>
  section.evaluate((root) => {
    const broken: string[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
      const text = node.textContent ?? '';
      for (const match of text.matchAll(/[^\s\-‑–—·/]+/gu)) {
        const range = document.createRange();
        range.setStart(node, match.index);
        range.setEnd(node, match.index + match[0].length);
        if (range.getClientRects().length > 1) broken.push(match[0]);
      }
    }
    return broken;
  });

/** Un rectángulo en pantalla: izquierda, arriba, derecha y abajo, en píxeles CSS. */
export type Rect = readonly [left: number, top: number, right: number, bottom: number];

export function overlaps(a: Rect, b: Rect): boolean {
  return a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
}

/** Lo que ocupa un elemento en pantalla, o `null` si no se ve. */
export async function rectOf(locator: Locator): Promise<Rect | null> {
  if (!(await locator.isVisible())) return null;
  const box = await locator.boundingBox();
  return box === null ? null : [box.x, box.y, box.x + box.width, box.y + box.height];
}

/**
 * Desde aquí se ve el HUD (`CosmicHud.module.css`: sin HUD por debajo de `sm`, 520 px). Se comprueba en los dos
 * sentidos (`expectInterface`): si el corte del CSS cambia entre los anchos probados, el test falla.
 */
export const HUD_FROM_PX = 520;

/** La interfaz por encima de la escena en un capítulo (cada pieza, `null` si no se ve). */
export interface InterfaceRects {
  readonly bar: Rect | null;
  readonly rail: Rect | null;
  readonly hud: Rect | null;
  /** El panel del capítulo. */
  readonly panel: Rect | null;
}

/** La barra, el raíl, el HUD y el panel del capítulo cuya sección es `#<chapter>` (`skills`, `projects`…). */
export async function interfaceRects(page: Page, chapter: string): Promise<InterfaceRects> {
  return {
    bar: await rectOf(page.getByRole('banner')),
    rail: await rectOf(page.getByRole('navigation', { name: /^(?:Chapters|Capítulos)$/ })),
    hud: await rectOf(hud(page)),
    panel: await rectOf(page.locator(`#${chapter} > *`).first()),
  };
}

/**
 * La interfaz que se debe ver a este ancho, sin `null`: la barra, el raíl y el panel siempre, y el HUD desde
 * `HUD_FROM_PX` y solo desde ahí (por debajo, `null` es que está oculto). Si un texto o el orden de la página cambian y
 * una pieza deja de encontrarse, el test falla en vez de saltarse su comprobación.
 */
export function expectInterface(ui: InterfaceRects, width: number): void {
  expect(ui.bar, 'bar').not.toBeNull();
  expect(ui.rail, 'rail').not.toBeNull();
  expect(ui.panel, 'panel').not.toBeNull();
  expect(ui.hud === null, 'HUD hidden').toBe(width < HUD_FROM_PX);
}
