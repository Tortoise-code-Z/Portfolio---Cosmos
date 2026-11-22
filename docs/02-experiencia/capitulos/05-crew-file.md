# Capítulo 5 · Crew file (epílogo) · canal verde

> Fase C, paso 6 (ADR-034). Bajo la Tierra, el último. Diseño aprobado el 2026-11-19
> (`docs/03-diseno/design-system.md` → «Transmisiones»). En dos PR: **C.6a**, el epílogo sin retrato (hecho: el
> capítulo, la ficha, el CV, el raíl de ocho paradas; textos en `textos-sitio.md` → «Epílogo», que Víctor corrige en
> su PR), y **C.6b**, el retrato (la sexta forma).

## Propósito

Cerrar el viaje con quien lo ha construido y dejar a mano lo que un recruiter necesita: la ficha y el CV.
Metáfora: las partículas que formaron el universo se recomponen en la cara de Víctor; «all channels closed».

## Contenido

- Canal: «Channel 03 · green» en la franja, que cierra con «All channels closed» (no hay «Skip»: es el último), y
  «Crew file · identity verified» encima del título.
- Título «CREW FILE».
- **El retrato en partículas** (sexta forma, ADR-034), con esquinas de visor y líneas guía hacia los datos.
- Ficha: Role (Frontend Developer · React + TypeScript) · Base (Killarney, Ireland: la ciudad y el país del perfil) · Right to work (EU
  citizen · full right to work in Ireland) · Availability (immediate · remote, hybrid or on-site · relocation) ·
  Languages (solo los idiomas, sin nivel: «Spanish · English») · Training (Advanced Course in Web Programming
  (Full-Stack), Master.D, 975 h, Distinction; React + TypeScript, Hola Mundo, 13 h). La formación se muda aquí desde
  Contacto, y con ella el pie del sitio (firma y «This site is open source»), que cierra la página.
- **Download CV** (el PDF de `public/`, el inglés en los dos idiomas) y el email con «Copy».
- Pie: «End of journey · 13.8 billion years + now».

## Escena (`m = 5`)

- Contacto cambia en su segunda mitad (del 52 %, como Skills): la Tierra pasa al retrato. Hasta C.6b no hay sexta
  forma: con `m` entre 4 y 5 la escena se queda en la Tierra, y sin WebGL se ve la foto de la Tierra.
- **Transición (decidida en C.6, para C.6b):** las partículas viajan de la Tierra al retrato y llegan apagadas; se encienden en
  el verde del canal al paso del haz de barrido, atado al progreso del morph, y al acabar, «Identity verified». Con
  movimiento reducido, el retrato ya formado y sin barrido.
- El retrato: una foto de Víctor convertida en profundidad, cargada como dato aparte (una imagen de color, otra de
  profundidad y contornos; ~150 KB) al acercarse a la Tierra; solo el código que la carga cuenta en el chunk de la
  escena (ADR-032).
- Aspecto elegido: holograma de líneas de escáner (una fila de cada tres), luz en pocos niveles, rasgos y borde de
  la silueta encendidos, haz de barrido y fallos de señal ocasionales; en el verde del canal.
- Giro limitado (~±25°) con el puntero: de una sola foto sale un relieve, no una cabeza completa.

## Interacciones

- El retrato sigue al puntero (inclinación en móvil, si se permite); la gravedad del cursor aparta partículas (C.6b).
- Download CV y Copy, como en Contacto.

## Layout

- **Escritorio:** título arriba a la izquierda; retrato en el centro; datos a los lados con líneas guía; abajo, el
  email y el botón del CV. Hasta C.6b, una columna: entrada, «Download CV», la ficha en rejilla y el email.
- **Móvil:** título, retrato, **Download CV justo debajo** (lo primero que se busca), la ficha y el email.

## Accesibilidad y movimiento reducido

- El lienzo es `aria-hidden`; el retrato tiene su alternativa en texto. Sin WebGL: una foto fija del retrato
  (ADR-029). Con movimiento reducido: quieto, sin barrido ni fallos de señal.
- La ficha es una lista de definiciones real; las líneas guía son decoración.

## Pendiente

- C.6b: el retrato (la foto de la prueba de la sesión 34 y sus datos entran al repo público, con el VB de Víctor),
  sus esquinas de visor y líneas guía, y el layout de escritorio con los datos a los lados.
- Decidido en C.6: solo los idiomas, sin el nivel de inglés.

## Aceptación

- Download CV funciona en EN y ES; los datos coinciden con el CV.
- Sin WebGL, con movimiento reducido y con lector de pantalla se lee entero.
