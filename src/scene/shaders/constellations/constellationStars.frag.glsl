// Estrella de constelación: núcleo brillante y halo que se apaga (el degradado del prototipo, sin textura).

uniform float uOpacity;

varying vec3 vCore;
varying vec3 vGlow;

const float CORE = 0.18;
const float HALO = 0.45;

void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float a = d < CORE
    ? mix(1.0, 0.8, d / CORE)
    : d < HALO
      ? mix(0.8, 0.18, (d - CORE) / (HALO - CORE))
      : mix(0.18, 0.0, (d - HALO) / (1.0 - HALO));
  gl_FragColor = vec4(mix(vCore, vGlow, smoothstep(CORE, HALO, d)), a * uOpacity);
}
