// Disco suave por partícula (docs/04-escena/particulas-y-shaders.md → «Shader de fragmentos»). Sin conversión de
// color ni mapeo de tonos: la mezcla aditiva suma la luz tal cual, como el prototipo. Mientras se ve una nave
// (uSolid > 0, C.7 · naves), de luz que se suma a puntos opacos: el color va premultiplicado y el alfa es uSolid (con
// la mezcla ONE, ONE_MINUS_SRC_ALPHA, alfa 0 suma y alfa 1 tapa; sceneMaterials). Con uSolid 0, lo de siempre.

uniform float uSolid;

varying vec3 vCol;
varying float vA;

const float EDGE_SOFTNESS = 1.8;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float glow = pow(1.0 - d * 2.0, EDGE_SOFTNESS) * vA;
  gl_FragColor = uSolid > 0.0
    ? vec4(mix(vCol * glow, vCol * (1.0 - 1.4 * d * d), uSolid), uSolid)
    : vec4(vCol, glow);
}
