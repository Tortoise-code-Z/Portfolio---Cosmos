// Partículas de la escena (docs/04-escena/particulas-y-shaders.md). Un vértice por partícula: se evalúan solo
// la forma actual y la siguiente (`m`) y se mezclan. Las etiquetas (TURTLE_*, EARTH_*, PLATE_*), las medidas del
// retrato (PORTRAIT_*) y los colores (COLOR_*) llegan en la cabecera que genera `scene/shaders/glslHeader` desde
// TypeScript.
// Tres.js añade `position`, las matrices, `cameraPosition` y la precisión (ShaderMaterial).

attribute vec3 pGal;
attribute vec3 pTur;
attribute vec3 pEar;
attribute vec4 pPor;
attribute vec4 aR;

uniform float uM;
uniform float uTime;
uniform float uCharge;
uniform float uPR;
uniform float uPlate;
uniform float uGrav;
uniform float uAspect;
uniform vec2 uMouse;
uniform float uMotion;
uniform float uExtras;
uniform float uPor;

varying vec3 vCol;
varying float vA;

const float PI = 3.14159265;
const float LAST_M = 4.999;

// Retraso por partícula del morph (aR.x) y dispersión a mitad de camino.
const float MORPH_DELAY = 0.25;
const float MORPH_SPAN = 0.75;
const float MORPH_SCATTER = 1.1;
// Explosión (forma 0 → 1): salida exponencial, rebasamiento y color incandescente.
const float BANG_EASE = 9.0;
const float BANG_OVERSHOOT = 0.55;
const float FLASH_GAIN = 2.2;

// Tamaño en pantalla: atenuación por distancia y tope en píxeles.
const float SIZE_DISTANCE = 24.0;
const float SIZE_MAX_PX = 48.0;

// Gravedad del cursor (en pantalla, tras proyectar).
const float GRAV_FALLOFF = 14.0;
const float GRAV_SWIRL = 1.3;
const float GRAV_RADIAL = 0.5;
const float GRAV_REACH = 0.22;
const float GRAV_GLOW = 1.6;

vec3 rotY(vec3 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}

// Ruido de senos anidados para colorear (no tiene que coincidir con el de los generadores: formas.md).
float nz(vec3 p) {
  return (
    sin(p.x * 1.7 + sin(p.y * 1.3 + p.z * 0.7) * 1.5) +
    sin(p.y * 2.1 + sin(p.z * 1.9 + p.x * 0.5) * 1.2) +
    sin(p.z * 1.5 + sin(p.x * 2.3 + p.y * 0.9) * 1.4)
  ) / 3.0;
}

float hash(float n) {
  return fract(sin(n) * 43758.5453);
}

bool isTag(float tag, float value) {
  return abs(tag - value) < 0.5;
}

// Forma 0 · singularidad: la dirección de `position` escalada casi a cero; la carga la hincha y la hace vibrar.
void singularity(out vec3 P, out vec3 C, out float S, out float A) {
  vec3 dir = normalize(position + vec3(0.0001));
  float r = 0.025 + uCharge * 0.5 * aR.x;
  r *= 1.0 + sin(uTime * 45.0 + aR.w * 60.0) * uCharge * 0.3;
  P = dir * r;
  C = mix(COLOR_SINGULARITY_WARM, COLOR_SINGULARITY_ICE, aR.w);
  S = 1.0 + uCharge * 1.4;
  A = 0.2 + uCharge * 0.2;
}

// Forma 1 · nebulosa: giro lento, deriva por partícula y color por ruido; núcleo caliente en el centro.
void nebula(out vec3 P, out vec3 C, out float S, out float A) {
  vec3 p = rotY(position, uTime * 0.018);
  p += 0.06 * uMotion * vec3(
    sin(uTime * 0.4 + aR.x * 40.0),
    cos(uTime * 0.35 + aR.w * 40.0),
    sin(uTime * 0.3 + aR.x * 25.0)
  );
  vec3 c = mix(COLOR_NEBULA_VIOLET, COLOR_NEBULA_MAGENTA, smoothstep(-0.3, 0.4, nz(position * 0.35)));
  c = mix(c, COLOR_NEBULA_TEAL, smoothstep(0.15, 0.7, nz(position * 0.5 + 3.0)));
  c = mix(c, COLOR_NEBULA_AMBER, smoothstep(0.45, 0.9, nz(position * 0.8 - 2.0)) * 0.7);
  c = mix(COLOR_NEBULA_CORE * 1.8, c, smoothstep(0.25, 2.0, length(position)));
  P = p;
  C = c * (0.7 + 0.6 * aR.x);
  S = mix(1.0, 3.6, aR.w * aR.w);
  A = 0.5;
}

// Forma 2 · galaxia: giro lento; núcleo cálido que pasa a los brazos (algunos con toque rosa).
void galaxy(out vec3 P, out vec3 C, out float S, out float A) {
  float rr = length(pGal.xz) / 8.0;
  vec3 arm = mix(COLOR_GALAXY_ARM, COLOR_GALAXY_ARM_PINK, step(0.84, aR.w));
  P = rotY(pGal, uTime * 0.035);
  C = mix(COLOR_GALAXY_CORE * 1.5, arm, smoothstep(0.0, 0.42, rr)) * (0.65 + 0.7 * aR.x);
  S = 0.9 + aR.w * 1.6;
  A = 0.6;
}

// Forma 3 · tortuga: aletas (delanteras y traseras en contrafase), cabeza y ojos que asienten, estela que fluye
// hacia atrás (escondida en Bajo), balanceo de todo el cuerpo; color por parte y placas con proyecto.
void turtle(out vec3 P, out vec3 C, out float S, out float A) {
  vec3 p = pTur;
  float tag = aR.y;
  float fade = 1.0;
  bool flipper = tag > TURTLE_FLIPPER - 0.5 && tag < TURTLE_FLIPPER + TURTLE_FLIPPERS - 0.5;
  bool plate = tag > PLATE_FIRST - 0.5 && tag < PLATE_LAST + 0.5;

  if (flipper) {
    float reach = max(abs(p.z) - 1.5, 0.0) * uMotion;
    float phase = tag < TURTLE_FLIPPER + TURTLE_FLIPPERS * 0.5 - 0.5 ? 0.0 : PI;
    p.y += sin(uTime * 1.3 + phase) * 0.42 * reach;
    p.x += cos(uTime * 1.3 + phase) * 0.16 * reach;
  }
  if (isTag(tag, TURTLE_HEAD) || isTag(tag, TURTLE_EYES)) p.y += sin(uTime * 0.8) * 0.06 * uMotion;
  if (isTag(tag, TURTLE_WAKE)) {
    float d0 = -3.0 - pTur.x;
    float d1 = mod(d0 + uTime * 0.8 * uMotion, 7.0);
    float sc = (0.3 + d1) / (0.3 + d0);
    p = vec3(-3.0 - d1, pTur.y * sc, pTur.z * sc);
    p.y += sin(uTime + aR.x * 20.0) * 0.08 * uMotion;
    fade = smoothstep(0.0, 0.6, d1) * (1.0 - smoothstep(4.0, 7.0, d1)) * uExtras;
  }
  p = rotY(p, sin(uTime * 0.25) * 0.18 * uMotion);
  p.y += sin(uTime * 0.7) * 0.15 * uMotion;

  vec3 c = COLOR_TURTLE_SHELL;
  float s = 1.3 + aR.w * 0.8;
  float a = 0.7;
  if (isTag(tag, TURTLE_SHELL_EDGE)) {
    c = COLOR_TURTLE_EDGE;
  } else if (plate) {
    c = COLOR_TURTLE_PLATE * 1.05;
    // Dentro de la rama de placas: uPlate = 0 («ninguna») nunca casa con una etiqueta de placa (20..26). El pulso,
    // solo con movimiento.
    if (abs(tag - uPlate) < 0.5) {
      c = COLOR_TURTLE_PLATE_LIT * (2.0 + 0.6 * sin(uTime * 5.0) * uMotion);
      s += 0.7;
    }
  } else if (isTag(tag, TURTLE_FOREST)) {
    c = COLOR_TURTLE_FOREST;
  } else if (isTag(tag, TURTLE_HEAD) || flipper || isTag(tag, TURTLE_TAIL)) {
    c = COLOR_TURTLE_BODY;
  } else if (isTag(tag, TURTLE_EYES)) {
    c = COLOR_TURTLE_EYES * 2.0;
    s = 2.6;
  } else if (isTag(tag, TURTLE_WAKE)) {
    c = COLOR_TURTLE_WAKE * 0.85;
    a = 0.55 * fade;
  } else if (isTag(tag, TURTLE_PLASTRON)) {
    c = COLOR_TURTLE_PLASTRON * 0.6;
  }
  P = p;
  C = c * (0.75 + 0.5 * aR.x);
  S = s;
  A = a;
}

// Forma 4 · Tierra: giro lento, luz del Sol fija (día, noche y amanecer), luces de ciudad en la tierra de noche
// (no en Bajo) y atmósfera con Fresnel según la cámara.
void earth(out vec3 P, out vec3 C, out float S, out float A) {
  vec3 p = rotY(pEar, uTime * 0.05);
  float tag = aR.z;
  vec3 n = normalize(p);
  float lam = dot(n, normalize(vec3(-0.72, 0.3, -0.45)));
  float day = smoothstep(-0.12, 0.45, lam);
  float q = lam * 4.5;
  float dawn = exp(-q * q);
  vec3 base = COLOR_EARTH_OCEAN;
  if (isTag(tag, EARTH_LAND)) base = mix(COLOR_EARTH_LAND, COLOR_EARTH_DESERT, aR.x);
  else if (isTag(tag, EARTH_CLOUDS)) base = COLOR_EARTH_CLOUDS;
  vec3 c = base * mix(0.04, 1.25, day);
  c += COLOR_EARTH_DAWN * dawn * (isTag(tag, EARTH_CLOUDS) || isTag(tag, EARTH_ATMOSPHERE) ? 0.9 : 0.45);
  if (isTag(tag, EARTH_LAND) && lam < -0.15 && aR.w > 0.8) c += COLOR_EARTH_CITY * 0.9 * uExtras;
  float s = 1.2 + aR.w * 0.6;
  float a = 0.75;
  if (isTag(tag, EARTH_ATMOSPHERE)) {
    float rim = max(1.0 - abs(dot(n, normalize(cameraPosition - p))), 0.0);
    c = COLOR_EARTH_ATMOSPHERE * pow(rim, 2.5) * 2.2 * (0.25 + day) + COLOR_EARTH_RIM * dawn * pow(rim, 2.0);
    s = 2.2;
    a = 0.6;
  }
  P = p;
  C = c;
  S = s;
  A = a;
}

// Forma 5 · retrato: holograma de escáner con la luz de la foto (pPor.w), fallos de señal (una franja salta de
// lado un instante) y giro limitado con el ratón. Llega apagado: el haz de barrido baja con el morph (m de 4 a 5)
// y enciende lo que deja atrás; después pasa en bucle. Con movimiento reducido, encendido y sin haz ni fallos.
// Hasta que llega el retrato (uPor 0), la Tierra; al llegar, uPor sube a 1 en un instante y cada partícula pasa de
// la Tierra al retrato con su retraso del morph (si llega con la escena ya aquí, el haz baja con esa subida).
void portrait(out vec3 P, out vec3 C, out float S, out float A) {
  vec3 p = pPor.xyz;
  // El tick se acota: con uTime grande, sin() pierde precisión en la GPU y los fallos dejarían de ser al azar.
  float tick = mod(floor(uTime * 5.0), 997.0);
  float band = floor(p.y * 9.0);
  float glitch = uMotion * step(0.99, hash(band * 1.37 + tick * 17.1));
  p.x += glitch * (hash(band * 7.3 + tick) - 0.5) * 0.47;
  p = rotY(p, clamp(uMouse.x, -1.0, 1.0) * uGrav * 0.44);
  float f = min(smoothstep(0.3, 1.0, uM - 4.0), uPor);
  float sweep = mix(PORTRAIT_HALF_H, -PORTRAIT_HALF_H - 0.3, f);
  // Al acabar el barrido entra el haz en bucle, fundido (sin saltar a mitad de la cara). Bases al cuadrado, nunca pow.
  float q = (pPor.y - sweep) * 3.0;
  float r = (pPor.y - PORTRAIT_HALF_H * 1.1 + mod(uTime * 1.3, PORTRAIT_HALF_H * 3.0)) * 3.0;
  float beam = mix(exp(-q * q), exp(-r * r), smoothstep(0.8, 1.0, f));
  float lit = max(smoothstep(sweep - 0.05, sweep + 0.1, pPor.y), 1.0 - uMotion);
  // El haz y los fallos no encienden lo que la foto funde (el corte del busto, abajo): el mismo fundido, por la altura.
  float i = pPor.w + (beam * uMotion + glitch * 0.6) * smoothstep(-PORTRAIT_HALF_H, PORTRAIT_FADE_H - PORTRAIT_HALF_H, pPor.y);
  i *= 0.93 + 0.07 * sin(uTime * 23.0 + pPor.y * 3.0);
  vec3 c = i < 0.6
    ? mix(COLOR_PORTRAIT_DEEP, COLOR_PORTRAIT_GLOW, i / 0.6)
    : mix(COLOR_PORTRAIT_GLOW, COLOR_PORTRAIT_HOT, clamp((i - 0.6) / 0.8, 0.0, 1.0));
  P = p;
  C = c * i * i * 1.5 * mix(0.12, 1.0, lit);
  S = 1.5;
  A = 0.8;
  if (uPor < 1.0) {
    vec3 EP; vec3 EC; float ES; float EA;
    earth(EP, EC, ES, EA);
    float w = smoothstep(0.0, 1.0, clamp((uPor - aR.x * MORPH_DELAY) / MORPH_SPAN, 0.0, 1.0));
    P = mix(EP, P, w);
    C = mix(EC, C, w);
    S = mix(ES, S, w);
    A = mix(EA, A, w);
  }
}

void shape(float k, out vec3 P, out vec3 C, out float S, out float A) {
  if (k < 0.5) singularity(P, C, S, A);
  else if (k < 1.5) nebula(P, C, S, A);
  else if (k < 2.5) galaxy(P, C, S, A);
  else if (k < 3.5) turtle(P, C, S, A);
  else if (k < 4.5) earth(P, C, S, A);
  else portrait(P, C, S, A);
}

void main() {
  float m = clamp(uM, 0.0, LAST_M);
  float k = floor(m);
  float tt = smoothstep(0.0, 1.0, clamp((m - k - aR.x * MORPH_DELAY) / MORPH_SPAN, 0.0, 1.0));

  vec3 PA; vec3 PB; vec3 CA; vec3 CB; float SA; float SB; float AA; float AB;
  shape(k, PA, CA, SA, AA);
  shape(k + 1.0, PB, CB, SB, AB);

  vec3 P;
  vec3 C;
  if (k < 0.5) {
    P = mix(PA, PB, 1.0 - pow(2.0, -BANG_EASE * tt)) + PB * sin(tt * PI) * BANG_OVERSHOOT;
    C = mix(COLOR_FLASH * FLASH_GAIN, CB, smoothstep(0.05, 0.85, tt));
  } else {
    vec3 jitter = vec3(
      sin(aR.x * 31.0 + uTime * 0.5),
      cos(aR.w * 29.0 + uTime * 0.4),
      sin(aR.w * 23.0 - uTime * 0.3)
    );
    // Sin retrato, del 4 al 5 la Tierra va a sí misma: sin dispersión (no se hincha); con él, a la vez que sube.
    P = mix(PA, PB, tt) + jitter * sin(tt * PI) * MORPH_SCATTER * (k > 3.5 ? uPor : 1.0);
    C = mix(CA, CB, tt);
  }
  float S = mix(SA, SB, tt);
  vA = mix(AA, AB, tt);

  vec4 mv = modelViewMatrix * vec4(P, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = min(S * uPR * (SIZE_DISTANCE / -mv.z), SIZE_MAX_PX);

  // Gravedad del cursor, en pantalla y sin tocar la geometría (uGrav 0: táctil, sin ratón dentro, movimiento reducido).
  vec2 d = gl_Position.xy / gl_Position.w - uMouse;
  d.x *= uAspect;
  float f = exp(-dot(d, d) * GRAV_FALLOFF) * uGrav;
  vec2 off = (vec2(-d.y, d.x) * GRAV_SWIRL + d * GRAV_RADIAL) * f * GRAV_REACH;
  off.x /= uAspect;
  gl_Position.xy += off * gl_Position.w;
  vCol = C * (1.0 + f * GRAV_GLOW);
}
