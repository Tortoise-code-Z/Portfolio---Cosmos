# Capítulo 4 · La Tierra al amanecer (Contacto)

## Propósito

Convertir el interés en un contacto (el viaje lo cierra el epílogo, el Crew file). Metáfora: 13.800 millones de años después, aterrizamos
en casa.

## Contenido (`contact.*`, `perfil.md`)

- Eyebrow: «Contact · Earth · t = 13.8 billion years». Título: «Touchdown». Frase de cierre.
- **Disponibilidad:** Open to work · Available immediately · Remote, hybrid, or on-site · Open to relocation ·
  Killarney, Ireland · EU citizen – full right to work in Ireland (ES: Disponible · Incorporación inmediata · … ·
  Ciudadano de la UE, con pleno derecho a trabajar en Irlanda).
- **Email** grande, seleccionable, con botón «Copy» (estados: Copied / Select and copy it).
- Enlaces: GitHub, LinkedIn y, si existe, «Download CV (PDF)».
- La formación y el pie del sitio (firma y «This site is open source») se mudaron al epílogo en C.6
  (`05-crew-file.md`).

## Escena en reposo (`m = 4`)

- La Tierra de partículas: océanos azules, continentes verde-ocre, nubes blancas y una atmósfera azul que brilla
  en el borde.
- Iluminada de lado por un **Sol** naciente detrás del limbo superior izquierdo: una mitad de día, la otra de
  noche con **luces de ciudades** (no en Bajo), y una franja naranja en el terminador (el amanecer).
- Gira muy despacio sobre su eje; la luz se queda fija y sale del Sol que se ve (F4.5): el lado de día mira arriba a
  la izquierda y el amanecer cruza en diagonal.
- El Sol (F4.5) es un brillo cálido que aparece con el capítulo, late despacio y se apaga antes de que la Tierra se
  convierta en el retrato; en todos los niveles (`docs/04-escena/particulas-y-shaders.md` → «Sol»).

## Interacciones

- Botón «Copy»: copia el email; si el portapapeles falla, selecciona el texto y lo indica.
- Gravedad del cursor activa (suave) sobre la Tierra: a la mitad que en los otros capítulos (F4.5, `EARTH_GRAVITY`).
  No mueve el Sol (no es una partícula).
- Debajo, el epílogo (Crew file): en la segunda mitad de Contacto la Tierra se convierte en el retrato
  (`05-crew-file.md` → «Escena»).

## Layout

- **Escritorio:** panel a la izquierda (algo más ancho, ~600 px); la Tierra a la derecha, el Sol entre ambos,
  por encima, naciendo sobre el limbo superior izquierdo. El halo del Sol no puede dibujar un borde visible contra el
  fondo del panel ni contra el de la barra de arriba: por eso es más pequeño y está más cerca de la Tierra que en el
  prototipo, casi a su altura (medido a 1440×900 y 1280×720). Entre 900 y ~1100 px la Tierra ya pasa por detrás del panel y el halo
  también (aceptado).
- **Móvil:** escena primero; luego el panel con todo el contacto.

## Accesibilidad y movimiento reducido

- El email también es un enlace `mailto:` además del botón de copiar.
- El resultado del botón se anuncia con una región `aria-live="polite"`.
- Movimiento reducido: la Tierra no gira y el Sol no late.

## Aceptación

1. El email se puede copiar con el botón y seleccionar a mano.
2. El enlace al CV solo aparece si existe el PDF del idioma activo.
3. La disponibilidad sale de los datos del perfil (cambiar `openToWork` a `false` la oculta).
