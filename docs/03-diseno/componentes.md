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
- Mono `--text-label` en mayúsculas, borde 1 px `--color-faint`, fondo velo con desenfoque; al pasar, borde y
  texto ámbar. Siempre `type="button"` y con 44 × 44 px como mínimo.
- Uso: «Quick mission», «Back to the journey», «Copy», «No, thanks».
- Si el texto visible es una forma corta («Quick»), el nombre accesible es el completo y la contiene (WCAG 2.5.3).

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
- Un `ButtonOutline`. Estados de texto: Copy → Copied (1,8 s) / Select and copy it (también 1,8 s).
- Nombre accesible con lo que copia («Copy email»: el sujeto va oculto a la vista).
- Si el portapapeles no existe (http) o lo rechaza, selecciona el texto (el email) para copiarlo a mano.
- El resultado se anuncia en una región `role="status"` aparte; el foco no se mueve. Lo usan Contacto y el modo
  misión rápida, cada uno con su email.

## Navegación

### Barra superior (`TopBar`)
- Fija, con velo oscuro (`--color-veil-chrome`) y desenfoque de fondo (`--blur-chrome`): el texto que pasa por
  debajo no le quita contraste. Logo a la izquierda y acciones a la derecha. Margen lateral de página. Altura fija
  `--topbar-h` (64 px) más la zona segura de arriba.
- Logo en mono 13 px (`--tracking-logo`); acciones en mono `--text-label` en mayúsculas. Todo con 44 × 44 px como
  mínimo. Si falta sitio, solo el logo cede (se recorta con «…»); las acciones no encogen.
- Orden: logo · chip de disponibilidad (desde md) · Projects · Contact (desde md) · CV · EN / ES · «Quick mission».
- «Quick mission» es un `ButtonOutline` (`aria-haspopup="dialog"`). Por debajo de sm (520 px) enseña la forma
  corta (`nav.quickShort`: «Quick», «Rápida»), que cabe a 390 px con el texto al 200 %.
- El selector de idioma `EN / ES` (`LanguageSwitch`) es un par de enlaces en un grupo con nombre («Language»),
  cada uno nombrado en su idioma («English», «Español», con `lang`); el activo, subrayado ámbar y
  `aria-current="true"`. Un clic normal en el activo no navega.

### Enlace de salto (`SkipLink`)
- «Skip to content», mono `--text-label` en mayúsculas, ámbar sobre `--color-void` con borde ámbar. Fuera de la
  vista (por encima de la ventana) hasta que recibe el foco; entonces aparece arriba a la izquierda, sobre la
  barra (`--z-skip`).

### Chip de disponibilidad (`AvailabilityChip`)
- Punto turquesa de 6 px (`--chip-dot-size`) que «respira» (opacidad de 1 a `--opacity-breathe-low`, sin escala,
  `--dur-breathe`) + «Open to work». Borde `--color-faint`; al pasar, borde y texto ámbar.
- Es un enlace a `#contact` (el mismo salto que «Contact»); el punto es decorativo. Solo si el perfil dice
  `openToWork`, y solo desde md (900 px).
- Con movimiento reducido el punto no respira.

### Raíl (`ChapterRail`)
- Columna de 5 enlaces alineados a la derecha: texto (sección en Geologica 500 a 13 px + escena en mono 10 px,
  `--text-nano`) y punto de 7 px. Los enlaces miden lo que el más ancho: los puntos forman una columna.
- Activo: punto ámbar relleno, escala 1,4 y halo; texto opaco. Inactivos: texto al 70 % (`--opacity-muted`, que
  cumple AA: 8,7:1 la sección y 4,7:1 la escena). Al pasar el puntero o con el foco del teclado, texto opaco.
- En alto contraste (`forced-colors`) el punto activo se rellena con `Highlight`: no solo es más grande.
- Nombre accesible = `aria-label` con el texto completo («About · Nebula»), también en escritorio.
- Por debajo de md (900 px): solo puntos, cada enlace de 44 × 44 px, a 8 px del borde (el anillo de foco cabe).
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
- `<dialog>` modal a pantalla completa, fondo `--color-veil-dialog` (`--color-void` al 96 %), con su propio scroll
  y entrada con un fundido (`--dur-fade-slow`). Contenido (`QuickMissionContent`) en rejilla `auto-fit` de columnas
  de mínimo `--quick-col-min` (280 px).
- Cabecera: «Quick mission · everything on one page» en mono atenuado y «Back to the journey» (`ButtonOutline`).
  Título `h2` «Víctor Pérez · Frontend Developer» (escala de `h3` por debajo de sm) y secciones con su `h3` en mono
  ámbar: About (bio y fortalezas), Projects (nombre `h4`, año, metadatos, resumen y enlaces), Skills, Education,
  Availability (si `openToWork`) y Contact (email con su `CopyButton`, GitHub, LinkedIn, CV).
- Marcado propio y compacto: lee `src/content/` como los capítulos, pero no reutiliza sus componentes (ADR-022).

### Visor de galería (`Lightbox`)
- `<dialog>` con la imagen centrada, contador mono «3 / 9», flechas y cerrar. Teclado ← → Esc.

### Aviso (`Notice`)
- Barra flotante abajo y centrada, tan ancha como su texto (sin pasar del margen lateral ni de `--read-w`), mono
  12 px, velo (`--color-veil-chrome`) con desenfoque y borde; entra con un fundido (`--dur-fade-slow`).
- Vive dentro de una región `role="status"` que existe siempre: lo que aparece se anuncia sin mover el foco.
- Uso: sugerencia de idioma (con su `lang`) y, desde F3, sin WebGL. Descartable.

### Nota de proyecto (`ProjectNote`)
- Bloque con borde izquierdo de 2 px: turquesa (`info`) o ámbar (`warning`), icono y texto.

## Accesibilidad común

- Área táctil mínima 44 × 44 px en todo lo pulsable (aunque el dibujo sea menor).
- Ningún estado se comunica solo con color: el activo del raíl también cambia de tamaño y `aria-current`.
