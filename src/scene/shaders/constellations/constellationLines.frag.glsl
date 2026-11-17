// Líneas de constelación: un solo color, con la opacidad de su grupo.

uniform float uOpacity;

varying vec3 vCore;

void main() {
  gl_FragColor = vec4(vCore, uOpacity);
}
