# Design system · fundamentos

> Tokens y reglas visuales. Componentes en `componentes.md`; movimiento en `movimiento.md`.
> En el código, los tokens viven como **variables CSS** en `src/styles/tokens.css` y se usan desde los
> CSS Modules. Ningún componente usa un color, tamaño, duración ni familia tipográfica literal: siempre un token.
> Única excepción: las **variables privadas** de un componente, con prefijo `--_` (`--_progress`), que se definen
> en su CSS Module o desde el código (`style={{ '--_progress': … }}`). Lo vigila `src/styles/styles.test.ts`.

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
| `--color-veil-soft` | `rgb(4 5 11 / 0.62)` | Paso intermedio del velo radial de los paneles (escritorio) | — |
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
| Datos | `--font-mono` | IBM Plex Mono 400/500 | Eyebrows, HUD, raíl, etiquetas, metadatos, botones de acción |

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

En el código, cada tamaño `--text-*` va con su interlineado `--leading-*` (`--leading-hero`, `--leading-h1`…).
Los ajustes de la tabla también son tokens: `--weight-display` 800, `--weight-hero` 850, `--weight-body` 400,
`--weight-strong` 600, `--weight-mono` 400, `--weight-mono-strong` 500 · `--wdth-hero-rest` 62 %, `--wdth-h1`
135 %, `--wdth-h2` 128 %, `--wdth-h3` 140 % (se aplican con `font-stretch`) · `--tracking-label` 0.14em,
`--tracking-micro` 0.1em, `--tracking-logo` 0.16em · `--hero-accent-room` 0.14em · `--underline-offset` 0.2em
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
| `--content-max` | 1200 px | Ancho máximo de galería y portada |
| `--panel-top` | 14vh | Separación superior del panel y su posición *sticky* (escritorio) |
| `--scene-clear-mobile` | 70vh | Escena limpia antes del panel en móvil (< md) |
| `--corner-size` | 14 px | Corchetes de esquina de los paneles |
| `--chapter-h-0` … `--chapter-h-4` | 150 / 210 / 220 / 240 / 130 vh (< md: 150 / 230 / 240 / 260 / 130) | Altura **mínima** de recorrido de cada capítulo (`scroll-y-escena.md`) |
| `--chapter-end-room` | 12vh | Aire bajo el último capítulo |
| `--hero-room-bottom` | 12vh (< sm: 10vh) | Aire bajo el contenido del hero |
| `--hero-indent` · `--hero-lead-measure` | 0.6em · 40ch | Sangría de la segunda línea del nombre · ancho de la frase del hero |
| `--singularity-halo-size` · `--singularity-core-size` | 46vmin · 6 px | Halo y punto de la singularidad en CSS |
| `--hold-ring-size` · `--hold-ring-stroke` | 26 px · 3 px | Anillo de carga del `HoldButton` |

(Los breakpoints no son tokens: una variable CSS no puede usarse en una media query. Se escriben como número
en las media queries y están anotados en la cabecera de `tokens.css`.)

## Forma, bordes y profundidad

- **Radio 0** en todo, salvo puntos y anillos (50 %). Es parte del lenguaje de instrumento.
- Bordes: `--border-width` (1 px) `--color-faint`; activo: `--border-width` `--color-star`.
- Foco visible: contorno `--focus-width` (2 px) `--color-star` con separación `--focus-offset` (3 px), global en
  `:focus-visible`.
- Sin sombras de tarjeta. El único «brillo» de la interfaz es el halo del punto activo del raíl
  (`--glow-star` = `0 0 12px --color-star`); el punto CSS de la singularidad lleva el suyo (`--glow-singularity`).
- Desenfoque de fondo (`backdrop-filter: blur(var(--blur-chrome))`, 6 px) solo en barra superior, pins y botones
  flotantes.
- Deshabilitado: `--opacity-disabled` (0,4). Área táctil mínima: `--target-min` (44 px).

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
| `--z-dialog` | 40 | Modo misión rápida y visor de galería |
| `--z-toast` | 50 | Avisos (sin WebGL, sugerencia de idioma) |

## Iconos

- Conjunto mínimo de **SVG en línea** propios: flecha, enlace externo, copiar, cerrar, chevrones, GitHub,
  LinkedIn, descarga. Trazo 1,5 px, tamaños 16 y 20 px, `currentColor`.
- Van **en línea** con el texto: `global.css` no les da `display: block`; el componente de icono fija su propio
  `display` según dónde se use.
- Una flecha dentro de un texto (por ejemplo «Go to Courses → All courses») se pinta con el **icono SVG de
  flecha**, no con el carácter «→»: el subconjunto latino de las fuentes no trae U+2192 y saldría con la fuente del
  sistema.
- Decorativos con `aria-hidden="true"`; el botón lleva el texto o el `aria-label`.

## Marca

- **Logotipo:** la palabra `TORTOISE_CODE` en `--font-mono`, `letter-spacing: var(--tracking-logo)` (0.16em).
- **Favicon:** un hexágono ámbar (una placa del caparazón) con un punto blanco en el centro (la singularidad).
  Versión SVG + PNG 180 px para iOS.
