# Capítulo 3 · Tortuga cósmica (Proyectos)

## Propósito

Mostrar los proyectos y llevar a sus páginas. Es la firma del sitio: la marca **Tortoise_code** convertida en
escena. Metáfora: según el mito, una tortuga carga con el mundo; la tuya carga con tus proyectos.

## Contenido (`projects.*`, `proyectos/*.md`)

- Eyebrow: «Projects · cosmic turtle · t = mythic time».
- Título: «What I carry on my shell». Frase del mito.
- Una **fila por proyecto**, en orden (`order`): nombre grande, año, etiqueta «Featured» si aplica, rol,
  contexto, stack principal (`stack.core`), resumen (2–3 frases, `modelo-de-datos.md`) y acciones: **View project** (página propia), **Live demo** y
  **Code** (si existen).

## Escena en reposo (`m = 3`)

- Una tortuga marina de partículas nada despacio: caparazón turquesa con rejilla hexagonal de bordes ámbar, un
  pequeño **bosque** de árboles verdes sobre el caparazón, cabeza con ojos brillantes, cuatro aletas que se
  mueven al nadar y una **estela** de polvo azul detrás.
- Las **placas de proyecto** son celdas hexagonales del caparazón en tono ámbar más claro. El proyecto
  `featured` ocupa la placa central; los demás, las contiguas.
- Sobre cada placa, un **pin** (línea vertical + etiqueta con el nombre del proyecto) que sigue al movimiento.
- La tortuga se balancea y gira levemente; nunca sale del encuadre.

## Interacciones

- **Hover o foco en una fila** → su placa se ilumina (blanco cálido, pulso suave) y su pin se marca.
- **Hover en un pin** → se ilumina su placa y se marca su fila.
- **Clic en un pin o en «View project»** → transición a la página del proyecto (ver `pagina-proyecto.md`).
- **Sin interacción:** las placas se iluminan por turnos cada ~2,6 s para mostrar que son interactivas; al
  interactuar, el ciclo se detiene.
- **Táctil:** tocar un pin ilumina su placa; un segundo toque (o el botón de la fila) abre el proyecto.

## Layout

- **Escritorio:** filas a la izquierda; tortuga a la derecha, con la cabeza hacia la derecha y la estela
  pasando por detrás del panel. La cabeza no puede quedar bajo el raíl.
- **Móvil:** escena primero con la tortuga entera y los pins; después las filas.

## Accesibilidad y movimiento reducido

- Las filas son una lista (`<ul role="list">`, ver `estados-y-accesibilidad.md`) con enlaces reales; los pins son decorativos (`aria-hidden`) y su función
  existe en las filas.
- Movimiento reducido: la tortuga queda quieta (sin nado ni balanceo), sin ciclo automático de placas; la
  iluminación por hover sigue funcionando sin pulso.

## Aceptación

1. Cada proyecto de `src/content/projects` tiene placa, pin y fila; añadir un cuarto proyecto no requiere tocar la escena.
2. Hover y foco en una fila iluminan exactamente su placa.
3. Los enlaces «View project», «Live demo» y «Code» funcionan sin escena.
4. La tortuga y sus pins no se solapan con el raíl en los tamaños de referencia.
