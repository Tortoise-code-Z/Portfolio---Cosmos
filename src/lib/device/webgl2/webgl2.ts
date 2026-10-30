/**
 * ¿Puede este navegador crear un contexto WebGL2, y con tarjeta gráfica? (docs/04-escena/rendimiento.md →
 * «Robustez» y «Elección inicial»; ADR-029). Se pregunta antes de descargar la escena: sin WebGL2, o con WebGL2
 * pintado por software, no se pide el chunk de Three.js y se pasa directo al modo sin WebGL.
 * - `hardware`: da contexto con `failIfMajorPerformanceCaveat` y su `renderer` no es de software (o no se puede
 *   leer: se le da el beneficio de la duda, y la degradación en caliente sigue ahí).
 * - `software`: pinta con la CPU. Lo dice el nombre del `renderer` (SwiftShader, llvmpipe…: Chromium sin GPU da
 *   contexto aunque se pida `failIfMajorPerformanceCaveat`) o solo da contexto sin esa opción.
 * - `none`: no hay WebGL2 (desactivado, en la lista negra), o pedirlo o leer su nombre lanza (se registra). Un
 *   navegador que lanza al leer el nombre (una extensión que envuelve `getParameter`) también rompería Three.js, que
 *   lo llama sin parar: mejor sin escena desde el principio (P1).
 * Cada prueba crea un lienzo suelto, pide el contexto y lo suelta enseguida (los navegadores limitan
 * cuántos contextos vivos hay a la vez).
 */
export type WebGL2Support = 'hardware' | 'software' | 'none';

/**
 * Nombres de `renderer` que pintan con la CPU: SwiftShader (Chromium sin GPU, también dentro de «ANGLE (…)»),
 * llvmpipe, softpipe y lavapipe (Mesa en Linux), Microsoft Basic Render Driver (Windows sin controlador) y
 * cualquiera que diga «Software».
 */
const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|lavapipe|software|microsoft basic render/i;

/**
 * Lo que dan en `RENDERER` los navegadores que esconden el nombre (Chromium y Safari; Firefox antiguo): el real
 * va en `WEBGL_debug_renderer_info`. Firefox moderno da el nombre en `RENDERER` y avisa en consola si se pide la
 * extensión, por eso se mira primero `RENDERER`.
 */
const MASKED_RENDERERS: ReadonlySet<string> = new Set(['WebKit WebGL', 'Mozilla']);

/** ¿Este `renderer` pinta con la CPU? */
export function isSoftwareRenderer(renderer: string): boolean {
  return SOFTWARE_RENDERER.test(renderer);
}

/** El nombre de con qué pinta el contexto, o `null` si el navegador no lo da. */
function readRenderer(context: WebGL2RenderingContext): string | null {
  const renderer: unknown = context.getParameter(context.RENDERER);
  if (typeof renderer === 'string' && !MASKED_RENDERERS.has(renderer)) return renderer;
  const info = context.getExtension('WEBGL_debug_renderer_info');
  if (info === null) return null;
  const unmasked: unknown = context.getParameter(info.UNMASKED_RENDERER_WEBGL);
  return typeof unmasked === 'string' ? unmasked : null;
}

/** Lo que dio un contexto WebGL2 antes de soltarlo. */
interface Probe {
  /** Con qué pinta (`null`: no se puede saber). */
  readonly renderer: string | null;
}

/** Pide un contexto WebGL2 en un lienzo nuevo, lee su `renderer` y lo suelta. `null`: no lo dio. */
function probe(doc: Document, attributes: WebGLContextAttributes): Probe | null {
  const context = doc.createElement('canvas').getContext('webgl2', attributes);
  if (context === null) return null;
  try {
    return { renderer: readRenderer(context) };
  } finally {
    context.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

/** Pide un contexto WebGL2 en un lienzo nuevo, sin opciones, y lo suelta: ¿lo dio? */
function hasContext(doc: Document): boolean {
  const context = doc.createElement('canvas').getContext('webgl2');
  if (context === null) return false;
  context.getExtension('WEBGL_lose_context')?.loseContext();
  return true;
}

export function detectWebGL2(doc: Document = document): WebGL2Support {
  try {
    // La prueba que pide GPU: contexto solo si no va a pintar mucho peor (y, aun así, el nombre manda).
    const gpuProbe = probe(doc, { failIfMajorPerformanceCaveat: true });
    if (gpuProbe !== null) {
      const { renderer } = gpuProbe;
      return renderer !== null && isSoftwareRenderer(renderer) ? 'software' : 'hardware';
    }
    // Sin GPU usable: ¿hay WebGL2 aunque sea por software? Aquí el nombre ya no hace falta.
    return hasContext(doc) ? 'software' : 'none';
  } catch (error) {
    console.error('[scene] WebGL2 detection failed', error);
    return 'none';
  }
}
