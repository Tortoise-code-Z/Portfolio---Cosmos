// Estrellas de fondo (docs/04-escena/particulas-y-shaders.md → «Estrellas de fondo»): tamaño fijo en pantalla,
// titileo propio (congelado con movimiento reducido: uTime no avanza) y visibilidad que sigue a `m`.

attribute float aR;

uniform float uTime;
uniform float uPR;
uniform float uVisible;

varying float vA;
varying vec3 vC;

const float WARM_SHARE = 0.3;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (0.6 + aR * aR * 2.2) * uPR;
  float twinkle = 0.5 + 0.5 * sin(uTime * (0.6 + aR * 2.0) + aR * 40.0);
  vA = uVisible * (0.35 + 0.65 * twinkle) * (0.3 + aR * 0.7);
  vC = mix(COLOR_STAR_COLD, COLOR_STAR_WARM, step(1.0 - WARM_SHARE, fract(aR * 13.0)));
}
