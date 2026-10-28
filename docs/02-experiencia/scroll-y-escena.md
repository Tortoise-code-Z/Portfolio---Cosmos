# Scroll y escena

## Idea

El scroll es una **línea de tiempo**. Su posición se traduce en un número continuo `m` entre 0 y 4:
`m = 0` es la singularidad, `m = 1` la nebulosa, `m = 2` la galaxia, `m = 3` la tortuga y `m = 4` la Tierra.
Todo lo que se mueve (partículas, cámara, HUD, raíl, efectos del hero) lee `m`. Nada más controla el tiempo.

```
scroll (px) ──► m objetivo (mTarget) ──┬──► raíl · HUD · idioma (a saltos, con y sin escena)
                                       └──► suavizado (escena) ──► m por frame ──► partículas · cámara · estrellas
```

## Capítulos y alturas

Cada capítulo es una `<section>` con altura **mínima** para dar recorrido al scroll (valores del prototipo, a ajustar
con pruebas reales; tokens `--chapter-h-*` de `docs/03-diseno/design-system.md`). Es mínima y no fija: si el texto no
cabe, la sección crece y nunca lo recorta (P1); `useChapterLayout` mide la altura real y `mapM` la usa.

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

La posición `y` es la de scroll y los capítulos se miden **bajo la barra fija**: cada uno empieza en el scroll que
lo deja justo debajo (`max(0, inicio − barra)`, `toScrollLayout`). Un ancla da el índice exacto de su capítulo y,
arriba del todo, `m` sigue siendo 0 (la barra no adelanta la explosión). Código: `src/lib/scroll/` (`mapM`,
`useChapterLayout`, `useScrollTarget`) y `src/stores/sceneStore/`.

## Suavizado

- La escena suaviza **su propia** `m` (ADR-028): persigue al valor objetivo con un amortiguado exponencial,
  `m += (objetivo − m) · min(1, dt · k)`, con `k = 3,4` (y `k = 12` con movimiento reducido, que equivale a casi
  sin inercia). En su primer frame arranca en el objetivo: si el usuario ya había hecho scroll, no se repite la
  explosión. Código: `src/lib/math/damp` y el bucle de `SceneRoot` (`M_SMOOTHING` en `scene/config/sceneConfig`).
- El suavizado es **casi independiente de los fps** (usa `dt`; `min(1, dt · k)` es la aproximación por pasos de la
  curva exacta). Por debajo de un umbral (`|objetivo − m| < 1e-4`) se iguala para llegar exacta al objetivo.
- **La interfaz no se suaviza:** `sceneStore.m` es el objetivo tal cual, con y sin escena. Quienes lo leen (raíl,
  HUD, idioma) cambian a saltos, así que no lo necesitan; durante la inercia van un instante por delante de la
  escena. Sin escena (WebGL desactivado) no hay suavizado en ningún sitio.
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
| HUD · reloj | `t = 0 s` hasta `m` 0,004; después, tiempo cósmico interpolado en escala logarítmica entre capítulos (0 → 1 → 2): del tiempo de Planck (10⁻⁴³ s) a 200 Ma y a 1000 Ma. Se cuenta en segundos (potencias de 10) mientras el valor redondeado no llegue a 2 años (nunca «1 years»); después, años y millones con 2 cifras significativas, y la unidad se elige con el valor ya redondeado (999.999 años ya es «1 million»); 1000 Ma hasta `m` 2,5; `∞` de 2,5 a 3,5 (la tortuga es el capítulo activo); 13.800 Ma desde 3,5 |
| HUD · escala | La del capítulo activo |
| Hero · nombre | Ancho tipográfico de 62 a 150 (eje `wdth`) y espaciado al detonar; se va con el scroll |
| Destello | Pico al principio de la explosión (`m` de 0 a 0,2) |
| Encuadre | En escritorio, la escena se desplaza a la derecha para dejar sitio a los paneles (cantidad por capítulo en `docs/04-escena/`) |
| Estrellas de fondo | No existen antes del Big Bang: aparecen entre `m` 0,02 y 0,4 |

## Criterios de aceptación

1. Con el scroll quieto, la escena se asienta a la vista en ~1 s y llega exacta al objetivo; el bucle sigue pintando
   (ADR-027) salvo en pausa (pestaña oculta o misión rápida abierta).
2. Saltar con el raíl a un capítulo lejano produce un viaje rápido y continuo, nunca un salto brusco de formas.
3. Recargar la página a mitad del viaje muestra la escena correcta para esa posición, sin repetir la explosión.
4. La función de `m` tiene tests con los bordes: inicio, final, cambio de capítulo, alturas cambiadas por resize.
