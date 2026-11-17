// Constelaciones (docs/04-escena/constelaciones-y-placas.md): las estrellas (puntos) y sus líneas comparten este
// vertex shader. Tamaño fijo en pantalla (no depende de la distancia) y los colores de la paleta.

uniform float uSize;
uniform float uPR;
uniform float uLine;

varying vec3 vCore;
varying vec3 vGlow;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uSize * uPR;
  vCore = mix(COLOR_CONSTELLATION_STAR, COLOR_CONSTELLATION_LINE, uLine);
  vGlow = mix(COLOR_CONSTELLATION_GLOW, COLOR_CONSTELLATION_LINE, uLine);
}
