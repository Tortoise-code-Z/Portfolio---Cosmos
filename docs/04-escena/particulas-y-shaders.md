# Partículas y shaders

## Atributos (por partícula)

| Atributo | Tipo | Contenido |
|---|---|---|
| `position` | vec3 | Forma 1 · nebulosa (Three exige un `position`; la singularidad se deriva de él) |
| `pGal` | vec3 | Forma 2 · galaxia |
| `pTur` | vec3 | Forma 3 · tortuga |
| `pEar` | vec3 | Forma 4 · Tierra |
| `aR` | vec4 | `x` aleatorio 0–1 (retraso, brillo) · `y` etiqueta de la tortuga · `z` etiqueta de la Tierra · `w` aleatorio 0–1 (tamaño, tono) |

Memoria: 16 floats por partícula → 60.000 partículas ≈ 3,8 MB. La forma 0 (singularidad) no ocupa memoria: es
la dirección de `position` escalada a casi cero.

## Uniforms

| Uniform | Tipo | Origen |
|---|---|---|
| `uM` | float | `m` suavizado (0–4) |
| `uTime` | float | segundos desde el arranque (congelado con movimiento reducido para los giros autónomos) |
| `uCharge` | float | carga de la detonación (0–1) |
| `uPR` | float | pixel ratio efectivo |
| `uPlate` | float | etiqueta de la placa iluminada (0 = ninguna) |
| `uGrav` | float | intensidad de la gravedad del cursor (0 en táctil o movimiento reducido) |
| `uAspect` | float | relación de aspecto |
| `uMouse` | vec2 | puntero en coordenadas NDC (fuera de pantalla = sin efecto) |
| `uMotion` | float | 1 normal · 0 movimiento reducido (anula oscilaciones autónomas) |

## Shader de vértices (estructura)

```glsl
void shape(float k, out vec3 P, out vec3 C, out float S, out float A);  // posición, color, tamaño, alfa de la forma k

void main() {
  float m  = clamp(uM, 0.0, 3.999);
  float k  = floor(m);
  float t  = m - k;
  float tt = smoothstep(0.0, 1.0, clamp((t - aR.x * 0.25) / 0.75, 0.0, 1.0)); // retraso por partícula

  shape(k, PA, CA, SA, AA);
  shape(k + 1.0, PB, CB, SB, AB);

  if (k < 0.5) {            // explosión: salida exponencial + rebasamiento + color incandescente
    P = mix(PA, PB, 1.0 - pow(2.0, -9.0 * tt)) + PB * sin(tt * PI) * 0.55;
    C = mix(WHITE_HOT * 2.2, CB, smoothstep(0.05, 0.85, tt));
  } else {                  // morph normal con dispersión a mitad de camino
    P = mix(PA, PB, tt) + jitter(aR) * sin(tt * PI) * 1.1;
    C = mix(CA, CB, tt);
  }
  // proyección, tamaño con atenuación por distancia (límite 48 px) y gravedad del cursor en espacio de pantalla
}
```

- Solo se evalúan **dos formas** por vértice (la actual y la siguiente).
- Animaciones propias de cada forma dentro de `shape()`: giro lento (nebulosa, galaxia, Tierra), aletas,
  balanceo y estela de la tortuga, iluminación de la Tierra. Todas multiplicadas por `uMotion`.

### Gravedad del cursor

En espacio de pantalla, tras proyectar: distancia al puntero corregida por el aspecto, caída gaussiana
(`exp(-d² · 14)`), desplazamiento en remolino (perpendicular · 1,3 + radial · 0,5) · 0,22 y brillo extra
(`color · (1 + f · 1,6)`). No modifica la geometría: es solo visual.

### Colores

Constantes `const vec3` en el shader, tomadas de la paleta de escena del design system. Variación por partícula
con `aR.x` (brillo 0,7–1,3) y `aR.w` (tono y tamaño).

### Iluminación de la Tierra

Luz direccional fija `L = normalize(-0.72, 0.30, -0.45)` (la dirección del Sol). Día/noche con `smoothstep` del
producto escalar, franja naranja del amanecer con `exp(-(lam · 4,5)²)`, luces de ciudad en tierra nocturna y
atmósfera con efecto Fresnel según la dirección de la cámara.

## Shader de fragmentos

Disco suave: descarta fuera del radio 0,5 y alfa `pow(1 − 2d, 1.8) · vA`.

## Material

- `ShaderMaterial` con `transparent: true`, `depthWrite: false`, `depthTest: false`,
  `blending: AdditiveBlending`. La suma de luz da el brillo «de galaxia» sin ordenar partículas.
- `frustumCulled = false` en el objeto (las formas ocupan regiones distintas).

## Estrellas de fondo

Objeto aparte (2.500–5.000 puntos en una esfera de radio 70–130), titileo por shader y visibilidad
`smoothstep(0.02, 0.4, m)`: antes del Big Bang no hay estrellas.

## Mejoras respecto al prototipo

- Los shaders pasan a archivos `.glsl` con constantes con nombre (sin números mágicos sueltos).
- `uMotion` para el movimiento reducido (el prototipo solo quitaba la gravedad).
- WebGL2 (Three.js actual ya no soporta WebGL1); sin límite práctico de atributos.
