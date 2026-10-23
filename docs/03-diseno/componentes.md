# Componentes de interfaz

> Cada componente con su anatomía, variantes y estados. Todos usan tokens de `design-system.md`.
> Estados comunes: **hover** (color `--color-star` o borde ámbar), **focus-visible** (contorno
> `--focus-width` `--color-star`, separación `--focus-offset`), **active**, **disabled** (`--opacity-disabled`,
> sin puntero), **hot** (resaltado
> sincronizado con la escena).

## Estructura y lectura

### Panel de capítulo
- Contenedor del texto de cada capítulo. Fondo: degradado radial de `--color-veil` (opaco a la izquierda,
  transparente hacia los bordes) para que no se vea un rectángulo duro sobre la escena.
- **Corchetes de esquina** ámbar en la izquierda (arriba y abajo), 14 px, 1 px.
- Relleno `--space-6`; ancho `--panel-w`. *Sticky* (`top: --panel-top`, 14vh) en escritorio; normal en móvil.
- **Panel más alto que la ventana** (Proyectos a 1280×720): el panel publica su altura (`--_panel-h`) y su tope
  pasa a `min(--panel-top, 100svh − altura − --space-6)`. Sube con el scroll hasta que su borde inferior queda
  a la vista y ahí se fija: todo el texto y cada enlace enfocado pasan por la pantalla.

### Eyebrow
- Una línea `--text-label` en mono: **sección** en ámbar + `· escena · tiempo` en `--color-dim`.

### Título de capítulo (`h2`) · Párrafo · Lista de etiquetas (fortalezas)
- Títulos según escala. Párrafos `--color-ink-soft`.
- Etiqueta: mono 12 px, borde 1 px `--color-faint`, relleno `--space-2`/`--space-3` (8/12 px, en la rejilla de 4),
  sin radio.

## Acciones

### Botón de contorno (`ButtonOutline`)
- Mono `--text-label` en mayúsculas, borde 1 px `--color-faint`, fondo velo con desenfoque.
- Uso: «Quick mission», «Back to the journey», «Copy».

### Botón de mantener (`HoldButton`)
- Anillo de progreso SVG ámbar de 26 px (pista `--color-faint`) + texto mono. La variable privada `--_charge`
  (0–1), que escribe en el botón quien lleva la carga, dibuja el trazo (`stroke-dashoffset`).
- `touch-action: none`, sin selección de texto (con su pareja `-webkit-user-select` para Safari), sin menú
  contextual. Acepta una clase del dueño para colocarlo (en el hero móvil ocupa el ancho de la fila).
- Nombre accesible = texto visible («Hold to detonate»); la explicación larga va en `aria-describedby`, en un
  elemento `hidden` (el lector la toma igual y en modo exploración no la repite como texto suelto).
- Estados: reposo · cargando · detonado (`aria-disabled`, sin perder el foco, hasta volver al inicio).
- Con varios dedos manda el que empezó la carga. Si la ventana pierde el foco o la pestaña se oculta, suelta.

### Enlace de acción (`ActionLink`)
- Mono 12 px en mayúsculas con subrayado de 1 px `--color-faint` separado 2 px; al pasar, ámbar.
- Externos: icono de enlace externo y `rel="noopener noreferrer"`; se abren en pestaña nueva.

### Botón copiar (`CopyButton`)
- Estados de texto: Copy → Copied (1,8 s) / Select and copy it. Anuncio en `aria-live="polite"`.

## Navegación

### Barra superior (`TopBar`)
- Fija, transparente con desenfoque de fondo (`--blur-chrome`), con el logo a la izquierda y las acciones a la
  derecha. Margen lateral de página. Altura fija `--topbar-h` (64 px) más la zona segura de arriba.
- Logo en mono 13 px (`--tracking-logo`); acciones en mono `--text-label` en mayúsculas. Todo con 44 px de alto.
- El selector de idioma `EN / ES` (`LanguageSwitch`) es un par de enlaces en un grupo con nombre («Language»),
  cada uno nombrado en su idioma («English», «Español», con `lang`); el activo, subrayado ámbar y
  `aria-current="true"`.

### Enlace de salto (`SkipLink`)
- «Skip to content», mono `--text-label` en mayúsculas, ámbar sobre `--color-void` con borde ámbar. Fuera de la
  vista (por encima de la ventana) hasta que recibe el foco; entonces aparece arriba a la izquierda, sobre la
  barra (`--z-skip`).

### Chip de disponibilidad (`AvailabilityChip`)
- Punto turquesa de 6 px que «respira» (opacidad, sin escala) + «Open to work». Borde `--color-faint`.
- Con movimiento reducido el punto no respira.

### Raíl (`ChapterRail`)
- Columna de 5 botones alineados a la derecha: texto (sección en Geologica 500 a 13 px + escena en mono 10 px,
  `--text-nano`) y punto de 7 px. Los botones miden lo que el más ancho: los puntos forman una columna.
- Activo: punto ámbar relleno, escala 1,4 y halo; texto opaco. Inactivos: texto al 45 % (`--opacity-muted`).
- Nombre accesible = `aria-label` con el texto completo («About · Nebula»), también en escritorio.
- Por debajo de `--bp-md`: solo puntos, cada botón de 44 × 44 px.
- Solo se repinta cuando cambia el capítulo activo, no con cada píxel de scroll.

### HUD (`CosmicHud`)
- Dos líneas en mono: reloj (13 px, valores en ámbar) y escala (11 px, `--color-dim`). `aria-hidden`, sin
  puntero. El valor en ámbar es el número que se inserta (`200`, `⁻⁴³`); «t = 0 s» y «t = ∞» van sin ámbar.
- Abajo a la derecha en escritorio, abajo a la izquierda por debajo de 900 px y oculto por debajo de 520 px.
- Lee `m` por suscripción y escribe en el DOM solo cuando cambia su texto, sin re-renderizar.

## Escena ↔ interfaz

### Etiqueta de estrella (`StarLabel`)
- Mono 11 px, `--color-dim`, con un trazo de 6 px a la izquierda que apunta a la estrella. *Hot*: ámbar.
- Posicionada por proyección 3D → 2D en cada frame; opacidad según el peso del capítulo.

### Pin de placa (`PlatePin`)
- Tallo vertical de 46 px (degradado ámbar a transparente) + etiqueta con borde y velo. *Hot*: borde y texto ámbar.

### Grupo de habilidades (`SkillGroup`)
- Bloque con borde izquierdo de 1 px; título mono en `--color-dim` y skills en texto normal. *Hot*: borde y
  título ámbar. Es enfocable (`tabindex="0"`) para encender la constelación con teclado **desde F4.3**: sin
  escena no enciende nada, así que hasta entonces no entra en el orden de tabulación y solo se resalta al pasar el
  puntero.

### Fila de proyecto (`ProjectRow`)
- Borde izquierdo de 1 px; nombre en display (`--text-h3`), año alineado a la derecha en mono, metadatos en mono
  (con «Featured» en turquesa), resumen y acciones. *Hot*: borde ámbar y degradado ámbar muy tenue de fondo, que entra con un
  fundido de opacidad (`--dur-fade-base`) en su propia capa.

## Contacto

### Email destacado
- Display 700, `wdth` 112, seleccionable (`user-select: all`), con corte de línea seguro en móvil. Tan ancho como
  su texto (no toda la fila del panel) y con el alto mínimo del área táctil (`--target-min`).

### Órbita (`OrbitItem`, formación)
- Rejilla de 2 columnas: título a la izquierda, periodo y horas a la derecha (mono); debajo, academia y skills.
  Separador superior de 1 px.

## Diálogos y avisos

### Modo misión rápida (`QuickMissionDialog`)
- `<dialog>` modal a pantalla completa, fondo `--color-void` al 96 %. Contenido en rejilla `auto-fit` de
  columnas de mínimo 280 px.

### Visor de galería (`Lightbox`)
- `<dialog>` con la imagen centrada, contador mono «3 / 9», flechas y cerrar. Teclado ← → Esc.

### Aviso (`Notice`)
- Barra flotante abajo, mono 12 px, velo y borde. Uso: sin WebGL, sugerencia de idioma. Descartable.

### Nota de proyecto (`ProjectNote`)
- Bloque con borde izquierdo de 2 px: turquesa (`info`) o ámbar (`warning`), icono y texto.

## Accesibilidad común

- Área táctil mínima 44 × 44 px en todo lo pulsable (aunque el dibujo sea menor).
- Ningún estado se comunica solo con color: el activo del raíl también cambia de tamaño y `aria-current`.
