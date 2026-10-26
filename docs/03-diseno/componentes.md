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
- Uso: «Quick mission», «Close quick mission», «Copy», «No, thanks» y, en el visor de la galería, «Close» y las
  flechas (solo icono de 20 px, con el nombre en `aria-label`).
- No encoge en una fila, pero nunca pasa del ancho de su contenedor: una etiqueta que no cabe en una línea
  («Selecciónalo y cópialo» a 390 px con el texto al 200 %) se parte en dos, centrada.
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
- Internos: icono opcional detrás (`arrow-right`) o delante (`leadingIcon`: «← Back to the shell»).
- Correo (`kind="mail"`): `mailto:` en la misma pestaña, sin icono ni aviso de pestaña nueva.

### Botón copiar (`CopyButton`)
- Un `ButtonOutline`. Estados de texto: Copy → Copied (1,8 s) / Select and copy it (también 1,8 s).
- Nombre accesible con lo que copia («Copy email»: el sujeto va oculto a la vista).
- Si el portapapeles no existe (http) o lo rechaza, selecciona el texto que copia (el email, el usuario o la
  contraseña) para copiarlo a mano.
- El resultado se anuncia en una región `role="status"` aparte; el foco no se mueve. Cada intento pinta el mensaje
  en un nodo nuevo: copiar dos veces seguidas se anuncia dos veces. Etiquetas comunes `copy.*`
  (textos-sitio.md → «Botón copiar»). Lo usan Contacto y el modo misión rápida (el email) y el «Try it» de la ficha
  (usuario y contraseña de las cuentas de demo).

## Navegación

### Barra superior (`TopBar`)
- Fija, con velo oscuro (`--color-veil-chrome`) y desenfoque de fondo (`--blur-chrome`): el texto que pasa por
  debajo no le quita contraste. Logo a la izquierda y acciones a la derecha. Margen lateral de página. Altura fija
  `--topbar-h` (64 px) más la zona segura de arriba.
- Logo en mono 13 px (`--tracking-logo`); acciones en mono `--text-label` en mayúsculas. Todo con 44 × 44 px como
  mínimo. Si falta sitio, solo el logo cede (se recorta con «…»); las acciones no encogen.
- Orden: logo · chip de disponibilidad (desde md) · Projects y Contact (desde md) · CV · EN / ES · «Quick mission».
- «Quick mission» es un `ButtonOutline` (`aria-haspopup="dialog"`). Por debajo de sm (520 px) enseña la forma
  corta (`nav.quickShort`: «Quick», «Rápida»), que cabe a 390 px con el texto al 200 %.
- **Texto ampliado:** la barra es un contenedor (`container: topbar`). El chip pide además que la barra mida
  52em y la etiqueta larga, 28em: con el texto al 100 % mandan md y sm (caben también con una barra de scroll
  clásica); con el texto al 200 % los `em` crecen con él y ceden el chip y luego la etiqueta larga antes de que
  las acciones salgan de la pantalla (WCAG 1.4.4). Lo prueba `chrome.spec.ts` a 960 px.
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
  `openToWork`, y solo desde md (900 px) si la barra mide al menos 52em (ver «Barra superior»).
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
- Cabecera: «Quick mission · everything on one page» en mono atenuado y «Close quick mission» (`ButtonOutline`).
  Se queda fija arriba al hacer scroll (`position: sticky`, sobre `--color-void` opaco y con la zona segura libre).
  El nombre del diálogo es el título; el rótulo va en `aria-describedby` (el lector dice los dos al abrir).
  Ocupa también el hueco de la barra de scroll que reserva la página (`100vw`).
- Título `h2` «Víctor Pérez · Frontend Developer» (escala de `h3` por debajo de sm) y secciones con su `h3` en mono
  ámbar: About (bio y fortalezas), Projects (nombre `h4`, año, metadatos, resumen y enlaces), Skills, Education
  (título, centro, periodo y horas; las habilidades de cada curso solo en Contacto), Availability (si
  `openToWork`) y Contact (email con su `CopyButton`, GitHub, LinkedIn, CV).
- Marcado propio y compacto: lee `src/content/` como los capítulos, pero no reutiliza sus componentes (ADR-022).

### Imagen (`Picture`)
- `<picture>` con AVIF y WebP en varios anchos (`srcset`) y el `sizes` de quien la pinta: el navegador elige el
  primer formato que entiende y el ancho justo. El `<img>` lleva `width`/`height` del archivo (sin saltos de
  layout), `decoding="async"`, `loading` (`eager` por defecto, `lazy` en la galería) y `fetchpriority` (`auto`
  por defecto, `high` en la portada). El `<picture>` no genera caja
  (`display: contents`): las clases van al `<img>`. La usan la portada, las miniaturas y el visor.

### Visor de galería (`Lightbox`)
- `<dialog>` modal a pantalla completa sobre `--color-veil-dialog`, con fundido de entrada. Tres filas: contador
  mono «3 / 9» (solo para la vista) y «Close» (`ButtonOutline`) · la imagen, que cabe entera (`object-fit:
  contain`; `Picture` con `sizes` = 100vw) · las flechas (`ButtonOutline` con icono de 20 px y nombre «Previous
  image» / «Next image»).
- Al abrir, el foco va a «Close». ← → cambian de imagen desde cualquier sitio del visor, con vuelta; Esc y «Close»
  cierran y quien lo abrió devuelve el foco (la miniatura de la imagen que se veía). Con una sola imagen, sin
  flechas. La imagen activa se anuncia en una región `status` («3 of 9: texto alternativo»), que es también la
  descripción del diálogo (`aria-describedby`): al abrir, el lector dice qué imagen es. Sus textos son
  `lightbox.*` (no sabe de qué página es).
- Fondo bloqueado mientras está abierto; el contenido solo se monta abierto.

### Galería (`ProjectGallery`)
- Rejilla `auto-fill` de miniaturas (columnas de `--project-col-min`), todas con `--gallery-thumb-ratio` y la
  imagen recortada al centro. Cada miniatura es un botón con borde fino (ámbar al pasar) y cursor de lupa; su
  nombre dice qué abre («Open image 2 of 5» + texto alternativo). Carga diferida (`loading="lazy"`) y `sizes` de su
  columna: 232 px con tres columnas (desde 732 px de ventana), la mitad de la ventana con dos (desde 484 px) y
  todo el ancho con una. Los cortes salen de los tokens (`features/project/imageSizes`, que su test compara con
  `tokens.css`).

### Aviso (`Notice`)
- Barra flotante abajo y centrada, tan ancha como su texto (sin pasar del margen lateral ni de `--read-w`), mono
  12 px, velo (`--color-veil-chrome`) con desenfoque y borde; entra con un fundido (`--dur-fade-slow`).
- Vive dentro de una región `role="status"` que existe siempre: lo que aparece se anuncia sin mover el foco.
- Mientras se ve, su altura va a `--_notice-h` en `<html>`: el hueco de abajo que el navegador deja libre al llevar
  el foco crece con ella y el documento gana ese alto al final. Nada enfocado queda debajo (WCAG 2.4.11).
  Firefox no mira el `scroll-padding` si lo enfocado ya está dentro de la ventana (aunque sea debajo del aviso):
  tras cada cambio de foco, el aviso comprueba si tapa lo enfocado y, si es así, sube la página lo justo.
- Uso: sugerencia de idioma (con su `lang`) y, desde F3, sin WebGL («Got it», una vez por visita). Descartable.
  Nunca dos a la vez: el de sin WebGL espera a que se conteste la sugerencia de idioma.

### Nota de proyecto (`ProjectNote`)
- Bloque con borde izquierdo de 2 px (`--note-border-width`): turquesa (`info`) o ámbar (`warning`), icono del
  mismo color (`info` / `warning`) y texto. Delante, oculto a la vista, «Note:» / «Warning:».

## Página de proyecto

### Cabecera (`ProjectHeader`)
- «← Back to the shell» (`ActionLink`), nombre en display (`h1`, enfocable por código: destino de «Skip»),
  tagline en `--text-lead`, metadatos en mono atenuado separados por « · » (Featured en turquesa) y acciones.

### Portada
- Debajo de la cabecera, la imagen a todo el ancho de la columna (`Picture` con `sizes` de 696 px —la columna menos
  su marco— desde 768 px de ventana, prioridad alta y
  sin `lazy`: es lo mayor de la primera vista; sus medidas reales: sin saltos al cargar) dentro
  de un marco con corchetes de esquina ámbar (`--corner-size`, 1 px) en diagonal: arriba a la izquierda y abajo a
  la derecha (los del panel de capítulo van los dos a la izquierda). Sin portada (`cover: null`), no se pinta.

### Secciones (`ProjectSection`)
- Región con nombre: un `h2` con la escala de `h3` y el contenido debajo. Los títulos de grupo (stack, retos,
  cuenta de demo) van en mono atenuado. Las funcionalidades, en rejilla con el borde izquierdo de las filas; los
  retos, con una marca «+» ámbar decorativa; los pasos de Try it, numerados en mono ámbar («01»).

### Cuentas de demo (`ProjectTryIt`)
- Recuadro con borde fino: título «Demo account» («Demo accounts» si hay más de una) y, por cuenta, su nombre y
  una lista de definiciones (usuario, contraseña) con el valor en mono y un `CopyButton` por dato. Todas las
  cuentas comparten tres columnas (campo, valor, botón) con `subgrid`, para que los botones queden alineados sin
  perder la semántica de la lista; por debajo de sm, o si el recuadro mide menos de 20em (texto grande), el campo
  va encima.

### Pie (`ProjectPager`)
- Anterior y siguiente como tarjetas con borde fino: dirección en mono con su flecha y el nombre en display
  (ámbar al pasar), cada una en media columna como mucho: el anterior a la izquierda y el siguiente a la
  derecha, también cuando solo hay uno (la primera y la última ficha); en móvil, uno debajo de otro. Debajo,
  GitHub, LinkedIn y el email (se parte si no cabe). Llegar a otra ficha con ellos deja el foco en su nombre.

## Página 404 (`NotFoundPage`)
- Centrada en la pantalla, dentro de los corchetes de esquina del panel: título (`h1`), frase en `--text-lead` y
  «Back to the start» (`ActionLink` con flecha). Sin barra ni raíl: solo hay un camino, volver.

## Accesibilidad común

- Área táctil mínima 44 × 44 px en todo lo pulsable (aunque el dibujo sea menor).
- Ningún estado se comunica solo con color: el activo del raíl también cambia de tamaño y `aria-current`.
