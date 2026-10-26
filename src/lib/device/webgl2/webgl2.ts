/**
 * ¿Puede este navegador crear un contexto WebGL2, y con tarjeta gráfica? (docs/04-escena/rendimiento.md →
 * «Robustez» y «Elección inicial»). Se pregunta antes de descargar la escena: sin WebGL2 no se pide el
 * chunk de Three.js y se pasa directo al modo sin WebGL.
 * - `hardware`: da contexto con `failIfMajorPerformanceCaveat` (hay GPU usable).
 * - `software`: solo lo da sin esa opción: pinta con la CPU (SwiftShader, llvmpipe, un escritorio remoto).
 *   La escena arranca en Bajo.
 * - `none`: no hay WebGL2 (desactivado, en la lista negra) o pedirlo lanza (se registra).
 * Cada prueba crea un lienzo suelto, pide el contexto y lo suelta enseguida (los navegadores limitan
 * cuántos contextos vivos hay a la vez).
 */
export type WebGL2Support = 'hardware' | 'software' | 'none';

/** Pide un contexto WebGL2 en un lienzo nuevo y lo suelta: ¿lo dio? */
function tryContext(doc: Document, attributes?: WebGLContextAttributes): boolean {
  const context = doc.createElement('canvas').getContext('webgl2', attributes);
  if (context === null) return false;
  context.getExtension('WEBGL_lose_context')?.loseContext();
  return true;
}

export function detectWebGL2(doc: Document = document): WebGL2Support {
  try {
    if (tryContext(doc, { failIfMajorPerformanceCaveat: true })) return 'hardware';
    return tryContext(doc) ? 'software' : 'none';
  } catch (error) {
    console.error('[scene] WebGL2 detection failed', error);
    return 'none';
  }
}
