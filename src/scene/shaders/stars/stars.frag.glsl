// Disco de cada estrella, con borde lineal.

varying float vA;
varying vec3 vC;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  gl_FragColor = vec4(vC, (1.0 - d * 2.0) * vA);
}
