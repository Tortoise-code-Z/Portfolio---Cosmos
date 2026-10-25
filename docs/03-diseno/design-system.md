# Design system · fundamentos

> Tokens y reglas visuales. Componentes en `componentes.md`; movimiento en `movimiento.md`.
> En el código, los tokens viven como **variables CSS** en `src/styles/tokens.css` y se usan desde los
> CSS Modules. Ningún componente usa un color, tamaño, duración ni familia tipográfica literal: siempre un token.
> Excepciones escritas: las **variables privadas** de un componente, con prefijo `--_` (`--_progress`), que se
> definen en su CSS Module o desde el código (`style={{ '--_progress': … }}`); las **unidades de viewport** que
> colocan algo respecto a la ventana (`50svh`, `100svh`: el punto del hero, su altura, el tope del panel *sticky*);
> y el patrón **visualmente oculto** (`VisuallyHidden`, caja de `1px`), que es un mecanismo y no una medida de
> diseño. Lo vigila `src/styles/styles.test.ts`.

## Concepto

**Instrumental y cósmico.** La interfaz se comporta como el panel de un instrumento de observación (etiquetas
monoespaciadas, corchetes de esquina, líneas finas, cero bordes redondeados) sobre un universo que es lo único
con color y brillo. La interfaz es sobria para que la escena sea la protagonista; el acento ámbar marca solo lo
activo.

## Tema

- **Solo oscuro, a propósito (ADR-015).** Es un único mundo visual (el espacio). `color-scheme: dark` en `:root`,
  fondo explícito y todos los colores definidos como tokens. No hay tema claro.

## Color

### Interfaz

| Token | Valor | Uso | Contraste sobre `--color-void` |
|---|---|---|---|
| `--color-void` | `#04050b` | Fondo de página y de la escena | — |
| `--color-ink` | `#eef0f7` | Títulos y texto principal | 17,9 : 1 |
| `--color-ink-soft` | `#cfd3e3` | Párrafos | 13,6 : 1 |
| `--color-dim` | `#a4aac3` | Etiquetas, metadatos, texto secundario | 8,8 : 1 |
| `--color-faint` | `rgb(238 240 247 / 0.16)` | Líneas finas, bordes, separadores | (no es texto) |
| `--color-star` | `#ffc46b` | **Acento**: activo, foco, resaltados, enlaces al pasar | 12,9 : 1 |
| `--color-aurora` | `#62e8cf` | Acento secundario: naturaleza, «Featured», disponibilidad | 13,5 : 1 |
| `--color-veil` | `rgb(4 5 11 / 0.82)` | Fondo de los paneles sobre la escena | — |
| `--color-veil-soft` | `rgb(4 5 11 / 0.62)` | Paso intermedio del velo radial de los paneles (escritorio) y fondo de los botones `ButtonOutline` y `HoldButton` | — |
| `--color-veil-chrome` | `rgb(4 5 11 / 0.7)` | Fondo de la barra superior y de los avisos, bajo el desenfoque: `--color-ink-soft` da 5,8:1 aunque pase `--color-ink` por debajo | — |
| `--color-veil-dialog` | `rgb(4 5 11 / 0.96)` | Fondo de los diálogos a pantalla completa: el modo misión rápida y el visor de galería | — |
| `--gradient-row-hot` | degradado ámbar al 8 % → transparente | Fondo de una fila de proyecto «hot» | — |
| `--gradient-panel` · `--gradient-panel-mobile` | velo radial · velo que entra desde arriba (`--space-8`) | Fondo del panel en escritorio · en móvil | — |
| `--color-flash` | `#fff4dc` | Destello del Big Bang | — |
| `--color-singularity` | `#fff2d9` | Punto CSS de la singularidad (hero sin escena) | — |
| `--gradient-singularity-halo` | radial cálido → azul → transparente | Halo CSS del punto | — |

**Garantía de lectura:** el peor caso medido (texto sobre el velo encima de la zona más brillante de la escena)
da `--color-dim` 5,9 : 1 y `--color-ink` > 10 : 1: todo el texto cumple AA.

Reglas:
- El ámbar es **el único** acento de estado (activo, foco, hover). El turquesa nunca indica estado.
- Avisos de las páginas de proyecto: `info` con borde turquesa, `warning` con borde ámbar. Sin rojos.

### Paleta de la escena (referencia; se definen como constantes del shader en `docs/04-escena/`)

| Escena | Colores principales |
|---|---|
| Singularidad / destello | blanco cálido `#fff2d9`, azul hielo `#c7dbff` |
| Nebulosa | magenta `#ff4291`, violeta `#8047ff`, turquesa `#24d9e0`, ámbar `#ff9947`, núcleo `#ffe6b8` |
| Galaxia | núcleo `#ffd18c`, brazos `#618cff` con toques `#f273ff` |
| Tortuga | caparazón `#1a998a`, bordes y placas `#ffa847`, bosque `#52f26b`, cuerpo `#38c7a3`, estela `#73bfff` |
| Tierra | océano `#1247d9`, tierras `#47b852` / `#c79e5c`, nubes `#f2f7ff`, atmósfera `#599eff`, amanecer `#ff7326` |

## Tipografía

| Rol | Token | Familia | Uso |
|---|---|---|---|
| Display | `--font-display` | Anybody (variable `wdth` 50–150, `wght` 100–900) | Nombre del hero, títulos de capítulo, nombres de proyecto. Siempre en mayúsculas. |
| Texto | `--font-body` | Geologica (variable 300–700) | Párrafos, botones de lectura, listas |
| Datos | `--font-mono` | IBM Plex Mono 400/500 | Eyebrows, HUD, escena del raíl, etiquetas, metadatos, botones de acción |

Fallbacks: `"Arial Narrow", "Helvetica Neue", sans-serif` · `system-ui, -apple-system, "Segoe UI", sans-serif` ·
`ui-monospace, "SFMono-Regular", Menlo, monospace`.

Las fuentes se autoalojan con `@font-face` propios en `src/styles/fonts.css` (familias `Anybody`, `Geologica` e
`IBM Plex Mono`, solo subconjunto latino) y `root.tsx` precarga Anybody y Geologica. Archivos y pesos →
`docs/05-tecnico/stack.md`.

### Escala

| Token | Tamaño | Interlineado | Familia y ajustes |
|---|---|---|---|
| `--text-hero` | `clamp(3.6rem, 14vw, 12.5rem)` | 0.8 | Display 850, `wdth` variable (62 en reposo → 150), mayúsculas |
| `--text-h1` | `clamp(2.4rem, 6vw, 4.6rem)` | 0.92 | Display 800, `wdth` 135 (títulos de página de proyecto) |
| `--text-h2` | `clamp(2rem, 4.4vw, 3.4rem)` | 0.94 | Display 800, `wdth` 128, `text-wrap: balance` |
| `--text-h3` | `clamp(1.4rem, 2.6vw, 1.9rem)` | 1 | Display 800, `wdth` 140 (nombres de proyecto) |
| `--text-lead` | `1.0625rem` (17 px) | 1.55 | Body 400 |
| `--text-body` | `1rem` (16 px) | 1.6 | Body 400; `strong` 600 |
| `--text-small` | `0.8125rem` (13 px) | 1.5 | Body 400 |
| `--text-label` | `0.75rem` (12 px) | 1.4 | Mono 400–500, mayúsculas, `letter-spacing: var(--tracking-label)` |
| `--text-micro` | `0.6875rem` (11 px) | 1.3 | Mono 400, mayúsculas, `letter-spacing: var(--tracking-micro)` |
| `--text-nano` | `0.625rem` (10 px) | 1.15 | Mono 400, mayúsculas, `letter-spacing: var(--tracking-label)` (escena del raíl) |

El email de contacto tiene su propio tamaño y ajustes: `--text-email` `clamp(1.05rem, 2.3vw, 1.5rem)`
(interlineado `--leading-email` 1.2), `--weight-email` 700 y `--wdth-email` 112 %.

En el código, cada tamaño `--text-*` va con su interlineado `--leading-*` (`--leading-hero`, `--leading-h1`…).
Los ajustes de la tabla también son tokens: `--weight-display` 800, `--weight-hero` 850, `--weight-body` 400,
`--weight-strong` 600, `--weight-medium` 500 (sección del raíl, en Geologica), `--weight-mono` 400,
`--weight-mono-strong` 500 · `--wdth-hero-rest` 62 %, `--wdth-h1`
135 %, `--wdth-h2` 128 %, `--wdth-h3` 140 % (se aplican con `font-stretch`) · `--tracking-label` 0.14em,
`--tracking-micro` 0.1em, `--tracking-logo` 0.16em (la pareja tamaño/tracking de la tabla es la de partida: una
etiqueta puede cruzarlos por uso, como la pista del hero o las etiquetas de bloque en `--text-micro` con
`--tracking-label`, o la disponibilidad de Contacto en `--text-label` con `--tracking-micro`) · `--hero-accent-room` 0.14em · `--underline-offset` 0.2em
(separación del subrayado de los enlaces) · `--measure` 62ch.
`global.css` da a `h1`–`h3` el rol display (Anybody 800, mayúsculas, su tamaño, interlineado y `wdth`).

Reglas:
- Ancho de lectura máximo **~62 caracteres** (`max-width: var(--measure)`).
- Números alineados (`font-variant-numeric: tabular-nums`) en HUD, años y horas.
- El eje `wdth` es la firma tipográfica: estrecho = energía contenida, ancho = expansión.
- Los acentos de las mayúsculas (Í, É) necesitan aire: `padding-top: var(--hero-accent-room)` (0.14em) en el hero.

## Espaciado

Escala de base 4 px: `--space-1` 4 · `--space-2` 8 · `--space-3` 12 · `--space-4` 16 · `--space-5` 24 ·
`--space-6` 32 · `--space-7` 48 · `--space-8` 64 · `--space-9` 96.

- Separación entre hermanos con `gap` (flex/grid), no con márgenes sueltos.
- **Margen lateral de página:** `--gutter` = `max(24px, env(safe-area-inset-*))` en escritorio; `max(16px, …)` por
  debajo de 520 px (el token cambia solo con la media query).

## Layout

| Token | Valor | Uso |
|---|---|---|
| Breakpoint sm | 520 px | Móvil pequeño → móvil |
| Breakpoint md | 900 px | Móvil/tableta → escritorio (paneles *sticky*, raíl con texto) |
| Breakpoint lg | 1280 px | Escritorio amplio |
| `--panel-w` | 540 px | Panel de capítulo |
| `--panel-w-wide` | 600 px | Panel de contacto |
| `--read-w` | 720 px | Columna de la página de proyecto |
| `--content-max` | 1200 px | Ancho máximo del modo misión rápida |
| `--panel-top` | 14vh | Separación superior del panel y su posición *sticky* (escritorio) |
| `--topbar-h` | 64 px | Altura fija de la barra superior (sin contar la zona segura de arriba) |
| `--scene-clear-mobile` | 70vh | Escena limpia antes del panel en móvil (< md) |
| `--corner-size` | 14 px | Corchetes de esquina de los paneles, la portada de un proyecto y la 404 |
| `--chapter-h-0` … `--chapter-h-4` | 150 / 210 / 220 / 240 / 130 vh (< md: 150 / 230 / 240 / 260 / 130) | Altura **mínima** de recorrido de cada capítulo (`scroll-y-escena.md`) |
| `--chapter-end-room` | 12vh | Aire bajo el último capítulo |
| `--hero-room-bottom` | 12vh (< sm: 10vh) | Aire bajo el contenido del hero |
| `--hero-indent` · `--hero-lead-measure` | 0.6em · 40ch | Sangría de la segunda línea del nombre · ancho de la frase del hero |
| `--singularity-halo-size` · `--singularity-core-size` | 46vmin · 6 px | Halo y punto de la singularidad en CSS |
| `--hold-ring-size` · `--hold-ring-stroke` | 26 px · 3 px | Anillo de carga del `HoldButton` |
| `--rail-dot-size` · `--rail-dot-scale-active` | 7 px · 1,4 | Punto del raíl y su escala cuando es el activo |
| `--chip-dot-size` · `--opacity-breathe-low` | 6 px · 0,35 | Punto del chip «Open to work» y la opacidad más baja de su respiración |
| `--quick-col-min` | 280 px | Ancho mínimo de cada columna del modo misión rápida (`auto-fit`) |
| `--project-col-min` | 220 px | Ancho mínimo de cada columna de las rejillas de la página de proyecto (funcionalidades, stack, galería, anterior/siguiente) |
| `--gallery-thumb-ratio` | 2 / 1 | Proporción de las miniaturas de la galería, la de las capturas (~2,1:1): se recorta al centro casi nada; entera en el visor |

(Los breakpoints no son tokens: una variable CSS no puede usarse en una media query. Se escriben como número
en las media queries y están anotados en la cabecera de `tokens.css`.)

## Forma, bordes y profundidad

- **Radio 0** en todo, salvo puntos y anillos (50 %). Es parte del lenguaje de instrumento.
- Bordes: `--border-width` (1 px) `--color-faint`; activo: `--border-width` `--color-star`. Las notas de proyecto
  llevan un borde izquierdo más grueso, `--note-border-width` (2 px).
- Foco visible: contorno `--focus-width` (2 px) `--color-star` con separación `--focus-offset` (3 px), global en
  `:focus-visible`.
- Al llevar el foco con Tab o saltar a un ancla, el navegador deja libre arriba lo que tapa la barra fija
  (`scroll-padding-block-start` = `--topbar-h` + zona segura) y `--space-6` de aire abajo
  (`scroll-padding-block-end`), en `global.css`: ni el elemento ni su anillo quedan cortados ni debajo de la barra
  (WCAG 2.4.11). Las anclas dejan su capítulo justo bajo la barra. Mientras se ve un aviso (`Notice`), el hueco de
  abajo crece con su altura (componentes.md → «Aviso»).
- `scrollbar-gutter: stable` en `:root`: con barras de scroll clásicas (Windows), bloquear el scroll al abrir un
  diálogo no hace saltar la página a lo ancho.
- Sin sombras de tarjeta. El único «brillo» de la interfaz es el halo del punto activo del raíl
  (`--glow-star` = `0 0 12px --color-star`); el punto CSS de la singularidad lleva el suyo (`--glow-singularity`).
- Desenfoque de fondo (`backdrop-filter: blur(var(--blur-chrome))`, 6 px) solo en barra superior, pins, botones de
  contorno y avisos. La barra lleva además un velo (`--color-veil-chrome`) para no depender de lo que pase por debajo.
- Deshabilitado: `--opacity-disabled` (0,4). Apagado sin estar deshabilitado (texto de los capítulos inactivos del
  raíl): `--opacity-muted` (0,7), que mantiene AA sobre `--color-void` (8,7:1 con `--color-ink`, 4,7:1 con
  `--color-dim`). Área táctil mínima: `--target-min` (44 px).
- Alto contraste (`forced-colors: active`): el sistema quita fondos y sombras. Lo que se distingue solo por ellos
  (el punto activo del raíl) se pinta con un color del sistema (`Highlight`); los colores del sistema son los
  únicos literales permitidos fuera de `tokens.css`.

## Capas (z-index)

| Token | Valor | Capa |
|---|---|---|
| `--z-scene` | 0 | Lienzo WebGL |
| `--z-glow` | 1 | Halo CSS de la singularidad |
| `--z-flash` | 3 | Destello |
| `--z-labels` | 4 | Etiquetas y pins proyectados |
| `--z-content` | 5 | Capítulos y paneles |
| `--z-chrome` | 15 | Raíl y HUD |
| `--z-topbar` | 20 | Barra superior |
| `--z-skip` | 30 | «Skip to content» al recibir el foco (por encima de la barra) |
| `--z-dialog` | 40 | Reservado. Un `<dialog>` modal (misión rápida, visor de galería) va en la capa superior del navegador, por encima de todo, sin `z-index` |
| `--z-toast` | 50 | Avisos (sin WebGL, sugerencia de idioma) |

Excepción local: un componente que aísla su apilado (`isolation: isolate`) puede poner una capa decorativa detrás de
su propio contenido con `z-index: -1` (el brillo «hot» de la fila de proyecto). No compite con las capas de arriba.

## Iconos

- Conjunto mínimo de **SVG en línea** propios: flecha, enlace externo, copiar, cerrar, chevrones, GitHub,
  LinkedIn, descarga, información y aviso. Hoy existen `arrow-down`, `arrow-left`, `arrow-right`, `external`,
  `download`, `info` y `warning` (`ui/Icon`); los demás llegan cuando haga falta. Trazo 1,5 px (`vector-effect: non-scaling-stroke`: no engorda a 20 px), tamaños 16 y 20 px,
  `currentColor`. Bajan `--icon-baseline-shift` (−0,125em) para centrarse ópticamente con la x.
- Van **en línea** con el texto: `global.css` no les da `display: block`; el componente de icono fija su propio
  `display` según dónde se use.
- Una flecha dentro de un texto (por ejemplo «Go to Courses → All courses») se pinta con el **icono SVG de
  flecha**, no con el carácter «→»: el subconjunto latino de las fuentes no trae U+2192 y saldría con la fuente del
  sistema. Lo hace `ui/ArrowText`; el carácter queda oculto a la vista para el lector de pantalla.
- Excepción aceptada: el «≈» de los eyebrows de About y Skills (U+2248) tampoco está en el subconjunto y sale con la
  mono del sistema. Es un solo glifo, en texto pequeño y atenuado; no compensa un icono ni ampliar el subconjunto
  (bytes del presupuesto de fuentes), y «~» cambiaría el sentido. Se mira en los tres motores en F6.
- Misma excepción para el HUD: los superíndices `⁰ ⁴–⁹ ⁻` (U+2070–207B) del reloj y la escala («10⁻⁴³») y el «∞» de
  la tortuga (U+221E) tampoco están en el subconjunto de Plex Mono (`¹ ² ³` sí): en un mismo exponente se mezclan
  dos fuentes. El HUD es decorativo, pequeño y `aria-hidden`; se mira con el «≈» en F6.
- Decorativos con `aria-hidden="true"`; el botón lleva el texto o el `aria-label`.

## Marca

- **Logotipo:** la palabra `TORTOISE_CODE` en `--font-mono`, `letter-spacing: var(--tracking-logo)` (0.16em).
- **Favicon:** un hexágono ámbar (una placa del caparazón) con un punto blanco en el centro (la singularidad).
  Versión SVG + PNG 180 px para iOS.
