# Scroll y escena

## Idea

El scroll es una **línea de tiempo**. Su posición se traduce en un número continuo `m` entre 0 y 4:
`m = 0` es la singularidad, `m = 1` la nebulosa, `m = 2` la galaxia, `m = 3` la tortuga y `m = 4` la Tierra.
Todo lo que se mueve (partículas, cámara, HUD, raíl, efectos del hero) lee `m`. Nada más controla el tiempo.

```
scroll (px) ──► m objetivo ──► suavizado ──► m (por frame) ──► escena · cámara · HUD · raíl
```

## Capítulos y alturas

Cada capítulo es una `<section>` con altura **mínima** para dar recorrido al scroll (valores del prototipo, a ajustar
con pruebas reales; tokens `--chapter-h-*` de `docs/03-diseno/design-system.md`). Es mínima y no fija: si el texto no
cabe, la sección crece y nunca lo recorta (P1); `mapM` mide la altura real.

| Capítulo | Altura escritorio | Altura móvil | Ventana de morph hacia el siguiente |
|---|---|---|---|
| 0 · Singularidad | 150 vh | 150 vh | del 0 % al 100 % de la sección (la explosión empieza al primer scroll) |
| 1 · Nebulosa | 210 vh | 230 vh | del 52 % al 100 % |
| 2 · Galaxia | 220 vh | 240 vh | del 52 % al 100 % |
| 3 · Tortuga | 240 vh | 260 vh | del 55 % al 100 % |
| 4 · Tierra | ≥ 130 vh (según contenido) | ≥ 130 vh | — (última) |

**Cálculo de `m`** (función pura, testeable):

```
para el capítulo i que contiene la posición y:
  f = (y − inicio_i) / altura_i
  m = i + smoothstep(ventana_i, 1, f)
```

Así, cada forma **se queda quieta** mientras lees la primera mitad de su capítulo y solo cambia en la segunda.

## Suavizado

- `m` persigue al valor objetivo con un amortiguado exponencial: `m += (objetivo − m) · min(1, dt · k)`,
  con `k ≈ 3,4` (y `k ≈ 12` con movimiento reducido, que equivale a casi sin inercia).
- El suavizado es **independiente de los fps** (usa `dt`). Por debajo de un umbral (`|objetivo − m| < 1e-4`)
  se iguala para no recalcular sin fin.
- No se usa scroll suavizado de terceros (Lenis, etc.): el scroll del navegador se respeta tal cual, solo se
  suaviza la escena. Así no se rompen la accesibilidad, los atajos de teclado ni la restauración del scroll.

## Morph entre formas (comportamiento visible)

- Entre dos formas, cada partícula sale con un **retraso aleatorio** (hasta un 25 % de la transición): el cambio
  se ve orgánico, no como un bloque.
- A mitad de transición las partículas se **dispersan** un poco (polvo cósmico) y vuelven a juntarse.
- La primera transición (0 → 1) es la **explosión**: salida exponencial con rebasamiento y color blanco
  incandescente que se enfría hacia los colores de la nebulosa.

## Lo que depende de `m` además de la escena

| Elemento | Comportamiento |
|---|---|
| Raíl | Capítulo activo = `round(m)` |
| HUD · reloj | Tiempo cósmico interpolado en escala logarítmica entre capítulos (0 → 1 → 2); `∞` en la tortuga; 13.800 Ma en la Tierra |
| HUD · escala | La del capítulo activo |
| Hero · nombre | Ancho tipográfico de 62 a 150 (eje `wdth`) y espaciado al detonar; se va con el scroll |
| Destello | Pico al principio de la explosión (`m` de 0 a 0,2) |
| Encuadre | En escritorio, la escena se desplaza a la derecha para dejar sitio a los paneles (cantidad por capítulo en `docs/04-escena/`) |
| Estrellas de fondo | No existen antes del Big Bang: aparecen entre `m` 0,02 y 0,4 |

## Criterios de aceptación

1. Con el scroll quieto, la escena se estabiliza en < 1 s y no consume CPU de más (sin recalcular si `m` no cambia).
2. Saltar con el raíl a un capítulo lejano produce un viaje rápido y continuo, nunca un salto brusco de formas.
3. Recargar la página a mitad del viaje muestra la escena correcta para esa posición, sin repetir la explosión.
4. La función de `m` tiene tests con los bordes: inicio, final, cambio de capítulo, alturas cambiadas por resize.
