# Capítulo 5 · Crew file (epílogo) · canal verde

> Fase C, paso 6 (ADR-034). Bajo la Tierra, el último. Diseño aprobado el 2026-11-19
> (`docs/03-diseno/design-system.md` → «Transmisiones»). En dos PR: **C.6a**, el epílogo sin retrato (el capítulo, la
> ficha, el CV, el raíl de ocho paradas; textos en `textos-sitio.md` → «Epílogo»: los escribió Claude y Víctor los revisa cuando quiera), y
> **C.6b**, el retrato (la sexta forma, el visor y la ficha a sus lados). Los dos, hechos.

## Propósito

Cerrar el viaje con quien lo ha construido y dejar a mano lo que un recruiter necesita: la ficha y el CV.
Metáfora: las partículas que formaron el universo se recomponen en la cara de Víctor; «all channels closed».

## Contenido

- Canal: «Channel 03 · green» en la franja, que cierra con «All channels closed» (no hay «Skip»: es el último), y
  «Crew file · identity verified» encima del título.
- Título «CREW FILE».
- **El retrato en partículas** (sexta forma, ADR-034), con esquinas de visor y líneas guía hacia los datos.
- Ficha: Role (Frontend Developer · React + TypeScript) · Base (Killarney, Ireland: la ciudad y el país del perfil) · Right to work (EU
  citizen · full right to work in Ireland) · Availability (immediate · remote, hybrid or on-site · relocation; como
  en Contacto, solo si está abierto a trabajar) ·
  Languages (solo los idiomas, sin nivel: «Spanish · English») · Training (Advanced Course in Web Programming
  (Full-Stack), Master.D, 975 h, Distinction; React + TypeScript, Hola Mundo, 13 h). La formación se muda aquí desde
  Contacto, y con ella la firma del sitio (un `<footer>`: «Víctor Pérez · Frontend Developer · año» y «This site is
  open source»). Lo último de la página es el pie de la transmisión: la onda y «End of journey».
- **Download CV** (el PDF de `public/`, el inglés en los dos idiomas) y el email con «Copy»: el texto en el verde del
  canal (el email, en su brillante; «Copy», blanco) y su estado en ámbar, el de todo control (`design-system.md` →
  «Transmisiones»).
- Pie: «End of journey · 13.8 billion years + now».

## Escena (`m = 5`)

- Contacto cambia en su segunda mitad (del 52 %, como Skills): la Tierra pasa al retrato (forma 5,
  `docs/04-escena/formas.md` → «Retrato»).
- **Transición:** las partículas viajan de la Tierra al retrato y llegan apagadas; se encienden en el verde del canal
  al paso del haz de barrido, que baja de arriba abajo atado al progreso del morph (`m` de 4 a 5). Acabado el morph,
  el haz pasa en bucle. Con movimiento reducido, el retrato encendido y sin haz ni fallos de señal. Si el retrato llega
  con la escena ya aquí (un salto por el raíl o la misión rápida, entrar por `/#crew-file`), se forma en 0,6 s desde
  la Tierra con el haz bajando, en vez de aparecer de golpe.
- El retrato: una foto de Víctor convertida en profundidad, cargada como dato aparte (`src/assets/portrait/`: la foto
  y otra imagen con la profundidad, la distancia al borde y los contornos; ~150 KB) al llegar a la tortuga, un tramo
  antes de la Tierra (`m` ≥ 3), una vez por visita. Lo pide y lo lee el worker de las formas; solo el código que lo pide cuenta en el chunk de la escena
  (ADR-032). Si no llega, la forma 5 se queda en la Tierra.
- Aspecto elegido: holograma de líneas de escáner (una fila de cada tres), luz en pocos niveles, rasgos y borde de
  la silueta encendidos, haz de barrido y fallos de señal ocasionales; en el verde del canal.
- Giro limitado (~±25°) con el ratón: de una sola foto sale un relieve, no una cabeza completa.

## Interacciones

- El retrato gira con el ratón (hasta ~±25°, y vuelve de frente al salir) y la gravedad del cursor aparta partículas.
  En táctil no gira: la inclinación del móvil pide permiso en iOS y se mira en F6 con un móvil real.
- Download CV y Copy, como en Contacto.

## Layout

- La transmisión va **abierta** (`Transmission` con `open`): sin el velo del canal sobre la escena, para que el
  retrato se vea; cada bloque de texto lleva el velo detrás, así que el contraste no depende de lo que pase por debajo.
- **El visor:** cuatro esquinas y, al pie, «Identity verified» (se enciende cuando el teletipo acaba la ficha; repite el
  aviso de arriba, así que es decoración, `aria-hidden`).
- **Escritorio ancho (desde lg, 1280 px):** el aviso, el título y la entrada arriba a la izquierda; el visor en el
  centro, centrado en la ventana como el retrato y pegado al centro de la pantalla mientras la ficha pasa; la ficha a
  los lados (puesto, base y permiso a la izquierda; disponibilidad, idiomas y formación a la derecha), cada dato en su
  recuadro con una línea guía que llega hasta el marco; abajo, el email a la izquierda y «Download CV» a la derecha.
  La columna del centro cae bajo el visor y la de la derecha es la más estrecha (el raíl ocupa su lado): el email no
  cabría en ella sin partirse, y el título va con la letra de un h2, que baja lo justo para que «Tripulación» quepa
  entera en la columna de la izquierda (`--text-crew-title`).
- **Móvil y tableta:** una columna en el orden del DOM: título, entrada, el visor (un hueco del tamaño del retrato en
  pantalla: su alto, `--visor-h`, y su proporción, `--visor-ratio`, centrado con el retrato aunque la columna deje
  sitio al raíl), **Download CV justo debajo** (lo primero que se busca), la ficha y el email.

## Accesibilidad y movimiento reducido

- El lienzo es `aria-hidden`, y el visor también: el retrato es decoración (la ficha dice quién es). Sin WebGL: la
  foto fija del retrato (ADR-029). Con movimiento reducido: quieto, sin barrido ni fallos de señal.
- La ficha es una lista de definiciones real; las líneas guía son decoración.

## Pendiente

- F6: la inclinación del móvil (con su permiso en iOS) y mirar el retrato en un móvil real.
- Decidido en C.6: solo los idiomas, sin el nivel de inglés; la foto de la prueba de la sesión 34 y sus datos, en el
  repo público.

## Aceptación

- Download CV funciona en EN y ES; los datos coinciden con el CV.
- Sin WebGL, con movimiento reducido y con lector de pantalla se lee entero.
