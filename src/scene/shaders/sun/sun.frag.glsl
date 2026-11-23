// El brillo del Sol: núcleo y halo que se apaga hasta el borde del cuadrado (el degradado del prototipo, sin textura;
// el mismo perfil que las estrellas de las constelaciones).

uniform float uOpacity;

varying vec2 vUv;
varying vec3 vCore;
varying vec3 vGlow;

const float CORE = 0.18;
const float HALO = 0.45;

void main() {
  float d = length(vUv);
  if (d > 1.0) discard;
  float a = d < CORE
    ? mix(1.0, 0.8, d / CORE)
    : d < HALO
      ? mix(0.8, 0.18, (d - CORE) / (HALO - CORE))
      : mix(0.18, 0.0, (d - HALO) / (1.0 - HALO));
  gl_FragColor = vec4(mix(vCore, vGlow, smoothstep(CORE, HALO, d)), a * uOpacity);
}
