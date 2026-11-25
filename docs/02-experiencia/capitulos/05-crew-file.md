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

## Transición (C.7 · ADR-039)

Idea de Víctor (sesión 47; prueba aprobada: el artefacto privado «Crew file · entrada», con una copia
guardada fuera del repo). Hasta C.7 el retrato se formaba en la segunda mitad de Contacto y la sección subía «en
crudo»: ahora la escena trae el epílogo.

- **La llegada:** al acabar Contacto, la sección se queda fija bajo la barra (escritorio: la pantalla entera; móvil:
  su primera pantalla, con el título, la entrada y el visor) mientras pasan 160 svh de scroll (`--arrival-h`). Mientras
  dura, el escenario mide justo lo que se ve bajo la barra (la pantalla entera es literal y el pie se ve). Todo se mide
  con lo que lleva la llegada (`a`, de 0 a 1: `m − 4` con la `m` suavizada de la escena, `lib/scroll/arrival`), que
  avanza en línea recta con el scroll: los cortes de abajo son también la fracción recorrida de la llegada.
  - la Tierra se deshace en el retrato (formado en `a` = 0,55); las partículas llegan apagadas;
  - el haz baja por la pantalla (de `a` = 0,05 a 0,70, hasta 1,025 altos de la ventana: `beamReach`) y enciende lo
    que deja atrás: en la escena, el retrato; la página lo pinta con la misma línea (`arrivalBeamLine`, en
    `lib/scroll/arrivalChoreography`, fuera de la huella de las fotos fijas);
  - en la página, revela la pantalla de la transmisión por encima del haz (franja, aviso, título, cuadrícula, líneas
    de barrido) y deja negro lo de debajo, con la línea del haz cruzando la ventana (fina y brillante, a todo el
    ancho); las cuatro esquinas del visor aparecen en las de lo que se ve del escenario (0,08 → 0,20) y se cierran
    sobre el marco del visor (0,15 → 0,75, con curva suave); al encajar (0,78) le pasan las suyas al marco con un
    destello que se apaga en 0,6 s (`--dur-visor-lock`: acaba igual que con movimiento reducido), las líneas guía salen
    del visor a los recuadros de la ficha (0,78 → 0,92), la ficha se escribe con el teletipo y se enciende «Identity
    verified». La sección con llegada no lleva el barrido de entrada de las transmisiones: el haz hace de barrido.
  - Lo pinta un bucle propio (`useArrivalChoreography`, en `Transmission`) que suaviza `m` como la escena y escribe
    variables CSS en la sección (C.7 · ADR-039). Los cortes, en `ARRIVAL_CHOREOGRAPHY` (`lib/scroll/arrivalChoreography`).
  - Acabada la llegada, el haz pasa en bucle por el retrato y la sección sigue con el scroll.
- Todo va atado al scroll: subiendo, se deshace.
- **El ancla y los saltos** (`/#crew-file`, el raíl, el cambio de idioma) aterrizan al final de la llegada (el
  marcador `data-landing`, con el id del ancla): con el epílogo ya traído. El raíl marca el Crew file desde que empieza
  a llegar, así que cambiar de idioma a mitad de la llegada lleva también al Crew file, ya traído. El marcador va el
  primero en el DOM (su sitio lo pone el CSS): quien entra por el ancla sigue con Tab por la sección.
- **Movimiento reducido:** sin llegada (el hueco mide 0), el retrato encendido y sin haz ni fallos de señal; aparece
  solo al pasar al epílogo, con la escena poniéndose al día por su cuenta (estados-y-accesibilidad.md).
- **Sin WebGL:** también hay llegada; la foto fija pasa de la Tierra al retrato con la forma (cuando cruza la mitad,
  en `a` ≈ 0,275, como la escena) y el haz y el visor de la página revelan la sección igual.
- **El foco con Tab:** mientras dura la llegada, lo que se enfoca con Tab bajo la ventana no subiría con el scroll
  (el escenario está pegado): la página va al final de la llegada y lo justo más allá para enseñarlo entero, con su
  anillo y el aire de abajo (`useArrivalFocus` de `Transmission`, `lib/scroll/stageFocus`). No actúa con el foco de un
  salto (el título, `tabindex="-1"`), con un clic ni sin llegada, y deja de mirar si el usuario mueve la página.
- **El foco revela:** si el foco entra con Tab en la sección antes de que acabe la llegada (también antes de que
  empiece), se revela entera al momento: sin recorte, con el visor encajado y la ficha escribiéndose. Sigue así hasta
  que se vuelve por encima de la llegada; al bajar otra vez, la coreografía vuelve.
- **Sin JavaScript** (o mientras hidrata) la sección se ve entera y quieta; al imprimir, también.
- **Capturas:** las de `npm run visual` van con movimiento reducido, sin llegada; dos más, con movimiento y la llegada
  parada en `a` = 0,4 y 1 (`arrival-40-crew-file.png`, `arrival-100-crew-file.png`), sin WebGL: la página hace lo
  mismo sobre la foto fija del retrato, y así no hay un reloj de la escena que parar.
- **Alto contraste:** la sección y su escenario, sobre el fondo liso del sistema (`Canvas`), sin cuadrícula ni barrido;
  sin la línea del haz (un fondo con brillo) y las esquinas, sin brillo.
- Si el retrato llega con la escena ya aquí (un salto, entrar por `/#crew-file`), se forma en 0,6 s desde la Tierra
  con el haz bajando por la pantalla, en vez de aparecer de golpe.

## Escena (`m = 5`)

- La llegada del epílogo cambia la Tierra al retrato (forma 5, `docs/04-escena/formas.md` → «Retrato»); Contacto se
  queda en la Tierra.
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
- La llegada: la sección se queda fija bajo la barra mientras dura y el raíl marca el Crew file desde que empieza; el
  ancla, el raíl y el cambio de idioma aterrizan al final de la llegada (el raíl, con scroll suave); entrando por el
  ancla, el primer Tab va a «Download CV»; con Tab, lo enfocado se ve entero con su anillo (también a 390 px y con
  Shift+Tab); sin llegada con movimiento reducido; sin WebGL, la foto pasa al retrato con la forma; en alto contraste,
  sobre `Canvas` (`tests/e2e/crew-file.spec.ts`).
