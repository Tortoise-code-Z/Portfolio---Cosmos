// Partículas de la escena (docs/04-escena/particulas-y-shaders.md). Un vértice por partícula: se evalúan solo
// las dos formas que se mezclan (`uFrom` y `uTo`, con `uT`: el mapa de formas, ADR-041), y una sola con `uT` 0 (en el
// epílogo, quieta, el retrato; con `uPor` < 1 el retrato vuelve a evaluar la Tierra). Los ids de las formas (SHAPE_*), las etiquetas
// (TURTLE_*, EARTH_*, PLATE_*), el balanceo de la tortuga (también TURTLE_*), las medidas del retrato (PORTRAIT_*) y
// los colores (COLOR_*) llegan en la cabecera que genera `scene/shaders/glslHeader` desde TypeScript.
// Tres.js añade `position`, las matrices, `cameraPosition` y la precisión (ShaderMaterial).

attribute vec3 pGal;
attribute vec3 pTur;
attribute vec3 pEar;
attribute vec4 pPor;
attribute vec4 aR;

uniform float uM;
uniform float uFrom;
uniform float uTo;
uniform float uT;
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
// La nave (C.7 · naves; scene/math/shipPose): centro de su pantalla, ejes (los de la cámara), tamaño, giro (Y, X), su
// pantalla en sus unidades, en vertical o no, hasta dónde cruza la bandera de Irlanda y lo opaca que es (uSolid).
uniform vec3 uShipPos;
uniform mat3 uShipAxes;
uniform float uShipScale;
uniform vec2 uShipTurn;
uniform vec2 uScreen;
uniform float uVert;
uniform float uFlagSpan;
uniform float uSolid;

varying vec3 vCol;
varying float vA;

const float PI = 3.14159265;

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

// ¿Es una nave (de las que traen una transmisión)?
bool isShip(float id) {
  return isTag(id, SHAPE_SATELLITE) || isTag(id, SHAPE_MOTHERSHIP);
}

// ── Piezas de las naves (C.7 · naves: la prueba v8, docs/04-escena/formas.md → «Naves») ──────────────────────────
// Paramétricas: cada partícula elige un punto de una pieza con sus números (aR.x y aR.w, y los que salen de ellos con
// rx), sin datos nuevos. La nave se dibuja en sus unidades (la pantalla en z = 0, mirando a +z) y shape() la coloca.

vec3 rotX(vec3 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
}

// Un número de 0 a 1 por punto, sin sin() (estable en la GPU del móvil con argumentos grandes).
float hash2(vec2 p) {
  vec3 q = fract(p.xyx * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

// Más números por partícula: aR solo trae dos al azar (x y w; y y z son etiquetas de la tortuga y la Tierra).
float rx(float k) {
  return hash2(aR.xw * 4093.0 + k);
}

// Luz de las naves: una principal y un contraluz, con la normal de cada pieza.
const vec3 SHIP_KEY = vec3(-0.45, 0.62, 0.64);
const vec3 SHIP_RIM = vec3(0.7, -0.2, -0.6);
float lit(vec3 n) {
  n = normalize(n);
  return 0.18 + 0.95 * max(dot(n, normalize(SHIP_KEY)), 0.0) + 0.35 * max(dot(n, normalize(SHIP_RIM)), 0.0);
}

// Un punto del borde de un rectángulo de semiejes h (t de 0 a 1, por su perímetro).
vec2 rectEdge(float t, vec2 h) {
  float d = t * 4.0 * (h.x + h.y);
  if (d < 2.0 * h.x) return vec2(-h.x + d, h.y);
  d -= 2.0 * h.x;
  if (d < 2.0 * h.y) return vec2(h.x, h.y - d);
  d -= 2.0 * h.y;
  if (d < 2.0 * h.x) return vec2(h.x - d, -h.y);
  d -= 2.0 * h.x;
  return vec2(-h.x, -h.y + d);
}

// Caja de semiejes e: un punto de su superficie (por área) y su normal.
void boxSurf(vec3 e, float a, float b, float c, out vec3 p, out vec3 n) {
  vec3 ar = vec3(e.y * e.z, e.x * e.z, e.x * e.y);
  float pick = c * (ar.x + ar.y + ar.z);
  float sg = rx(3.0) < 0.5 ? -1.0 : 1.0;
  if (pick < ar.x) {
    p = vec3(sg * e.x, (a * 2.0 - 1.0) * e.y, (b * 2.0 - 1.0) * e.z);
    n = vec3(sg, 0.0, 0.0);
  } else if (pick < ar.x + ar.y) {
    p = vec3((a * 2.0 - 1.0) * e.x, sg * e.y, (b * 2.0 - 1.0) * e.z);
    n = vec3(0.0, sg, 0.0);
  } else {
    p = vec3((a * 2.0 - 1.0) * e.x, (b * 2.0 - 1.0) * e.y, sg * e.z);
    n = vec3(0.0, 0.0, sg);
  }
}

// Una arista de la caja: los contornos hacen que la forma se lea.
vec3 boxEdge(vec3 e, float a, float c) {
  float k = floor(c * 12.0);
  float s1 = mod(k, 2.0) < 1.0 ? -1.0 : 1.0;
  float s2 = mod(floor(k / 2.0), 2.0) < 1.0 ? -1.0 : 1.0;
  float ax = floor(k / 4.0);
  float t = a * 2.0 - 1.0;
  if (ax < 0.5) return vec3(t * e.x, s1 * e.y, s2 * e.z);
  if (ax < 1.5) return vec3(s1 * e.x, t * e.y, s2 * e.z);
  return vec3(s1 * e.x, s2 * e.y, t * e.z);
}

// Tronco de cono a lo largo de z (radio r0 en z0 y r1 en z1): toberas, bocinas, sensores.
void frustum(float r0, float r1, float z0, float z1, float a, float b, out vec3 p, out vec3 n) {
  float an = a * 2.0 * PI;
  vec2 d = vec2(cos(an), sin(an));
  p = vec3(d * mix(r0, r1, b), mix(z0, z1, b));
  n = normalize(vec3(d, (r0 - r1) / max(abs(z1 - z0), 1e-3)));
}

// Plato parabólico de radio rr y profundidad f, con nervios (rib 1); mira a +z.
void dish(float rr, float f, float a, float b, out vec3 p, out vec3 n, out float rib) {
  float an = a * 2.0 * PI;
  rib = 0.0;
  if (rx(5.0) < 0.28) {
    an = floor(a * 12.0) / 12.0 * 2.0 * PI;
    rib = 1.0;
  }
  float r = sqrt(b) * rr;
  p = vec3(cos(an) * r, sin(an) * r, f * r * r / (rr * rr));
  n = normalize(vec3(-2.0 * f * p.xy / (rr * rr), 1.0));
}

// En vertical, la nave se dibuja con x e y cambiadas (los paneles del satélite, arriba y abajo).
vec3 sw(vec3 q) {
  return uVert < 0.5 ? q : vec3(q.y, q.x, q.z);
}

// Singularidad (SHAPE_SINGULARITY): la dirección de `position` escalada casi a cero; la carga la hincha y la hace vibrar.
void singularity(out vec3 P, out vec3 C, out float S, out float A) {
  vec3 dir = normalize(position + vec3(0.0001));
  float r = 0.025 + uCharge * 0.5 * aR.x;
  r *= 1.0 + sin(uTime * 45.0 + aR.w * 60.0) * uCharge * 0.3;
  P = dir * r;
  C = mix(COLOR_SINGULARITY_WARM, COLOR_SINGULARITY_ICE, aR.w);
  S = 1.0 + uCharge * 1.4;
  A = 0.2 + uCharge * 0.2;
}

// Nebulosa (SHAPE_NEBULA): giro lento, deriva por partícula y color por ruido; núcleo caliente en el centro.
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

// Galaxia (SHAPE_GALAXY): giro lento; núcleo cálido que pasa a los brazos (algunos con toque rosa).
void galaxy(out vec3 P, out vec3 C, out float S, out float A) {
  float rr = length(pGal.xz) / 8.0;
  vec3 arm = mix(COLOR_GALAXY_ARM, COLOR_GALAXY_ARM_PINK, step(0.84, aR.w));
  P = rotY(pGal, uTime * 0.035);
  C = mix(COLOR_GALAXY_CORE * 1.5, arm, smoothstep(0.0, 0.42, rr)) * (0.65 + 0.7 * aR.x);
  S = 0.9 + aR.w * 1.6;
  A = 0.6;
}

// Tortuga (SHAPE_TURTLE): aletas (delanteras y traseras en contrafase), cabeza y ojos que asienten, estela que fluye
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
  // El balanceo, con las cifras de la cabecera (sceneConfig): los pins (math/platePins) hacen la misma cuenta.
  p = rotY(p, sin(uTime * TURTLE_SWAY_YAW_RATE) * TURTLE_SWAY_YAW * uMotion);
  p.y += sin(uTime * TURTLE_SWAY_BOB_RATE) * TURTLE_SWAY_BOB * uMotion;

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

// Tierra (SHAPE_EARTH): giro lento, luz del Sol fija, desde donde está el Sol (`SUN_DIR`: día, noche y amanecer), luces de ciudad en la tierra de noche
// (no en Bajo) y atmósfera con Fresnel según la cámara.
void earth(out vec3 P, out vec3 C, out float S, out float A) {
  vec3 p = rotY(pEar, uTime * 0.05);
  float tag = aR.z;
  vec3 n = normalize(p);
  float lam = dot(n, SUN_DIR);
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

// Lo que ha bajado el haz de la llegada del epílogo (0 arriba → 1 al final de su bajada, ARRIVAL_BEAM_REACH altos de
// la ventana; ADR-039): la misma cuenta que la página (arrivalBeam de lib/scroll/arrivalChoreography). Si el retrato
// llega con la escena ya aquí, baja con su subida (uPor).
float arrivalBeam() {
  float a = clamp(uM - ARRIVAL_BASE, 0.0, 1.0);
  return min(clamp((a - ARRIVAL_BEAM_START) / (ARRIVAL_BEAM_END - ARRIVAL_BEAM_START), 0.0, 1.0), uPor);
}

// Retrato (SHAPE_PORTRAIT): holograma de escáner con la luz de la foto (pPor.w), fallos de señal (una franja salta de
// lado un instante) y giro limitado con el ratón (PORTRAIT_TURN: poco, la cara no está completa por los lados).
// Llega apagado: el haz de la llegada baja por la pantalla y enciende lo que deja atrás (main, tras proyectar); después
// pasa en bucle. Con movimiento reducido, encendido y sin haz ni fallos. Hasta que llega el retrato (uPor 0), la
// Tierra; al llegar, uPor sube a 1 en un instante y cada partícula pasa de la Tierra al retrato con su retraso del
// morph.
void portrait(out vec3 P, out vec3 C, out float S, out float A) {
  vec3 p = pPor.xyz;
  // El tick se acota: con uTime grande, sin() pierde precisión en la GPU y los fallos dejarían de ser al azar.
  float tick = mod(floor(uTime * 5.0), 997.0);
  float band = floor(p.y * 9.0);
  float glitch = uMotion * step(0.99, hash(band * 1.37 + tick * 17.1));
  p.x += glitch * (hash(band * 7.3 + tick) - 0.5) * 0.47;
  p = rotY(p, clamp(uMouse.x, -1.0, 1.0) * uGrav * PORTRAIT_TURN);
  // Al acabar la bajada entra el haz en bucle, fundido (sin saltar a mitad de la cara). Bases al cuadrado, nunca pow.
  float r = (pPor.y - PORTRAIT_HALF_H * 1.1 + mod(uTime * 1.3, PORTRAIT_HALF_H * 3.0)) * 3.0;
  float beam = exp(-r * r) * smoothstep(0.8, 1.0, arrivalBeam());
  // El haz y los fallos no encienden lo que la foto funde (el corte del busto, abajo): el mismo fundido, por la altura.
  float i = pPor.w + (beam * uMotion + glitch * 0.6) * smoothstep(-PORTRAIT_HALF_H, PORTRAIT_FADE_H - PORTRAIT_HALF_H, pPor.y);
  i *= 0.93 + 0.07 * sin(uTime * 23.0 + pPor.y * 3.0);
  vec3 c = i < 0.6
    ? mix(COLOR_PORTRAIT_DEEP, COLOR_PORTRAIT_GLOW, i / 0.6)
    : mix(COLOR_PORTRAIT_GLOW, COLOR_PORTRAIT_HOT, clamp((i - 0.6) / 0.8, 0.0, 1.0));
  P = p;
  C = c * i * i * 1.5;
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

// Una cápsula de A a B y radio r (miembros con volumen) y un punto de un elipsoide: los alienígenas.
vec3 capsule(vec3 A, vec3 B, float r, float t, float an, out vec3 n) {
  vec3 d = normalize(B - A);
  vec3 u1 = normalize(abs(d.z) < 0.9 ? cross(d, vec3(0.0, 0.0, 1.0)) : cross(d, vec3(1.0, 0.0, 0.0)));
  n = u1 * cos(an) + cross(d, u1) * sin(an);
  return mix(A, B, t) + n * r;
}

vec3 ellipsoid(vec3 cen, vec3 rad, float a, float b, out vec3 d) {
  float th = a * 2.0 * PI;
  float ph = acos(b * 2.0 - 1.0);
  d = vec3(sin(ph) * cos(th), cos(ph), sin(ph) * sin(th));
  return cen + d * rad;
}

// Un alienígena de altura Ha, de pie en el origen y mirando a +z. «wave» mueve el brazo derecho (0: quieto). Con
// «suit», en traje de astronauta: traje blanco con panel en el pecho, mochila, botas, el aro del casco y su reflejo, y
// las antenas, que asoman por el casco. Cabeza y cuerpo ponen casi todos sus puntos en la mitad que mira a cámara.
void alien(float Ha, float wave, bool suit, out vec3 q, out vec3 C) {
  vec3 n = vec3(0.0, 0.0, 1.0);
  float part = rx(21.0);
  float a = rx(22.0);
  float b = rx(23.0);
  float c = rx(24.0);
  float bodyW = suit ? 1.35 : 1.0;
  float front = rx(25.0) < 0.82 ? 0.5 : 1.0;
  vec3 suitC = COLOR_ALIEN_SUIT;
  vec3 skin = COLOR_ALIEN_SKIN;
  float sd = c < 0.5 ? -1.0 : 1.0;
  if (part < 0.38) {
    // Cabeza: ojos grandes rasgados con su borde claro y su brillo, y boca.
    vec3 d;
    q = ellipsoid(vec3(0.0, Ha * 0.8, 0.0), Ha * vec3(0.2, 0.25, 0.18), a * front, b, d);
    float sx = abs(d.x);
    vec2 ey = vec2((sx - 0.4) / 0.29, (d.y + 0.02 - (sx - 0.4) * 0.6) / 0.19);
    float e2 = dot(ey, ey);
    bool eye = d.z > 0.2 && e2 < 1.0;
    vec2 g = ey - vec2(-0.3, 0.4);
    C = eye && dot(g, g) < 0.09
      ? COLOR_ALIEN_GLINT * 1.8
      : eye
        ? mix(COLOR_ALIEN_EYE, COLOR_ALIEN_EYE_DEEP, smoothstep(0.2, 1.0, e2))
        : d.z > 0.2 && e2 < 1.45
          ? COLOR_ALIEN_RIM
          : d.z > 0.7 && abs(d.y + 0.48) < 0.05 && sx < 0.22 ? COLOR_ALIEN_MOUTH : skin * lit(d);
  } else if (part < 0.56) {
    // Cuerpo, o traje con su panel en el pecho.
    vec3 d;
    q = ellipsoid(vec3(0.0, Ha * 0.43, 0.0), Ha * vec3(0.13, 0.2, 0.11) * bodyW, a * front, b, d);
    C = (suit
      ? (d.z > 0.75 && abs(d.y) < 0.35
        ? (fract(d.x * 6.0) < 0.5 ? COLOR_ALIEN_PANEL_RED : COLOR_ALIEN_PANEL_BLUE)
        : suitC)
      : skin * 0.9) * lit(d);
  } else if (part < 0.68) {
    // Piernas y pies (o botas).
    float r = Ha * (suit ? 0.055 : 0.04);
    if (a < 0.82) {
      q = capsule(vec3(sd * Ha * 0.06, Ha * 0.3, 0.0), vec3(sd * Ha * 0.08, Ha * 0.04, 0.01), r, a / 0.82, b * 2.0 * PI, n);
      C = (suit ? suitC : skin * 0.85) * lit(n);
    } else {
      q = ellipsoid(vec3(sd * Ha * 0.08, Ha * 0.03, Ha * 0.04), Ha * vec3(0.06, 0.035, 0.09), (a - 0.82) / 0.18, b, n);
      C = (suit ? COLOR_MOTHERSHIP_DARK * 1.4 : skin * 0.7) * lit(n);
    }
  } else if (part < 0.84) {
    // Brazos y manos de tres dedos; el derecho saluda.
    vec3 sh = vec3(sd * Ha * 0.12 * bodyW, Ha * 0.56, 0.0);
    vec3 dir = sd > 0.0 && wave != 0.0
      ? normalize(vec3(sin(wave) * 0.9, cos(wave), 0.2))
      : normalize(vec3(sd * 0.3, -0.95, 0.08));
    vec3 hand = sh + dir * Ha * 0.3;
    if (a < 0.8) {
      q = capsule(sh, hand, Ha * (suit ? 0.045 : 0.03), a / 0.8, b * 2.0 * PI, n);
      C = (suit ? suitC : skin * 0.85) * lit(n);
    } else {
      q = hand + normalize(dir + vec3((floor(b * 3.0) - 1.0) * 0.35, 0.0, 0.0)) * Ha * 0.07 * ((a - 0.8) / 0.2);
      C = suit ? COLOR_MOTHERSHIP_DARK * 1.5 : skin;
    }
  } else if (part < 0.91) {
    // Antenas con su bola encendida.
    vec3 top = vec3(sd * Ha * 0.15, Ha * (suit ? 1.32 : 1.15), 0.0);
    if (a < 0.75) {
      q = capsule(vec3(sd * Ha * 0.06, Ha * 1.02, 0.0), top, Ha * 0.012, a / 0.75, b * 2.0 * PI, n);
      C = skin * 0.8;
    } else {
      q = ellipsoid(top, vec3(Ha * 0.04), (a - 0.75) / 0.25, b, n);
      C = COLOR_ALIEN_BULB * (0.7 + 0.8 * step(0.5, fract(uTime * 1.5 + sd * 0.25)));
    }
  } else if (suit) {
    // Casco: el aro del cuello, el reflejo y la mochila.
    if (part < 0.945) {
      float an = a * 2.0 * PI;
      q = vec3(cos(an) * Ha * 0.24, Ha * 0.6 + b * Ha * 0.04, sin(an) * Ha * 0.2);
      C = COLOR_SATELLITE_SILVER * 0.9;
    } else if (part < 0.975) {
      float an = mix(0.5, 1.4, a);
      q = vec3(0.0, Ha * 0.82, 0.0) + vec3(cos(an) * 0.6, sin(an) * 0.65, 0.48) * Ha * 0.34 + (b - 0.5) * vec3(0.0, 0.0, Ha * 0.02);
      C = COLOR_ALIEN_GLINT * 1.5;
    } else {
      boxSurf(vec3(Ha * 0.12, Ha * 0.16, Ha * 0.06), a, b, c, q, n);
      q += vec3(0.0, Ha * 0.48, -Ha * 0.2);
      C = COLOR_SATELLITE_SILVER * 0.95 * lit(n);
    }
  } else {
    // Sin traje: un ombligo luminoso, por si acaso.
    q = ellipsoid(vec3(0.0, Ha * 0.4, Ha * 0.1), vec3(Ha * 0.015), a, b, n);
    C = COLOR_ALIEN_RIM;
  }
}

// Satélite (SHAPE_SATELLITE, el Mission log): bisel con tornillos y LEDs · cuerpo (aislante dorado, radiadores blancos
// con aletas, frontal gris) con aristas · dos alas de tres paneles articulados (células con sus pistas, marcos, cara
// trasera) sobre un yugo de celosía · dos reflectores laterales con brazo y bocina · antena superior · toberas ·
// sensores estelares · antenas de varilla · y dos guiños: la bandera de España en su mástil y la de Irlanda, que cruza
// por detrás. En sus unidades: la pantalla en z = 0, con la proporción de uScreen. En Bajo (uExtras 0), sin las piezas
// pequeñas (tornillos, LEDs y sensores): sus partículas van al cuerpo.
void satelliteParts(out vec3 P, out vec3 C) {
  vec2 h0 = uScreen * 0.5;
  vec2 h = uVert < 0.5 ? h0 : h0.yx;
  float u = aR.x;
  float a = rx(31.0);
  float b = rx(32.0);
  float c = aR.w;
  if (uExtras < 0.5 && ((u < 0.08 && c > 0.92) || (u > 0.92 && u < 0.955))) u = 0.12 + 0.18 * rx(33.0);
  vec3 n = vec3(0.0, 0.0, 1.0);
  vec3 B = vec3(h.x * 1.12, h.y * 1.14, h.y * 0.62);
  float bz = -B.z - 0.1;
  vec3 silver = COLOR_SATELLITE_SILVER;
  vec3 white = COLOR_SATELLITE_WHITE;
  P = vec3(0.0);
  C = P;
  if (u < 0.08) {
    // El bisel de la pantalla, en el color del canal, su canto y, en las esquinas, tornillos y LEDs de estado.
    if (c < 0.82) {
      P = vec3(rectEdge(a, h0 + vec2(0.03 + 0.1 * b)), 0.08);
      C = mix(COLOR_SATELLITE_CHANNEL, vec3(1.0), 0.5) * 1.1;
    } else if (c < 0.92) {
      P = vec3(rectEdge(a, h0 + vec2(0.02)) * (1.0 - 0.02 * b), 0.05 - 0.07 * b);
      C = silver * 0.6;
    } else {
      vec2 cr = vec2(rx(1.0) < 0.5 ? -1.0 : 1.0, rx(2.0) < 0.5 ? -1.0 : 1.0);
      float an = a * 2.0 * PI;
      P = vec3(cr * (h0 + vec2(0.09)) + vec2(cos(an), sin(an)) * 0.025, 0.1);
      C = rx(4.0) < 0.5
        ? silver
        : (cr.x > 0.0 ? COLOR_SATELLITE_LED : COLOR_SATELLITE_CHANNEL) * (0.4 + 0.8 * step(0.5, fract(uTime * 0.9 + cr.y * 0.3)));
    }
    return;
  }
  if (u < 0.12) {
    // La pantalla, apagada: el fondo del canal.
    P = vec3((a * 2.0 - 1.0) * h0.x, (b * 2.0 - 1.0) * h0.y, 0.0);
    C = COLOR_SATELLITE_CHANNEL * 0.06 + COLOR_SATELLITE_LENS * 0.2;
    return;
  }
  if (u < 0.3) {
    // El cuerpo: radiadores con aletas arriba y abajo, frontal gris y aislante dorado arrugado, con costuras.
    boxSurf(B, a, b, c, P, n);
    P.z += bz;
    if (abs(n.y) > 0.5) {
      C = white * (fract(P.x * 6.0) < 0.12 ? 0.55 : 1.0);
    } else if (n.z > 0.5) {
      C = silver * 0.55 * (0.85 + 0.3 * hash2(floor(P.xy * 6.0)));
    } else {
      C = mix(COLOR_SATELLITE_GOLD * 0.6, COLOR_SATELLITE_GOLD_LIGHT, hash2(floor(P.yz * 4.0)))
        * (0.55 + 0.8 * hash2(floor((P.yz + P.xx) * 14.0)));
      if (fract(P.y * 2.4) < 0.05 || fract(P.z * 2.4) < 0.05) C *= 0.4;
    }
    C *= lit(n);
  } else if (u < 0.33) {
    P = boxEdge(B * 1.004, a, c);
    P.z += bz;
    C = silver * 1.15;
  } else if (u < 0.62) {
    // Las alas: tres paneles por lado, con su marco, las pistas entre células, las células y la cara trasera.
    float side = c < 0.5 ? -1.0 : 1.0;
    float PW = h.x * 0.95;
    float panel = floor(a * 3.0);
    float s = fract(a * 3.0);
    float t = b;
    float m = rx(6.0);
    vec3 col;
    if (m < 0.12) {
      if (rx(7.0) < 0.5) t = step(0.5, rx(8.0));
      else s = step(0.5, rx(8.0));
      col = silver;
    } else if (m < 0.2) {
      if (rx(7.0) < 0.5) s = floor(s * 4.0 + 0.5) / 4.0;
      else t = floor(t * 6.0 + 0.5) / 6.0;
      col = silver * 0.75;
    } else {
      s = (floor(s * 4.0) + 0.07 + fract(s * 4.0) * 0.86) / 4.0;
      t = (floor(t * 6.0) + 0.07 + fract(t * 6.0) * 0.86) / 6.0;
      col = mix(
        COLOR_SATELLITE_CELL_DEEP,
        COLOR_SATELLITE_CELL_SHEEN,
        0.55 + 0.5 * hash2(vec2(floor(s * 4.0) + panel * 10.0, floor(t * 6.0)) + side * 31.0)
      );
    }
    P = vec3(side * (B.x + h.x * 0.45 + panel * (PW + h.x * 0.06) + s * PW), (t * 2.0 - 1.0) * h.y * 0.9, 0.0);
    bool back = rx(9.0) < 0.22;
    if (back) {
      P.z -= 0.03;
      col = white * 0.55;
    }
    P = rotX(P, 0.3);
    P.z += bz;
    C = col * lit(vec3(0.0, sin(0.3), cos(0.3)) * (back ? -1.0 : 1.0)) * (back ? 1.0 : 1.3);
  } else if (u < 0.66) {
    // El yugo de celosía que sujeta las alas.
    float side = c < 0.5 ? -1.0 : 1.0;
    float k = floor(rx(1.0) * 4.0);
    float y0 = (k < 2.0 ? 0.35 : -0.35) * h.y;
    P = mix(vec3(side * B.x, y0, 0.0), vec3(side * (B.x + h.x * 0.45), mod(k, 2.0) > 0.5 ? y0 : 0.0, 0.0), a);
    P = rotX(P, 0.3);
    P.z += bz;
    C = silver * 0.9;
  } else if (u < 0.8) {
    // Los reflectores laterales, con su brazo y su bocina.
    float side = c < 0.5 ? -1.0 : 1.0;
    float rr = h.y * 0.7;
    vec3 base = vec3(side * (B.x + rr * 0.15), -h.y * 0.25, bz + B.z * 0.2);
    float part = rx(1.0);
    float rib;
    if (part < 0.78) {
      vec3 d;
      dish(rr, rr * 0.35, a, b, d, n, rib);
      n = rotY(n, side * 1.1);
      P = base + vec3(side * rr * 0.95, 0.0, 0.0) + rotY(d, side * 1.1);
      C = white * lit(n) * (rib > 0.5 ? 0.7 : 1.05);
    } else if (part < 0.9) {
      P = mix(vec3(side * B.x, -h.y * 0.25, bz + B.z), base + vec3(side * rr * 0.5, 0.0, rr * 0.6), a);
      C = silver;
    } else {
      frustum(0.02 * h.y, 0.09 * h.y, 0.0, 0.18 * h.y, a, b, P, n);
      P = rotY(P, side * 1.1) + vec3(side * (B.x + 0.05), -h.y * 0.25, bz + B.z + 0.12);
      C = COLOR_SATELLITE_GOLD * lit(n);
    }
  } else if (u < 0.86) {
    // La antena de arriba, con su mástil.
    float rr = h.y * 0.4;
    vec3 base = vec3(-h.x * 0.4, B.y + h.y * 0.35, bz);
    float rib;
    if (c < 0.15) {
      P = mix(vec3(base.x, B.y, bz), base, a);
      C = silver;
    } else {
      vec3 d;
      dish(rr, rr * 0.4, a, b, d, n, rib);
      P = base + rotX(d, -1.05);
      C = white * lit(rotX(n, -1.05)) * (rib > 0.5 ? 0.7 : 1.05);
    }
  } else if (u < 0.92) {
    // La tobera principal, detrás, y cuatro de control en las esquinas.
    if (c < 0.45) {
      frustum(0.06 * h.y, 0.22 * h.y, 0.0, -0.35 * h.y, a, b, P, n);
      P.z += bz - B.z;
      C = COLOR_SATELLITE_NOZZLE * lit(n);
    } else {
      float k = floor(c * 8.0);
      vec2 cr = vec2(mod(k, 2.0) < 1.0 ? -1.0 : 1.0, mod(floor(k / 2.0), 2.0) < 1.0 ? -1.0 : 1.0);
      frustum(0.02 * h.y, 0.06 * h.y, 0.0, -0.12 * h.y, a, b, P, n);
      P += vec3(cr * B.xy * 0.85, bz - B.z);
      C = silver * 0.75 * lit(n);
    }
  } else if (u < 0.955) {
    // Sensores estelares y solares: cilindros con su lente.
    vec3 q;
    frustum(0.07 * h.y, 0.07 * h.y, 0.0, 0.2 * h.y, a, b, q, n);
    P = vec3((floor(c * 3.0) - 1.0) * B.x * 0.5, B.y, bz - B.z * 0.4) + q.xzy;
    C = (b > 0.9 ? COLOR_SATELLITE_LENS : silver * 0.8) * lit(n.xzy);
  } else if (u > 0.98) {
    // Bandera de Irlanda, suelta: entra por el borde izquierdo de lo que se ve, pasa flotando por detrás del satélite
    // dando vueltas y sale por el derecho (uFlagSpan: fuera de la vista también mientras la nave se acerca).
    float k = fract(uTime / 13.0 + 0.15);
    vec3 at = vec3(
      mix(-uFlagSpan, uFlagSpan, k),
      h0.y * (uVert < 0.5 ? 1.3 : 1.35) + sin(uTime * 0.7) * h0.y * 0.12,
      bz - B.z - h.y * 0.7
    );
    float ph = a * 6.0 - uTime * 2.4;
    vec3 q = rotX(rotY(vec3((a - 0.5) * h.y * 1.15, (b - 0.5) * h.y * 0.66, sin(ph) * 0.08 * h.y), uTime * 0.9), uTime * 0.55);
    n = rotX(rotY(normalize(vec3(-cos(ph) * 0.3, 0.0, 1.0)), uTime * 0.9), uTime * 0.55);
    vec3 col = a < 1.0 / 3.0 ? COLOR_FLAG_IRELAND_GREEN : (a < 2.0 / 3.0 ? COLOR_FLAG_IRELAND_WHITE : COLOR_FLAG_IRELAND_ORANGE);
    P = at + q;
    C = col * (0.35 + 0.85 * abs(dot(n, normalize(SHIP_KEY))));
    return;
  } else if (u > 0.962) {
    // Bandera de España en su mástil, detrás del cuerpo, ondeando en horizontal en las dos orientaciones (en el
    // espacio no hay viento: es una broma), con el escudo simplificado cerca del mástil.
    vec3 base = sw(vec3(B.x * 0.55, B.y, bz - B.z * 0.7));
    float up = uVert < 0.5 ? h.y : h.x;
    float ub = uVert < 0.5 ? 0.0 : B.x - B.y;
    if (c < 0.12) {
      P = base + vec3(0.0, ub + a * (up * 1.25 + h.y * 0.62), 0.0);
      C = silver * lit(vec3(-1.0, 0.0, 0.4));
    } else {
      float ph = a * 7.0 - uTime * 3.2;
      vec3 q = vec3(a * h.y, ub + up * 1.25 + b * h.y * 0.62 - a * a * 0.06 * h.y, sin(ph) * 0.09 * h.y * a);
      q.y += cos(ph * 0.7) * 0.03 * h.y * a;
      vec3 stripe = (b < 0.25 || b > 0.75) ? COLOR_FLAG_SPAIN_RED : COLOR_FLAG_SPAIN_YELLOW;
      vec2 e = vec2((a - 0.3) / 0.11, (b - 0.5) / 0.17);
      if (dot(e, e) < 1.0) {
        stripe = e.y > 0.55
          ? COLOR_FLAG_SPAIN_CROWN
          : mix(COLOR_FLAG_SPAIN_SHIELD, COLOR_FLAG_SPAIN_SHIELD_GOLD, step(0.0, e.x * e.y));
      }
      P = base + q;
      C = stripe * (0.62 + 0.45 * cos(ph));
    }
    return;
  } else {
    // Antenas de varilla, abajo, y una omnidireccional.
    float k = floor(c * 4.0);
    float an = a * 2.0 * PI;
    P = k < 3.0
      ? vec3(B.x * 0.6 * (k - 1.0), -B.y - a * h.y * 0.7, bz + B.z * 0.6)
      : vec3(B.x * 0.7 + cos(an) * 0.04 * h.y, -B.y - 0.2 * h.y + b * 0.15 * h.y, bz + sin(an) * 0.04 * h.y);
    C = k < 3.0 ? silver : white;
  }
  P = sw(P);
}

// Nave nodriza (SHAPE_MOTHERSHIP, Mission control): la boca del hangar (la pantalla) con compuertas y franjas de luz ·
// el hangar, con suelo de calles iluminadas, costillas, fondo y una lanzadera atracada · tres alienígenas (dos en el
// hangar, el de delante saluda, y un astronauta sobre el casco, delante del puente) · el casco escalonado de planchas,
// con aristas · dos brazos a los lados de la boca · la superestructura en tres niveles con ventanas, el puente y el
// mástil · la quilla · góndolas con pilones y aletas · toberas acampanadas con brillo y estela · módulos en el lomo y
// los costados · ventanas, balizas y focos. En Bajo (uExtras 0), sin módulos, ventanas ni balizas: al casco. Devuelve
// en S lo fino de sus puntos (los alienígenas, más finos: de cerca se les lee la cara).
void mothershipParts(out vec3 P, out vec3 C, out float S) {
  vec2 h0 = uScreen * 0.5;
  vec2 h = uVert < 0.5 ? h0 : h0.yx;
  float u = aR.x;
  float a = rx(31.0);
  float b = rx(32.0);
  float c = aR.w;
  if (uExtras < 0.5 && ((u >= 0.84 && u < 0.858) || u >= 0.955)) u = 0.15 + 0.28 * rx(33.0);
  vec3 n = vec3(0.0, 0.0, 1.0);
  vec2 R = h * vec2(1.5, 1.32);
  float Lz = h.x * 5.6;
  vec3 steel = COLOR_MOTHERSHIP_STEEL;
  vec3 dark = COLOR_MOTHERSHIP_DARK;
  vec3 channel = COLOR_MOTHERSHIP_CHANNEL;
  S = 0.5;
  if (u < 0.07) {
    // La boca: su borde, las compuertas a rayas y una franja de luz que corre.
    if (c < 0.7) {
      P = vec3(rectEdge(a, h0 + vec2(0.03 + 0.1 * b)), 0.06);
      C = mix(channel, vec3(1.0), 0.45);
    } else if (c < 0.85) {
      vec2 e = rectEdge(a, h0 + vec2(0.16 + 0.12 * b));
      P = vec3(e, 0.03);
      C = (fract((e.x + e.y) * 3.0) < 0.5 ? COLOR_MOTHERSHIP_HAZARD : dark) * 0.9;
    } else {
      P = vec3(rectEdge(a, h0 + vec2(0.3)), 0.04);
      C = channel * 1.3 * step(0.4, fract(a * 40.0 - uTime * 0.6));
    }
    return;
  }
  if (u < 0.15) {
    // El hangar, detrás de la boca: suelo con calles de luz, costillas, fondo (tapa las toberas) y la lanzadera.
    if (c < 0.38) {
      P = vec3((a * 2.0 - 1.0) * h0.x * 0.96, -h0.y * 0.96, -b * h.x * 1.5);
      C = fract(a * 8.0) < 0.06 || fract(b * 10.0 - uTime * 0.4) < 0.05 ? channel * 1.5 : dark * 0.5;
    } else if (c < 0.56) {
      P = vec3((a * 2.0 - 1.0) * h0.x * 0.96, h0.y * 0.96, -floor(b * 9.0) / 9.0 * h.x * 1.5);
      C = steel * 0.5;
    } else if (c < 0.86) {
      P = vec3((a * 2.0 - 1.0) * h0.x * 0.97, (b * 2.0 - 1.0) * h0.y * 0.97, -h.x * 1.5);
      C = fract(a * 6.0) < 0.04 ? channel * 0.5 : dark * 0.45;
    } else {
      vec3 e = vec3(h0.x * 0.18, h0.y * 0.1, h.x * 0.25);
      boxSurf(e, a, b, rx(2.0), P, n);
      if (rx(3.0) < 0.3) P = vec3((a * 2.0 - 1.0) * e.x * 2.6, 0.0, (b * 2.0 - 1.0) * e.z * 0.6);
      P += vec3(-h0.x * 0.25, -h0.y * 0.96 + e.y + 0.02, -h.x * 0.6);
      C = COLOR_SATELLITE_WHITE * 0.93 * lit(n);
    }
    return;
  }
  // El perfil del casco a lo largo de z (0 en la boca, 1 en popa): sube tras la boca y se estrecha hacia popa.
  float z = b;
  if ((u > 0.43 && u < 0.49) || (u > 0.858 && u < 0.955)) {
    // Los alienígenas, con una sola llamada (menos código en cada rama, la lección de la v7).
    bool astro = u > 0.925;
    bool second = !astro && rx(20.0) < 0.4;
    float wave = astro ? 0.9 + 0.5 * sin(uTime * 4.5) : (second ? 0.0 : 0.7 + 0.55 * sin(uTime * 6.0));
    vec3 at = astro
      ? (uVert < 0.5 ? vec3(-R.x * 0.35, R.y, -0.13 * Lz) : vec3(-R.y * 0.2, R.x, -0.13 * Lz))
      : (second ? vec3(h0.x * 0.12, -h0.y * 0.96, -h.x * 0.55) : vec3(h0.x * 0.5, -h0.y * 0.96, -h.x * 0.22));
    alien(astro ? h.y * 0.62 : h0.y * (second ? 0.5 : 0.66), wave, astro, P, C);
    P = at + rotY(P, astro ? 0.5 : (second ? 0.35 : -0.25));
    S = 0.25;
    return;
  }
  if (u >= 0.84) {
    // Módulos sobre el lomo y los costados, y cubiertas de ventanas, balizas y focos: a lo largo del casco.
    vec2 cell = floor(vec2(a * 10.0, b * 16.0));
    z = u < 0.96 ? 0.12 + cell.y / 16.0 * 0.8 : 0.08 + floor(a * 40.0) / 40.0 * 0.85;
  }
  float prof = mix(0.92, 1.12, smoothstep(0.0, 0.3, z)) * mix(1.0, 0.68, smoothstep(0.55, 1.0, z));
  if (u < 0.49) {
    // El casco, de planchas con sus costuras y escalones, con aristas.
    float an = a * 2.0 * PI;
    float ca = cos(an);
    float sa = sin(an);
    prof *= 1.0 + 0.06 * step(0.45, fract(z * 3.0));
    P = vec3(vec2(sign(ca) * pow(abs(ca), 0.4), sign(sa) * pow(abs(sa), 0.4)) * R * prof, -z * Lz);
    n = vec3(P.x / prof / R.x * R.y, P.y / prof / R.y * R.x * 1.3, 0.12);
    C = steel * (0.68 + 0.5 * hash2(vec2(floor(z * 22.0), floor(a * 36.0)))) * lit(n);
    if (fract(z * 22.0) < 0.06 || fract(a * 36.0) < 0.06) C *= 0.32;
    if (rx(1.0) < 0.12) {
      P.xy = vec2(sign(ca), sign(sa)) * R * prof * 0.97;
      C = steel * 1.25;
    }
  } else if (u < 0.54) {
    // Brazos que avanzan a los lados de la boca, afilándose.
    vec3 e = vec3(R.x * 0.16, R.y * 0.32, Lz * 0.16);
    boxSurf(e, a, b, rx(2.0), P, n);
    if (rx(4.0) < 0.15) P = boxEdge(e, a, rx(5.0));
    P.y *= 1.0 - 0.45 * smoothstep(-e.z, e.z, P.z);
    P += vec3((c < 0.5 ? -1.0 : 1.0) * R.x * 0.95, 0.0, Lz * 0.02);
    C = steel * lit(n) * (0.8 + 0.3 * hash2(floor(P.yz * 7.0)));
  } else if (u < 0.62) {
    // Superestructura en tres niveles, con ventanas (el puente), y el mástil.
    float tier = floor(c * 3.0);
    vec3 e = vec3(R.x * (0.42 - tier * 0.11), R.y * 0.1, Lz * (0.2 - tier * 0.05));
    boxSurf(e, a, b, rx(2.0), P, n);
    if (rx(4.0) < 0.12) P = boxEdge(e, a, rx(5.0));
    P += vec3(0.0, R.y * 1.08 + e.y * (1.0 + tier * 2.0), -Lz * (0.55 + tier * 0.05));
    C = abs(n.y) < 0.5 && fract(P.y * 14.0) < 0.35 && fract(P.x * 9.0 + P.z * 9.0) < 0.55
      ? mix(channel, vec3(1.0), 0.6) * 1.4
      : steel * lit(n);
    if (tier > 1.5 && rx(6.0) < 0.25) {
      P = vec3(0.0, R.y * 1.08 + e.y * 5.0 + a * R.y * 0.6, -Lz * 0.68);
      C = COLOR_SATELLITE_SILVER;
    }
  } else if (u < 0.66) {
    // La quilla.
    vec3 e = vec3(R.x * 0.18, R.y * 0.12, Lz * 0.32);
    boxSurf(e, a, b, c, P, n);
    P += vec3(0.0, -R.y * 1.02 - e.y, -Lz * 0.5);
    C = dark * 1.4 * lit(n);
  } else if (u < 0.74) {
    // Góndolas, pilones y aletas.
    float side = c < 0.5 ? -1.0 : 1.0;
    float r = R.y * 0.3;
    float part = rx(1.0);
    if (part < 0.62) {
      frustum(r * 0.85, r, -0.4 * Lz, -Lz, a, b, P, n);
      if (fract(b * 9.0) < 0.1) P.xy *= 1.1;
      P += vec3(side * R.x * 1.62, -R.y * 0.3, 0.0);
      C = steel * lit(n);
    } else if (part < 0.82) {
      P = vec3(side * mix(R.x * 0.85, R.x * 1.5, a), -R.y * 0.3, -mix(0.5, 0.85, b) * Lz);
      C = steel * 0.85 * lit(vec3(0.0, 1.0, 0.0));
    } else {
      P = vec3(side * R.x * 1.62, -R.y * 0.3 + r + a * r * 1.4 * (1.0 - b), -mix(0.75, 1.0, b) * Lz);
      C = steel * lit(vec3(side, 0.0, 0.0));
    }
  } else if (u < 0.84) {
    // Toberas acampanadas, con brillo y estela (más tenues de frente: no brillan a través del casco).
    float k = floor(c * 5.0);
    vec3 at = k < 3.0
      ? vec3((k - 1.0) * R.x * 0.42, -R.y * 0.02, -Lz)
      : vec3((k < 4.0 ? -1.0 : 1.0) * R.x * 1.62, -R.y * 0.3, -Lz);
    float r = R.y * (k < 3.0 ? 0.26 : 0.22);
    float part = rx(1.0);
    float glow = 0.25 + 0.75 * smoothstep(0.05, 0.6, uShipTurn.x);
    float an = a * 2.0 * PI;
    float t = rx(2.0);
    if (part < 0.5) {
      frustum(r * 0.7, r, 0.0, -r * 0.9, a, b, P, n);
      C = dark * 1.3 * lit(n);
    } else if (part < 0.75) {
      P = vec3(cos(an), sin(an), 0.0) * r * 0.9 * sqrt(b) + vec3(0.0, 0.0, -r * 0.5);
      C = mix(COLOR_MOTHERSHIP_FLAME, COLOR_MOTHERSHIP_FLAME_COLD, b) * 1.5 * glow;
    } else {
      P = vec3(cos(an), sin(an), 0.0) * r * 0.8 * (1.0 - t) * sqrt(b) + vec3(0.0, 0.0, -r - t * Lz * 0.6);
      C = COLOR_MOTHERSHIP_TRAIL * (1.0 - t) * glow;
    }
    P += at;
  } else if (u < 0.96) {
    // Módulos sobre el lomo (o un costado), en su celda.
    vec2 cell = floor(vec2(a * 10.0, b * 16.0));
    float hh = hash2(cell);
    vec3 e = vec3(R.x * 0.035 * (1.0 + hh), R.y * 0.03 * (1.0 + 3.0 * hash2(cell + 7.0)), Lz * 0.012 * (1.0 + 2.0 * hash2(cell + 3.0)));
    boxSurf(e, rx(8.0), rx(9.0), c, P, n);
    if (rx(10.0) < 0.6) {
      P += vec3((cell.x / 10.0 * 2.0 - 0.9) * R.x * prof * 0.75, R.y * prof + e.y, -z * Lz);
    } else {
      float side = rx(11.0) < 0.5 ? -1.0 : 1.0;
      P = P.yxz + vec3(side * (R.x * prof + e.y), (cell.x / 10.0 * 2.0 - 1.0) * R.y * prof * 0.6, -z * Lz);
      n = vec3(side, 0.0, 0.0);
    }
    C = mix(steel, dark * 1.6, step(0.6, hh)) * lit(n);
  } else {
    // Cubiertas de ventanas a los lados y, en popa, balizas que parpadean (roja y verde).
    float side = c < 0.5 ? -1.0 : 1.0;
    float deck = floor(b * 4.0);
    P = vec3(side * R.x * prof * 1.01, (deck - 1.5) * R.y * 0.22, -z * Lz);
    C = COLOR_MOTHERSHIP_WINDOW * (hash2(vec2(floor(a * 40.0), deck + side)) < 0.7 ? 1.3 : 0.15);
    if (rx(3.0) < 0.08) {
      P = vec3(side * R.x * 1.62, R.y * 0.45, -Lz);
      C = (side < 0.0 ? COLOR_MOTHERSHIP_BEACON : COLOR_SATELLITE_LED) * 2.0 * step(0.5, fract(uTime * 0.8));
    }
  }
  P = sw(P);
}

// Una nave, de sus unidades a la escena (scene/math/shipPose): girada, meciéndose un poco, a su tamaño y en su sitio.
vec3 placeShip(vec3 p) {
  return uShipPos + uShipAxes * (rotX(rotY(p, uShipTurn.x + sin(uTime * SHIP_SWAY_RATE) * SHIP_SWAY), uShipTurn.y) * uShipScale);
}

void satellite(out vec3 P, out vec3 C, out float S, out float A) {
  satelliteParts(P, C);
  P = placeShip(P);
  S = 0.5;
  A = 0.6;
}

void mothership(out vec3 P, out vec3 C, out float S, out float A) {
  mothershipParts(P, C, S);
  P = placeShip(P);
  A = 0.6;
}

// La forma de id `id` (SHAPE_*): una rama por forma del viaje. Un id sin rama no pinta nada (tamaño y alfa 0): no se disfraza de otra forma.
void shape(float id, out vec3 P, out vec3 C, out float S, out float A) {
  if (isTag(id, SHAPE_SINGULARITY)) singularity(P, C, S, A);
  else if (isTag(id, SHAPE_NEBULA)) nebula(P, C, S, A);
  else if (isTag(id, SHAPE_GALAXY)) galaxy(P, C, S, A);
  else if (isTag(id, SHAPE_TURTLE)) turtle(P, C, S, A);
  else if (isTag(id, SHAPE_EARTH)) earth(P, C, S, A);
  else if (isTag(id, SHAPE_PORTRAIT)) portrait(P, C, S, A);
  else if (isTag(id, SHAPE_SATELLITE)) satellite(P, C, S, A);
  else if (isTag(id, SHAPE_MOTHERSHIP)) mothership(P, C, S, A);
  else {
    P = vec3(0.0);
    C = P;
    S = 0.0;
    A = 0.0;
  }
}

void main() {
  // El paso de uFrom a uTo, con el retraso de cada partícula. La llegada del epílogo (el retrato, formado antes de
  // acabar el tramo: ADR-039) ya viene en uT (lib/scroll/shapeTrack, la misma cuenta que la cámara).
  float tt = smoothstep(0.0, 1.0, clamp((uT - aR.x * MORPH_DELAY) / MORPH_SPAN, 0.0, 1.0));
  bool toPortrait = isTag(uTo, SHAPE_PORTRAIT);
  // Lo que esta partícula ya es retrato (0 → 1, con su retraso y con uPor; quieta en el retrato, uPor): pesa el haz de
  // la llegada y apaga la gravedad del cursor sobre la cara (ADR-042).
  float portraitWeight = toPortrait ? (isTag(uFrom, SHAPE_PORTRAIT) ? 1.0 : tt) * uPor : 0.0;

  vec3 PA; vec3 PB; vec3 CA; vec3 CB; float SA; float SB; float AA; float AB;
  shape(uFrom, PA, CA, SA, AA);
  // Quieta en una forma (uT 0, un uniform: la GPU puede saltarse la rama entera), una sola: con tt 0, la de uFrom.
  if (uT > 0.0) {
    shape(uTo, PB, CB, SB, AB);
  } else {
    PB = PA; CB = CA; SB = SA; AB = AA;
  }

  vec3 P;
  vec3 C;
  if (isTag(uFrom, SHAPE_SINGULARITY)) {
    P = mix(PA, PB, 1.0 - pow(2.0, -BANG_EASE * tt)) + PB * sin(tt * PI) * BANG_OVERSHOOT;
    C = mix(COLOR_FLASH * FLASH_GAIN, CB, smoothstep(0.05, 0.85, tt));
  } else {
    vec3 jitter = vec3(
      sin(aR.x * 31.0 + uTime * 0.5),
      cos(aR.w * 29.0 + uTime * 0.4),
      sin(aR.w * 23.0 - uTime * 0.3)
    );
    // Sin retrato, de la Tierra al retrato la Tierra va a sí misma: sin dispersión (no se hincha); con él, a la vez
    // que sube.
    P = mix(PA, PB, tt) + jitter * sin(tt * PI) * MORPH_SCATTER * (toPortrait ? uPor : 1.0);
    C = mix(CA, CB, tt);
  }
  float S = mix(SA, SB, tt);
  vA = mix(AA, AB, tt);

  vec4 mv = modelViewMatrix * vec4(P, 1.0);
  gl_Position = projectionMatrix * mv;
  // Opacos (una nave, uSolid 1), puntos finos y con un mínimo, para que sus piezas se lean nítidas.
  float size = S * uPR * (SIZE_DISTANCE / -mv.z);
  gl_PointSize = mix(min(size, SIZE_MAX_PX), clamp(size * 1.15, 1.2 * uPR, 3.4 * uPR), uSolid);

  // Gravedad del cursor, en pantalla y sin tocar la geometría (uGrav 0: táctil, sin ratón dentro, movimiento reducido).
  // Sobre la cara, nada: la deformaría (portraitWeight).
  vec2 d = gl_Position.xy / gl_Position.w - uMouse;
  d.x *= uAspect;
  // Sobre la nave, tampoco: su pantalla encaja con lo que se ve (C.7 · naves). Lo que la partícula ya es nave.
  float shipWeight = (isShip(uFrom) ? 1.0 - tt : 0.0) + (isShip(uTo) ? tt : 0.0);
  float f = exp(-dot(d, d) * GRAV_FALLOFF) * uGrav * max(1.0 - portraitWeight - shipWeight, 0.0);
  vec2 off = (vec2(-d.y, d.x) * GRAV_SWIRL + d * GRAV_RADIAL) * f * GRAV_REACH;
  off.x /= uAspect;
  gl_Position.xy += off * gl_Position.w;

  // El haz de la llegada, en pantalla (ADR-039): la misma línea que la página (lib/scroll/arrivalChoreography), donde se
  // pinta cada partícula (después de la gravedad). Lo que queda por encima se enciende y brilla al pasar; por debajo,
  // llega apagado. Toca la mezcla entera con el peso del retrato en ella (tt · uPor): sin retrato, nada; a mitad del
  // cambio, por debajo de la línea se oscurece también la Tierra que se va.
  if (toPortrait) {
    float y = gl_Position.y / gl_Position.w;
    float down = arrivalBeam();
    float b = 1.0 - 2.0 * ARRIVAL_BEAM_REACH * down;
    float lit = max(smoothstep(b - 0.01, b + 0.02, y), 1.0 - uMotion);
    float q = (y - b) * 30.0;
    float glow = exp(-q * q) * uMotion * step(0.001, down) * (1.0 - smoothstep(0.95, 1.0, down));
    C *= mix(1.0, mix(0.12, 1.0, lit) + glow * 1.5, portraitWeight);
  }
  vCol = C * (1.0 + f * GRAV_GLOW);
}
