// Disco suave por partícula (docs/04-escena/particulas-y-shaders.md → «Shader de fragmentos»). Sin conversión de
// color ni mapeo de tonos: la mezcla aditiva suma la luz tal cual, como el prototipo.

varying vec3 vCol;
varying float vA;

const float EDGE_SOFTNESS = 1.8;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  gl_FragColor = vec4(vCol, pow(1.0 - d * 2.0, EDGE_SOFTNESS) * vA);
}
