# Capítulo 2 · Galaxia (Habilidades)

## Propósito

Mostrar tus habilidades agrupadas y hacerlo jugable. Metáfora: las estrellas de una galaxia forman
constelaciones; tus tecnologías forman grupos con sentido.

## Contenido (`skills.*`, `habilidades.md`)

- Eyebrow: «Skills · galaxy · t ≈ 1 billion years».
- Título: «My galaxy of tools».
- Frase guía (variante ratón o táctil).
- **4 grupos** en el panel (web, librerías, herramientas, IA), cada uno con su título y la lista de skills.
  Este listado es la versión accesible y completa; la escena es la versión jugable.

## Escena en reposo (`m = 2`)

- Galaxia espiral de 3 brazos, núcleo cálido blanco-dorado y brazos azul-violeta, girando despacio. Vista desde
  arriba e inclinada.
- **4 constelaciones** flotando sobre el plano de la galaxia, una por grupo: estrellas brillantes unidas por
  líneas finas, cada estrella con su etiqueta (nombre de la skill) junto a ella.
- En reposo: constelaciones visibles a media intensidad, líneas tenues.

## Interacciones

- **Pasar el cursor (o el foco) por un grupo del panel** → su constelación se enciende: estrellas más grandes,
  líneas a plena intensidad, etiquetas en ámbar. El grupo del panel también se marca.
- **Pasar el cursor por una etiqueta de la escena** → mismo efecto en sentido contrario (se marca el grupo).
- **Táctil:** tocar un grupo lo enciende; tocar otro cambia; tocar fuera apaga.
- Gravedad del cursor activa sobre la galaxia (no afecta a las constelaciones, que deben leerse quietas).

## Layout

- **Escritorio:** panel a la izquierda; galaxia y constelaciones a la derecha. Las etiquetas nunca pueden quedar
  bajo el raíl: las constelaciones se colocan dentro de la zona libre (posiciones en `docs/04-escena/`).
- **Móvil:** escena primero; la galaxia se ve completa y las etiquetas usan un tamaño menor. Si una etiqueta no
  cabe, se oculta (la lista del panel sigue completa).

## Accesibilidad y movimiento reducido

- Las etiquetas de la escena son decorativas (`aria-hidden`): la información está en la lista del panel.
- Los grupos del panel son enfocables para que el teclado también encienda constelaciones.
- Movimiento reducido: la galaxia no gira sola; el encendido es instantáneo, sin fundidos.

## Aceptación

1. Cada skill de `habilidades.md` aparece una vez en el panel y una vez como estrella.
2. Hover, foco y toque encienden la constelación correcta y solo esa.
3. Ninguna etiqueta se solapa con el raíl ni sale de la pantalla en 1280×720, 1440×900 y 390×844.
