// El Sol del capítulo de la Tierra (docs/04-escena/particulas-y-shaders.md → «Sol»): un cuadrado de lado `uSize`
// que mira siempre a la cámara (se abre en el espacio de la vista desde su centro, la posición del objeto), con los
// colores de la paleta. Un cuadrado y no un punto: el tamaño de un punto tiene tope y en un móvil lo recortaría.

uniform float uSize;

varying vec2 vUv;
varying vec3 vCore;
varying vec3 vGlow;

void main() {
  vec4 view = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  view.xy += position.xy * uSize * 0.5;
  gl_Position = projectionMatrix * view;
  vUv = position.xy;
  vCore = COLOR_SUN_CORE;
  vGlow = COLOR_SUN_GLOW;
}
