# Navegación

## Rutas y URLs

- **Inglés sin prefijo** (`/`), **español con `/es`**. Cada página declara su alternativa con `hreflang`.
- Los capítulos del viaje son anclas con el mismo id en los dos idiomas: `#about`, `#skills`, `#projects`,
  `#contact` (el inicio no lleva ancla).
- Al pasar de un capítulo a otro la URL **no** se reescribe en cada scroll (ensucia el historial); solo cambia
  cuando el usuario usa el raíl o un enlace, con `replaceState`.
- Abrir `/#projects` lleva directamente al capítulo de la tortuga, con la escena ya en ese estado (sin explosión).

## Idioma

- **Sin redirección automática** (perjudica al SEO y molesta). Si el navegador está en español y la página es la
  inglesa, aparece una sugerencia discreta y descartable: «¿Ver en español?». Se recuerda la elección.
- El selector EN/ES de la barra superior lleva a la **misma página** en el otro idioma, conservando el ancla del
  capítulo o el proyecto abierto.
- `lang` del documento correcto en cada página (`en` / `es`).

## Barra superior (fija)

| Elemento | Comportamiento |
|---|---|
| Logo `TORTOISE_CODE` | Vuelve al inicio (y al hero) |
| Chip «Open to work» | Siempre visible en escritorio; enlaza a `#contact` |
| Projects · Contact | Saltan a su capítulo (ocultos en móvil: el raíl los sustituye) |
| CV | Solo si existe el PDF del idioma activo |
| EN / ES | Cambia de idioma conservando la posición |
| Quick mission | Abre el modo misión rápida |

## Raíl de capítulos (fijo, a la derecha)

- 5 puntos; en escritorio cada uno lleva **el nombre real de la sección** y, debajo, el de la escena
  («Projects · Cosmic turtle»). En móvil, solo puntos con `aria-label`.
- El activo se marca en ámbar y con `aria-current="step"`.
- Clic o Enter: viaja a ese capítulo (scroll suave; instantáneo con movimiento reducido).
- Es un `<nav aria-label="Chapters">` con una lista ordenada de botones.

## HUD (abajo a la derecha en escritorio, abajo a la izquierda en tableta, oculto en móvil pequeño)

- Reloj cósmico y escala del capítulo. Es **decorativo** (`aria-hidden`): la misma información está en el
  encabezado de cada capítulo.

## Modo misión rápida

- Botón siempre visible en la barra. Abre un `<dialog>` modal a pantalla completa con **todo el contenido** en
  una página limpia: sobre mí, proyectos (con enlace a su página, demo y código), habilidades, formación,
  disponibilidad y contacto.
- Foco al botón «Back to the journey» al abrir; `Esc` y ese botón cierran y devuelven el foco al botón de apertura.
- Bloquea el scroll del fondo mientras está abierto; la escena se pausa (no renderiza) para ahorrar batería.
- Ancla compartible: `/#quick` abre el sitio con el modo ya abierto (útil para enviar a un recruiter).

## Teclado y foco

- Primer elemento enfocable: **«Skip to content»**, que salta al primer capítulo con contenido.
- Orden de tabulación: barra superior → contenido del capítulo → raíl.
- Foco siempre visible (anillo ámbar). Nada interactivo vive solo en el lienzo: todo tiene su equivalente en
  el DOM.
- Atajos opcionales (sin pisar los del navegador): ninguno en la v1.

## Volver desde una página de proyecto

- «Back to the shell» y el botón Atrás del navegador vuelven al capítulo de la tortuga (`/#projects`) con la
  placa del proyecto que visitaste iluminada.
- La posición de scroll del viaje se restaura al volver.
