# Navegación

## Rutas y URLs

- **Inglés sin prefijo** (`/`), **español con `/es`**. Cada página declara su alternativa con `hreflang`.
- Los capítulos del viaje son anclas con el mismo id en los dos idiomas: `#about`, `#skills`, `#projects`,
  `#contact` (el inicio no lleva ancla).
- Al pasar de un capítulo a otro la URL **no** se reescribe en cada scroll (ensucia el historial); solo cambia
  cuando el usuario usa el raíl o un enlace, con `replaceState` (sin entrada nueva en el historial; el inicio queda
  sin ancla).
- Un ancla deja su capítulo justo debajo de la barra fija (`scroll-padding-block-start`), con `m` en el índice
  exacto del capítulo.
- Abrir `/#projects` lleva directamente al capítulo de la tortuga, con la escena ya en ese estado (sin explosión).

## Idioma

- **Sin redirección automática** (perjudica al SEO y molesta). Si el navegador está en español (su **primera**
  preferencia) y la página es la inglesa, aparece abajo una sugerencia discreta, en español (`lang="es"`): «Esta
  página también está en español.» con «Ver en español» (la misma página en español, con el capítulo en el que
  estás, como el selector) y «No, gracias». Responder cualquiera de las dos se recuerda en el navegador
  (`localStorage`) y no vuelve a salir; si el navegador no deja guardar, se recuerda en memoria hasta recargar (ir y
  volver de un proyecto no lo saca otra vez). Elegir idioma a mano con el selector EN/ES también cuenta como
  respuesta: quien pasa de `/es` a EN a propósito no recibe el aviso que le ofrece volver al español. No roba el
  foco: se anuncia (región `status`) y va al final del orden del Tab. Sale en el viaje y en la página de proyecto
  (allí ofrece ese mismo proyecto en español).
- El selector EN/ES de la barra superior lleva a la **misma página** en el otro idioma, conservando el capítulo en
  el que estás (el activo según el scroll, aunque la URL no lleve su ancla) o el proyecto abierto.
- `lang` del documento correcto en cada página (`en` / `es`).

## Barra superior (fija)

| Elemento | Comportamiento |
|---|---|
| Logo `TORTOISE_CODE` | Vuelve al inicio (y al hero), con el foco en el nombre |
| Chip «Open to work» | Desde md (900 px) y solo si el perfil dice que busco trabajo; enlaza a `#contact` con el mismo salto que Contact |
| Projects · Contact | Saltan a su capítulo como el raíl, con el foco en su título (ocultos en móvil: el raíl los sustituye) |
| CV | Solo si existe el PDF del idioma activo |
| EN / ES | Cambia de idioma conservando el capítulo activo; el idioma actual no navega |
| Quick mission | Abre el modo misión rápida. Por debajo de 520 px enseña «Quick» / «Rápida» (el nombre accesible sigue siendo el completo) |

El logo, el chip, Projects, Contact, CV y EN / ES son enlaces de verdad (`/#projects`, `/es#contact`): sin JavaScript
también llevan a su sitio. En el viaje, un clic normal hace el salto del raíl; con Ctrl/Cmd/Shift/Alt o con el
botón central, el navegador hace lo suyo (abrir otra pestaña). Un clic normal en el idioma en el que ya estás no
hace nada (ni mueve la página ni deja otra entrada en el historial). Quick mission es un botón (abre un diálogo).
La barra tiene altura fija (`--topbar-h`) y no tapa nunca lo que se enfoca; si falta sitio (texto ampliado en
móvil), solo cede el logo.

En la **página de proyecto** la barra es la misma (sin raíl): el logo, el chip y Contact navegan al viaje (no hay
capítulos que saltar) y caen bajo la barra, sin mover el foco; Projects deja además el foco en la fila del
proyecto que se acaba de ver (ver «Volver desde una página de proyecto»); EN / ES lleva a ese mismo proyecto en
el otro idioma; Quick mission abre el modo allí también (`/projects/x#quick`). Por debajo de md, Projects y
Contact no salen (en el viaje los sustituye el raíl, que la ficha no tiene): en móvil hacen sus veces «Back to the
shell», arriba, y los enlaces del pie (GitHub, LinkedIn y el email).

## Raíl de capítulos (fijo, a la derecha)

- 5 puntos; en escritorio cada uno lleva **el nombre real de la sección** y, debajo, el de la escena
  («Projects · Cosmic turtle»). En móvil, solo puntos con `aria-label`.
- El activo se marca en ámbar y con `aria-current="step"`.
- Clic o Enter: viaja a ese capítulo (scroll suave; instantáneo con movimiento reducido), lleva el foco a su
  título (como la detonación) y deja su ancla en la URL.
- Es un `<nav aria-label="Chapters">` con una lista ordenada de **enlaces** (`/#about`…), como los de la barra:
  sin JavaScript llevan al ancla y con Ctrl/Cmd/Shift/Alt o el botón central abren otra pestaña.
- Por debajo de md (900 px) va pegado al borde derecho: el texto de los capítulos (también el del hero) le deja
  su columna.

## HUD (abajo a la derecha en escritorio, abajo a la izquierda en tableta, oculto en móvil pequeño)

- Reloj cósmico y escala del capítulo. Es **decorativo** (`aria-hidden`): la misma información está en el
  encabezado de cada capítulo.

## Modo misión rápida

- Botón siempre visible en la barra. Abre un `<dialog>` modal a pantalla completa con **todo el contenido** en
  una página limpia: sobre mí, proyectos (con enlace a su página, demo y código), habilidades, formación,
  disponibilidad y contacto (con su botón de copiar el email). El contenido solo se monta al abrir: el HTML
  pre-renderizado no repite el texto del viaje.
- Foco al botón «Close quick mission» al abrir; `Esc` y ese botón cierran y devuelven el foco al botón de apertura
  (también si se entró por `/#quick`). Mientras está abierto, el resto de la página es inerte (modal).
- Bloquea el scroll del fondo mientras está abierto (la página conserva su posición); desde F3, la escena se pausa
  (no renderiza) para ahorrar batería.
- Ancla compartible: `/#quick` abre el sitio con el modo ya abierto (útil para enviar a un recruiter), también si
  el ancla cambia a `#quick` con la página abierta. Al abrirlo con el botón, la URL pasa a `#quick` con
  `replaceState` (se puede copiar; sin entrada nueva en el historial: en Android, el gesto de Atrás ya cierra un
  diálogo modal); al cerrar vuelve el ancla que había (`#projects`, o ninguna), también si se abrió escribiendo
  `#quick` en la dirección (la entrada nueva que crea el navegador). Si con el modo abierto el ancla deja de ser
  `#quick` (Atrás), se cierra.
- Un enlace del modo lleva a su sitio (la página de un proyecto); «Atrás» vuelve a `/#quick` y el modo se abre de
  nuevo. La página de proyecto también monta el modo, pero no lo hereda abierto: si al montarse la dirección no
  pide `#quick`, lo cierra. Sin JavaScript el botón no hace nada: el viaje ya tiene todo el contenido.

## Teclado y foco

- Primer elemento enfocable: **«Skip to content»** (oculto hasta recibir el foco), que salta la barra hasta el
  principio del contenido, el hero, con el foco en el nombre. Sin JavaScript es un ancla al `h1`. En una página de
  proyecto, salta al nombre del proyecto.
- Todos los títulos de capítulo (el `h1` incluido) llevan `tabindex="-1"`: los saltos les dan el foco sin
  meterlos en el orden de tabulación.
- Llegar a una página de proyecto con un enlace («View project», anterior/siguiente, EN / ES) deja el foco en el
  nombre del proyecto, como un salto: el lector anuncia la página nueva y el Tab sigue desde arriba. Al cargarla
  o al llegar con Atrás/Adelante, el foco no se toca. Cambiar de proyecto rehace la página entera: no pasa nada
  de la anterior (el modo misión rápida abierto, un «Copied», el visor).
- Orden de tabulación: barra superior → contenido del capítulo → raíl → sugerencia de idioma (si sale). Con el modo
  misión rápida abierto, solo su contenido.
- Foco siempre visible (anillo ámbar). Nada interactivo vive solo en el lienzo: todo tiene su equivalente en
  el DOM.
- Atajos opcionales (sin pisar los del navegador): ninguno en la v1.

## Volver desde una página de proyecto

- «Back to the shell» y «Projects» de la barra van al capítulo de la tortuga (`/#projects`); el botón Atrás del
  navegador, a la entrada anterior (el viaje donde estabas, otra ficha o `/#quick`). Al volver al viaje, la placa
  del proyecto que visitaste se ilumina (desde F5).
- Sin escena (desde F2.7): el foco queda en «View project» de la fila de ese proyecto, que se resalta como al
  pasar el puntero. Con Atrás, la posición de scroll del viaje la restaura React Router (`<ScrollRestoration />`)
  y el foco no la mueve; con «Back to the shell» o «Projects» de la barra (`/#projects`), el foco lleva la fila a
  la vista. Si desde la ficha se va a otro sitio del viaje (el logo, «Contact»), el foco no se toca.
- Si a la ficha se llegó desde el modo misión rápida, Atrás vuelve a `/#quick`: el modo se reabre y el foco es
  suyo (en «Close quick mission»), no de la fila.
- Lo sostiene `uiStore.visitedProject`: lo apunta la página de proyecto y el capítulo Proyectos lo recoge una
  sola vez al montarse.
