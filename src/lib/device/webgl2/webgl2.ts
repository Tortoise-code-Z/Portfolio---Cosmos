/**
 * ¿Puede este navegador crear un contexto WebGL2? (docs/04-escena/rendimiento.md → «Robustez»). Se
 * pregunta antes de descargar la escena: sin WebGL2 no se pide el chunk de Three.js y se pasa directo al
 * modo sin WebGL. Crea un lienzo suelto, pide el contexto y lo suelta enseguida (los navegadores limitan
 * cuántos contextos vivos hay a la vez). Un navegador que lanza al pedirlo cuenta como «no»: se registra.
 */
export function hasWebGL2(doc: Document = document): boolean {
  try {
    const context = doc.createElement('canvas').getContext('webgl2');
    if (context === null) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch (error) {
    console.error('[scene] WebGL2 detection failed', error);
    return false;
  }
}
