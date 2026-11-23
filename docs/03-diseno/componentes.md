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

### Título de capítulo (`h2`) · Párrafo · Lista de etiquetas (el stack de las fichas)
- Títulos según escala. Párrafos `--color-ink-soft`.
- Etiqueta: mono 12 px, borde 1 px `--color-faint`, relleno `--space-2`/`--space-3` (8/12 px, en la rejilla de 4),
  sin radio.

## Acciones

### Botón de contorno (`ButtonOutline`)
- Mono `--text-label` en mayúsculas, borde 1 px `--color-faint`, fondo velo con desenfoque; al pasar, borde y
  texto ámbar. Siempre `type="button"` y con 44 × 44 px como mínimo.
- Uso: «Quick mission», «Close quick mission», «Copy», «No, thanks», «Got it» (aviso sin WebGL) y, en el visor
  de la galería, «Close» y las flechas (solo icono de 20 px, con el nombre en `aria-label`).
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
- Estados: reposo · cargando · detonado (`aria-disabled`, sin perder el foco, hasta volver al inicio; el anillo se
  vacía solo, como al soltar).
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
  (textos-sitio.md → «Botón copiar»). Lo usan Contacto, el Crew file y el modo misión rápida (el email; cada uno
  selecciona el suyo, aunque haya dos en la página) y el «Try it» de la ficha (usuario y contraseña de las cuentas de
  demo).

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
  las acciones salgan de la pantalla (WCAG 1.4.4). Lo prueba `chrome.spec.ts` a 960 px. «CV» (desde C.1, cuando
  existe el PDF) cede si la barra mide menos de 10.5em: con el texto al 200 %, por debajo de ~340 px; sigue en
  Contacto y en la misión rápida. Lo prueba `project-page.spec.ts` a 320 px con el texto al 200 %.
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
- Columna de enlaces alineados a la derecha, uno por capítulo y uno por interludio en su sitio (fase C: el Mission
  log, entre About y Skills, y Mission control, entre Projects y Contact): texto (sección en Geologica 500 a 13 px + escena en mono 10 px, `--text-nano`) y punto de
  7 px; el de un interludio, un rombo del mismo tamaño. Los enlaces miden lo que el más ancho: los puntos forman una
  columna. Un interludio es el activo mientras se lee (su pantalla y la primera mitad de su cola).
- Centrado en vertical; si no cabe entero bajo la barra (un móvil apaisado), baja lo justo para que su primera parada
  empiece debajo (`--rail-half-h`; la escena reserva lo mismo para sus etiquetas, `keepOutZones`). Desde C.6 son ocho
  paradas: en una ventana baja (390 o 360 px de alto) no caben ocho de 44 px bajo la barra, así que encogen lo justo
  (`--rail-stop`), nunca por debajo de 24 px (`--rail-stop-min`, el mínimo de WCAG 2.5.8).
- Activo: punto ámbar relleno, escala 1,4 y halo; texto opaco. Inactivos: texto al 70 % (`--opacity-muted`, que
  cumple AA: 8,7:1 la sección y 4,7:1 la escena). Al pasar el puntero o con el foco del teclado, texto opaco.
- En alto contraste (`forced-colors`) el punto activo se rellena con `Highlight`: no solo es más grande.
- Nombre accesible = `aria-label` con el texto completo («About · Nebula»), también en escritorio.
- Por debajo de md (900 px), y en una ventana ancha pero baja (`height < 30em`: un móvil grande apaisado, o la letra
  grande), solo puntos, cada enlace de 44 px de ancho y `--rail-stop` de alto, a 8 px del borde (el anillo de foco
  cabe). Las paradas que encogen no entran en las zonas seguras de arriba ni de abajo.
- Solo se repinta cuando cambia el capítulo activo, no con cada píxel de scroll.

### Transmisión (`Transmission`, fase C)
- Sección a todo el ancho, hija directa de `<main>` (recoge el puntero; las estrellas de debajo, no), de al menos una
  ventana de alto (`--interlude-min-h`), con el velo de su canal (`--color-channel-*-veil`: la forma de antes se ve
  atenuada), la cuadrícula doble de plano y líneas de barrido debajo del texto. Deja libre a la derecha lo que ocupa
  el raíl (`--rail-room`). Una palabra larga parte (`overflow-wrap: anywhere`) en vez de cortarse con la letra al
  200 %.
- Dos variantes (props exclusivas: el tipo no deja mezclarlas): un **interludio** (`id`, `clock`) o el **epílogo**,
  un capítulo que se lee como transmisión (`chapter`, que solo puede ser el 5; `stripEnd`, `footer`): su ancla sale de
  `CHAPTER_ANCHORS`, lleva `data-chapter` y no tiene cola.
- Franja del canal arriba, con aire arriba y abajo (`--space-2`: el anillo de foco no se corta): indicador de señal
  y nombre del canal, y «Skip transmission ↓», un enlace de verdad al capítulo siguiente (`INTERLUDE[id].next`; salta
  con el foco en su título, como el raíl; ≥ 44 px). El enlace es `ChapterJumpLink`, el mismo de «Touchdown» en
  Mission control. En el epílogo, en su sitio, `stripEnd` («All channels closed»), sin enlace.
- Rótulo de cada transmisión (`incoming`: «Incoming transmission · source located» en el Mission log, «Mission
  control · how I work» en Mission control) con un triángulo delante (SVG propio), título `h2` en mono con brillo (enfocable por código, como los capítulos), el
  contenido de cada transmisión y un pie con la onda de señal y el reloj parado (en el epílogo, `footer`: «End of
  journey · 13.8 billion years + now», lo último de la página). Con `titleDisplay`, en el sitio del
  título se ve otra cosa (el «T-0» de Mission control, `aria-hidden`) y el título queda escondido para el lector en el
  mismo `h2`. Con `className`, una transmisión puede dar otras columnas a su cuerpo (`--_body-columns`) y fijar en
  cuál van el rótulo y el título (`--_head-column`), y bajar la letra del título si su columna es estrecha
  (`--_title-size`; por defecto, la de un h1: el Crew file desde lg). El rótulo de cada bloque de dentro es `.heading` de
  `Transmission.module.css` (cada una lo usa con `composes`).
- **Abierta** (`open`, el epílogo): sin el velo del canal sobre la escena (solo la cuadrícula), para que se vea el
  retrato; la franja, el rótulo, el título y el pie llevan el velo detrás, y quien la usa se lo pone a sus bloques de
  texto: el contraste no depende de lo que pase por debajo. Recorta con `overflow: clip` (no `hidden`): lo pegajoso
  de dentro sigue a la ventana (el visor del Crew file).
- En alto contraste, las barras de señal y el cursor se pintan con `CanvasText` (son un fondo: el sistema los
  dejaría del color del fondo). Escrita una línea del teletipo, su recorte se abre `--space-5` más allá de su caja
  para no cortar el brillo de las cifras y de «Launch».
- Cursor de bloque del teletipo (`BlinkCursor`, el mismo en los dos interludios): parpadea unas pocas veces al
  escribirse su línea y se queda quieto. En el epílogo no hay cursor: el cierre de su teletipo es «Identity
  verified», en el visor.
- Entrada: con JavaScript y sin movimiento reducido, la sección se arma al montar (`data-armed`: las líneas del
  teletipo, `[data-line]`, esperan tapadas) y se enciende una vez cuando su borde de arriba pasa el 80 % de la
  ventana (`data-on`; `TRANSMISSION_ENTRY`, un margen y no una proporción: una sección muy alta también llega):
  barrido de luz y líneas una tras otra (`--dur-teletype-*`). Sin JavaScript o con movimiento reducido no se arma:
  todo quieto y visible. El texto está entero en el DOM siempre, y al imprimir no sale tapado. Una línea con algo
  enfocado se destapa al momento (`:focus-within`): con Tab se puede llegar a un control que el teletipo aún no ha
  escrito (el CV y el email del Crew file), y el recorte taparía su anillo de foco.
- A un interludio lo sigue su cola (`--interlude-tail`): un tramo vacío, `aria-hidden` y sin puntero, en el que la escena cambia a la
  forma del capítulo siguiente.
- Alto contraste: fuera la cuadrícula, el barrido y el brillo, y el velo se cambia por el fondo liso del sistema
  (`Canvas`): el texto, en los colores del sistema y sin la escena detrás.

### HUD (`CosmicHud`)
- Dos líneas en mono: reloj (13 px, valores en ámbar) y escala (11 px, `--color-dim`). `aria-hidden`, sin
  puntero. Mientras se lee una transmisión (un interludio, con el raíl en su rombo, o el epílogo) se esconde con un
  fundido: el pie de la transmisión ya dice el reloj, y en escritorio se montaría sobre el registro. El valor en ámbar es el número que se inserta (`200`, `⁻⁴³`); «t = 0 s» y «t = ∞» van sin ámbar.
- Abajo a la derecha en escritorio, abajo a la izquierda por debajo de 900 px y oculto por debajo de 520 px y en una
  ventana ancha pero baja (`height < 30em`: el raíl llega hasta abajo y lo pisaría).
- Lee `m` por suscripción y escribe en el DOM solo cuando cambia su texto, sin re-renderizar.

## Escena ↔ interfaz

### Etiqueta de estrella (`scene/ConstellationLabels`)
- Mono 11 px (10 px por debajo de 900 px; `--text-star-label` y `--text-star-label-narrow`, en px a propósito),
  sin mayúsculas ni espacio entre letras, `--color-dim`, con un trazo de 6 px a la izquierda que apunta a la
  estrella. *Hot*: ámbar. Caja: 3 px arriba y abajo, 14 a la izquierda (trazo de 6 y hueco de 8) y 6 a la derecha,
  línea de 16 px, a 4 px de la estrella (`STAR_LABEL_BOX`, con su test de pareja).
- Halo oscuro alrededor de las letras (`--halo-star-label`: dos sombras de `--color-void`), para leerse también
  sobre el núcleo de la galaxia. Sin selección; con alto contraste, la capa se oculta (la lista es la del panel).
- Posicionada por proyección 3D → 2D en cada frame; opacidad según el peso del capítulo (0,8 en reposo, 1 en su
  grupo activo). Si no cabe (la interfaz, el borde u otra etiqueta), se oculta.
- Con el capítulo a más de 0,6 de peso (`CONSTELLATION_LOOK.interactiveFrom`), las visibles reciben el puntero
  (`data-live`): el ratón encima enciende su grupo (salir lo suelta) y un toque también. El resto de la capa, sin
  puntero.
- Excepción al área táctil de 44 × 44 px: la caja mide 22 px de alto y no se agranda. Es un atajo decorativo: la
  alternativa pulsable, con el mismo efecto y su área completa, es el grupo del panel; y un área mayor chocaría con
  `STAR_LABEL_BOX` y con el no-solapamiento (`labelFit`).

### Pin de placa (`PlatePins`)
- Tallo vertical de 46 px (`--gradient-pin-stem`, al 70 %) + etiqueta con borde (`--color-faint`) y velo
  (`--color-veil-soft`), en mono de 11 px (10 por debajo de 900 px) en mayúsculas con `--tracking-micro`. *Hot* (su
  placa encendida, también por el ciclo): borde y texto ámbar. La coloca la escena en cada frame (`PLATE_PIN`); si
  choca con otro pin, sube un piso: el tallo crece 30 px (`--_pin-floor`).
- Con el capítulo a más de 0,6 de presencia reciben el puntero (`data-live`), solo en la etiqueta (el tallo, una
  línea de 1 px, no: cruzarlo encendería y apagaría la placa a destellos): el ratón encima señala su proyecto (marca
  su fila e ilumina su placa), un clic abre su ficha; en táctil, el primer toque señala y el segundo abre. Al abrir,
  el proyecto sigue señalado mientras llega la ficha, como con «View project». Un gesto que no acaba en su pin
  (deslizar, soltar en otro) no cuenta: el clic siguiente solo señala. Encendido al ritmo de la fila (`--dur-base`).
- No es un enlace: Ctrl/Cmd+clic o el botón central no abren otra pestaña (se acepta: es un atajo decorativo, sin
  foco, y la fila tiene el enlace completo).
- No salen hasta que la tortuga está pintada (entrando por `/#projects`, mientras llegan las formas), ni mientras se
  lee Mission control.
- En el móvil, al bajar por Projects el panel sube sobre la tortuga: los pins que quedan bajo su franja de arriba
  (transparente) se ven a medias pero no se pueden tocar (el toque lo recoge el panel), como las etiquetas de las
  estrellas en Skills. Se acepta: en ese momento se leen las filas. En la posición de referencia (al entrar por el
  ancla) no pisan el panel (lo comprueba el e2e).
- Excepción al área táctil de 44 × 44 px, como la etiqueta de estrella: es un atajo decorativo; la alternativa
  pulsable, con el mismo efecto y su área completa, es la fila del proyecto. Con alto contraste, la capa se oculta.

### Grupo de habilidades (`SkillGroup`)
- Bloque con borde izquierdo de 1 px; título mono en `--color-dim` y skills en texto normal. *Hot*: borde y
  título ámbar. El ámbar dice siempre «esta constelación está encendida»: con la escena, solo el grupo encendido
  (`data-hot`); el foco del teclado se ve con su anillo, como en todo el sitio. Sin escena, con el ratón encima
  (solo con `hover: hover`: en táctil el `:hover` se queda pegado tras el toque). Con alto contraste, el encendido
  se pinta con `Highlight` (borde y título): el sistema iguala los demás colores.
- **Con la escena encendida** (F4.3c) enciende su constelación: es enfocable (`tabindex="0"`, nombrado por su
  título con `aria-labelledby`) y lo encienden el ratón (entrar enciende, salir suelta), el foco del teclado
  (`:focus-visible`: no el foco del puntero; el que devuelve el navegador al volver a la pestaña, solo si era del
  teclado, porque el navegador recuerda la modalidad; irse a otra ventana tampoco suelta) y un toque; soltar
  apaga solo si sigue siendo el encendido (manda el último gesto). Un toque limpio fuera (un `click`) apaga;
  deslizar o salir del capítulo, no. Una etiqueta de la escena con el ratón encima también lo marca. Al ir a una
  ficha o al apagarse la escena, se apaga; si la escena se apaga con el foco en un grupo, el foco pasa al título del
  capítulo (no cae a `body`). Cada grupo elige solo si él está encendido: un gesto no repinta el capítulo entero.
- **Sin escena** (sin nivel aún o sin WebGL) no enciende nada: no entra en el orden de tabulación y solo se resalta
  al pasar el ratón. Sin WebGL (`no-gl`), la frase guía se queda en su primera frase: la instrucción de encender no
  se ve.
- Como todo capítulo, la sección deja pasar el ratón a las etiquetas de la escena (debajo de `main`): `main` y las
  secciones van con `pointer-events: none` y solo lo recogen sus hijos directos, aquí el panel
  (`docs/05-tecnico/arquitectura.md` → «Puntero del viaje»). El lector de pantalla dice al tabular solo el título
  del grupo; las skills se leen al recorrer la página (comprobarlo con NVDA en F6).

### Fila de proyecto (`ProjectRow`)
- Borde izquierdo de 1 px; nombre en display (`--text-h3`), año alineado a la derecha en mono, metadatos en mono
  (con «Featured» en turquesa), resumen y acciones. *Hot*: borde ámbar y degradado ámbar muy tenue de fondo, que entra con un
  fundido de opacidad (`--dur-fade-base`) en su propia capa. Es *hot* con el ratón encima (solo con `hover: hover`:
  en táctil el `:hover` se queda pegado tras el toque) o el foco en uno de sus enlaces y, con la escena, cuando su
  proyecto es el señalado (`data-hot`, también desde su pin). El ámbar dice «aquí está el ratón o el foco, o este es
  el proyecto señalado»: solo el señalado enciende la placa, así que con el foco en una fila y el ratón en otra
  pueden verse dos filas ámbar y una sola placa (aceptado). Con alto contraste, la señalada se pinta con
  `Highlight`. Su zona de puntero llega a la mitad del hueco entre filas (lo lee de la lista, `--_rows-gap`) y cubre
  su borde: al pasar de una a otra, o al bajar por la línea del borde, no asoma la placa del ciclo.
- **Con la escena encendida** (F4.4a) ilumina la placa de su proyecto (`uiStore.activeProject`): el ratón (entrar
  señala, salir suelta), el foco del teclado en uno de sus enlaces (`:focus-visible`; irse a otra ventana no suelta)
  y un toque (`pointGestures`, los mismos gestos que un grupo de Skills); soltar apaga solo si sigue siendo el
  señalado. Un toque limpio fuera (un `click`) apaga; deslizar, no. Al volver de una ficha con el teclado, el foco
  que se deja en su fila ya la señala (es `:focus-visible`); con el ratón, no (desde F5, siempre). Al ir a una ficha
  o al apagarse la escena, se apaga. Sin escena no señala nada. El ciclo automático de las placas
  no la marca. Cada fila elige solo si ella está señalada.

## Contacto

### Email destacado
- Display 700, `wdth` 112, seleccionable (`user-select: all`), con corte de línea seguro en móvil. Tan ancho como
  su texto (no toda la fila del panel) y con el alto mínimo del área táctil (`--target-min`).

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
  ámbar: About (la bio), Projects (nombre `h4`, año, metadatos, resumen y enlaces), Experience (puesto y empresa,
  lugar y periodo, y las entradas del registro), How I work (la frase y los cinco pasos de Mission control), Skills, Education (título; centro, periodo, horas y nota; y los idiomas, con su etiqueta),
  Availability (si `openToWork`: abierto a trabajar, incorporación inmediata si `availableNow`, modalidad,
  reubicación, ubicación y permiso de trabajo) y Contact (email con su `CopyButton`,
  GitHub, LinkedIn, CV).
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

- Área táctil mínima 44 × 44 px en todo lo pulsable (aunque el dibujo sea menor). Tres excepciones escritas: la
  etiqueta de estrella (ver «Etiqueta de estrella»), con el panel de Skills como alternativa; el pin de placa (ver
  «Pin de placa»), con la fila del proyecto como alternativa; y las paradas del raíl en
  una ventana baja (un móvil apaisado), que encogen hasta `--rail-stop-min` (24 px, el mínimo de WCAG 2.5.8) para que
  quepan las ocho bajo la barra (ver «Raíl»; ADR-034, nota de C.6a).
- Ningún estado se comunica solo con color: el activo del raíl también cambia de tamaño y `aria-current`.
