# Transiciones con naves (idea aprobada; fuera del cierre de la fase C: después de F4.5 o en el pulido)

> Idea de Víctor (20 nov 2026, sesión 35), estudiada por el Taller sobre la copia del repo con C.2 hecho. **Aprobada
> como idea y sin calendario:** va después de F4.5 o en el pulido (roadmap → «C · 7. Naves»; fuera del cierre de la
fase C). La prueba fuera del
> repo ya está hecha (apartado «Prueba», versiones 1–8): **manda la versión 8**, que cambia los apartados 3 a 5 (se
> lee a pantalla completa, sin marco). Cuando se decida construirla: su ADR (uno nuevo, numerado al escribirlo) y este
doc pasa a spec.

## La idea

Hoy una transmisión aparece por corte: la pantalla del canal sube con el scroll sobre la forma del capítulo, quieta
y atenuada. Con las naves, **la escena trae la transmisión**:

1. **Mission log (ámbar):** la nebulosa se convierte en un **satélite** con una pantalla en el centro. El satélite se
   acerca hasta que su pantalla ocupa el 80–90 % del ancho de la ventana, y la transmisión se lee en esa pantalla.
   Al salir, el satélite se aleja y se deshace en la galaxia.
2. **Mission control (azul):** igual, con otra nave para no repetir: una **nave nodriza**, con la pantalla en su
   hangar o en su puente. De la tortuga a la nave y de la nave a la Tierra.
3. **Crew file (verde, epílogo):** sin nave. La Tierra se deshace directamente en el retrato en partículas.

## Cómo entraría en lo que ya hay

### 1 · Formas: separar «forma» de «capítulo»

Hoy `m` es a la vez el capítulo y la forma. El shader de las partículas evalúa la forma `floor(m)` y la siguiente, y
mezcla las dos (`particles.vert.glsl` → `shape(k)`). Solo sabe ir de una forma a la contigua: 1 nebulosa → 2 galaxia.
Para ir de la nebulosa al satélite y del satélite a la galaxia hay que separar las dos cosas:

- La escena recibe **qué dos formas mezcla y cuánto** (`uFrom`, `uTo`, `uT`) en vez de un índice único. `m` se queda
  para lo demás (HUD, cámara, raíl, fotos fijas), que en los interludios ya se para (C.2).
- Las formas tienen un id fijo: 0 singularidad · 1 nebulosa · 2 galaxia · 3 tortuga · 4 Tierra · 5 satélite · 6 nave
  nodriza · 7 retrato (C.6).
- Cada tramo de `JOURNEY_SEGMENTS` (C.2) dice su forma y a cuál cambia. `mapM` ya mide por tramos, así que solo hay
  que devolver también el par de formas. El cambio es pequeño en JS y algo mayor en el shader.

### 2 · Las naves, dibujadas en el shader (sin datos nuevos)

Hay dos maneras de dar forma a una nave:

- **A · Como las demás formas:** una matriz de posiciones más por nave, generada en el worker. Cuesta ~720 KB de
  memoria de la GPU por nave en Alto (60 000 × 12 B) y un atributo más. Lo descarto: dos naves que se ven unos
  segundos no merecen eso.
- **B · Paramétricas en el shader (recomendada):** cada partícula elige un punto de la superficie de la nave a partir
  de sus números aleatorios (`aR`): el cuerpo, los paneles solares, la antena y el marco de la pantalla del
  satélite; el casco y el hangar de la nave nodriza. No ocupan memoria ni cambian el worker. Solo cuestan bytes de
  GLSL, que se miden en la prueba.

El retrato (C.6) va aparte, como estaba previsto: un dato cargado (color y profundidad), no una fórmula.

### 3 · La pantalla: HTML encajado con la nave

El texto sigue siendo HTML (accesible, traducible, sin WebGL; P1). Lo que cambia es su marco:

- En escritorio, la transmisión deja de ir a todo el ancho y pasa a ocupar el **85 % del ancho**, centrada, con un
  bisel en el color del canal. La escena coloca el satélite para que su pantalla caiga justo detrás de ese ancho: lo
  calcula una vez por tamaño de ventana, con el campo de visión de la cámara, como ya se proyectan las etiquetas de
  la galaxia (`math/projection`). No hace falta seguir el marco en cada frame.
- Mientras se lee, el contenido hace scroll con la página, como hoy (nada de scroll dentro de la pantalla: atraparía
  la rueda y el táctil). La pantalla es más alta que la ventana, y a los lados se ven los paneles del satélite.
- El texto nunca se escala: lo que crece al llegar es el marco (o se funde dentro). Así se lee nítido desde la
  primera línea.

### 4 · El recorrido por tramos

Para el Mission log, sobre los tramos de C.2:

| Tramo | Escena | Interfaz |
|---|---|---|
| About | nebulosa, quieta | panel de About |
| **Llegada** (nuevo, ~80 vh) | nebulosa → satélite, que se acerca hasta su sitio | el marco de la transmisión entra desde abajo |
| Pantalla del interludio | satélite quieto (gira muy poco) | la transmisión se lee; el teletipo empieza al asentarse |
| Cola | satélite → galaxia, alejándose | — |
| Skills | galaxia | panel de Skills |

La llegada se suma a la cola de C.2: la página crece ~80 vh por interludio. Si pesa, se recorta el final de About.

### 5 · Cuándo no hay nave

- **Sin WebGL** (fotos fijas): como hoy, transmisión a todo el ancho sobre la foto del capítulo de antes. No hace
  falta foto de las naves.
- **Movimiento reducido:** la nave aparece ya en su sitio, sin acercarse (el cambio de forma se acorta como los
  demás), y la transmisión se ve entera.
- **Móvil (< 900 px):** el 85 % de 390 px deja la nave en una franja de pocos píxeles. Propuesta: el satélite se ve
  llegar arriba, entero y pequeño, y la transmisión ocupa todo el ancho por debajo, como hoy. Se decide en la prueba.
- **Nivel Bajo:** la nave, con las partículas del nivel. Si se ve pobre, la llegada se queda y el satélite se simplifica.

## Prueba (20 nov 2026)

Artefacto privado «Naves · prueba» (fuera del repo; Three.js r128 y un shader propio): nebulosa → nave → se acerca →
se lee → galaxia, con el scroll, y un botón para cambiar de satélite a nave nodriza. Lo que demuestra:

- **Las naves, paramétricas en el shader:** sin datos nuevos, solo con los números aleatorios de cada partícula.
- **El encaje con la orientación:** la pantalla de la nave toma la proporción del marco HTML (86 % del ancho en
  horizontal; 90 % del ancho y 64 % del alto en vertical). En vertical, los paneles del satélite van arriba y abajo.
- **La llegada:** la nave llega girada (se ve en 3D) y se endereza al asentarse. Hasta entonces la pantalla son solo
  partículas; el marco HTML aparece cuando ya está de frente, encajado con la proyección.
- **Versión 2, más realista (a petición de Víctor):** satélite con cuerpo de aislante dorado y sus costuras, brazos,
  alas de 7 × 3 células solares inclinadas con su marco, antena parabólica con nervios y alimentador, toberas y
  varillas; nave nodriza con casco de planchas y costuras, interior del hangar iluminado, alas en flecha y góndolas,
  puente con ventanas, toberas con estela (se apagan de frente para que no brillen a través del casco), luces de
  posición y módulos en el lomo. Luz direccional con la normal de cada pieza. Más detalle es más GLSL: en el repo
  costará más bytes que la estimación de arriba (medir antes de decidir; se puede simplificar en Bajo).
- **Versión 3, con mucho más detalle (Víctor pide que la nave se distinga mejor):**
  - **Partículas opacas con profundidad mientras solo se ve la nave:** lo de delante tapa lo de detrás y la nave
    tiene volumen (la lección del retrato, S34). En los cambios de forma, aditivas como el resto de la escena.
  - **Más partículas en la prueba:** 120 000 en escritorio y 60 000 en móvil (el portfolio usa 60 000 en Alto).
    Hay que ver cómo va en un móvil real.
  - **Más piezas:**
    - Satélite: radiadores blancos con aletas; aristas del cuerpo; tres paneles articulados por ala, con pistas entre
      células y cara trasera; yugo de celosía; dos reflectores laterales con brazo y bocina; toberas; sensores
      estelares; LEDs y tornillos en el bisel.
    - Nave nodriza: compuertas a rayas y franjas de luz en la boca; hangar con calles iluminadas, costillas, fondo y
      una lanzadera; casco escalonado con aristas; brazos a los lados de la boca; superestructura en tres niveles
      con ventanas y mástil; quilla; góndolas con pilones y aletas; toberas acampanadas con brillo y estela;
      cientos de módulos en el lomo y los costados; cubiertas de ventanas y balizas.
  - **Carga según el dispositivo:** queda para cuando se construya. Las palancas son el número de partículas por
    nivel (como hoy), quitar en Bajo las piezas pequeñas (módulos, sensores, ventanas) y el tamaño máximo del punto.
- **Víctor aprueba el aspecto de la versión 3** (20 nov). En su móvil va muy fluida con 60 000 partículas. Queda por
  ver el ritmo de los tramos.
- **Versión 4, con guiños (idea de Víctor):**
  - Una **bandera de España** que ondea en su mástil detrás del satélite (en horizontal en las dos orientaciones),
    con el escudo simplificado.
  - **Dos alienígenas verdes** en el hangar de la nave nodriza, junto a la lanzadera, con ojos grandes y antenas que
    se encienden; uno saluda con el brazo.
  - Se ven mientras la nave llega. Tras el texto quedan muy tenues, por el velo de la pantalla.
- **Versión 5:**
  - **Alienígenas más nítidos:** miembros con volumen, ojos rasgados con brillo, boca, manos de tres dedos y pies;
    puntos más finos en las piezas pequeñas.
  - **Un alienígena en traje de astronauta** sobre el casco, delante del puente, saludando: traje blanco con panel en
    el pecho, mochila, botas, el aro del casco y su reflejo, y las antenas, que asoman por el casco.
  - **Bandera de Irlanda** suelta: pasa flotando por detrás del satélite, de un extremo al otro, dando vueltas (cada
    16 s). La de España sigue en su mástil.
- **Versión 6 (lo que vio Víctor en el móvil):**
  - **Sin saltos de aspecto:** antes la nave pasaba de golpe de luz que se suma (blanca, transparente) a puntos
    opacos con color, al acabar el cambio de forma y al empezar a deshacerse. Ahora es gradual: un valor de 0 a 1
    (`uSolid`) mezcla los dos aspectos y el tamaño del punto con una mezcla `ONE, ONE_MINUS_SRC_ALPHA`
    (alfa 0 suma, alfa 1 tapa). Se solidifica en p 0,55 → 1 y vuelve a ser luz en p 3 → 3,3. La profundidad se escribe
    desde la mitad del paso. **Para la construcción:** se hace igual en el material real.
  - **Alienígenas nítidos de frente:** eran bolas de puntos gordos sin cara. Ahora tienen unas tres veces más
    partículas (un 12 % de la nave, tomado del casco, que de frente casi no se ve), puntos más finos, el 82 % de los
    de cabeza y cuerpo en la mitad que mira a cámara, y ojos más grandes con borde verde claro, que se leen sobre el
    fondo oscuro del hangar.
- **Versión 7:**
  - **Bandera de Irlanda de borde a borde:** entra por la izquierda de la ventana, pasa por detrás del satélite y sale
    por la derecha (cada 13 s). Su recorrido se calcula en cada frame con el ancho visible a su profundidad, así que
    también sale de la vista mientras la nave se acerca.
  - **La nave nodriza iba a tirones en el móvil de Víctor (v6).** Arreglos, que **valen para la construcción:**
    - Con la nave quieta (`uT = 0`), el shader calcula **una sola forma** por partícula: antes la nave se calculaba
      dos veces en cada frame. Es una condición sobre un uniform, así que la GPU se salta la segunda entera.
    - Los tres alienígenas, con una sola llamada a su función (menos código en cada rama del shader).
    - Ya sólida del todo, la nave se dibuja **opaca y sin mezcla de color**, como en la v5. La mezcla solo se usa
      durante el paso gradual. Sin `needsUpdate` al cambiar de modo.
  - Si en el móvil siguiera a tirones, se mira al construir (Víctor, 20 nov: el aspecto le gusta). Palancas: menos
    partículas en el casco de popa, que de frente no se ve, y un tamaño de punto máximo menor.
- **Víctor da por buena la versión 7** (20 nov).
- **Versión 8, idea de Víctor: se lee a pantalla completa, sin marco.** Sustituye a «la pantalla al 85 %» del
  apartado 3 y a la tabla del apartado 4:

  | Tramo | Escena | Interfaz |
  |---|---|---|
  | Llegada | nebulosa → nave, que se acerca girada y se endereza | el marco HTML aparece encajado con la pantalla (86–90 %) |
  | Llenar la vista | la nave sigue acercándose hasta que su pantalla cubre la ventana | el borde y el brillo del marco se apagan; el fondo pasa a casi opaco (esconde la nave) |
  | Pantalla del interludio | la nave, fuera de la vista | la transmisión se lee **a pantalla completa, sin marco** (como C.2) |
  | Salida | la nave se aleja de frente | **la pantalla se va con ella con el texto dentro**, encogiéndose; el borde vuelve |
  | Cola | la nave se deshace en la galaxia | la transmisión se funde |

  - **Para la construcción:** el contenido se maqueta a pantalla completa y, al alejarse, se encoge con
    `transform: scale()` centrado en la pantalla proyectada (lo que sale del lienzo se recorta con el marco). Así la
    lectura es la de C.2 y la nave solo cambia la entrada y la salida.
  - Ventaja: en móvil desaparece el problema de la franja estrecha (apartado 5): se lee como hoy en todos los tamaños.

## Coste y riesgos

- **Peso de la escena:** tras el retrato (C.6b y la corrección de su auditoría) quedan ~0,16 KB de margen tras F4.4
  (≤ 2,5 KB) y F4.5 (≤ 3 KB) (ADR-032; `rendimiento.md` → «Presupuesto»). Estimación: dos naves paramétricas y el mapa
  de formas, ~1–2 KB gzip: ya no caben sin un ADR nuevo que suba el tope (decisión de Víctor). Se mide en la prueba
  antes de decidir.
- **El cambio de forma:** hoy el morph dispersa las partículas a mitad (`MORPH_SCATTER`). De una nebulosa a un objeto
  pequeño y nítido puede verse sucio: la prueba tiene que enseñar los dos morphs (nebulosa → satélite → galaxia).
- **Escala:** un satélite al lado de una nebulosa no tiene la escala del resto del viaje. Se justifica en el relato
  («la señal viene de nuestra nave»). Si no convence, se puede no ver la nebulosa al llegar el satélite (fundido).
- **Pruebas:** las del shader (compila, sin avisos), el peso, la proyección de la pantalla (unitario, como `labelFit`),
  un e2e de que el marco y el satélite coinciden (por píxeles del lienzo, con tolerancia) y capturas nuevas.
- **Calendario:** unos 2 días (prueba, ADR y construcción). No cabe antes del 1 dic sin retrasar la fase C.

## Plan propuesto (C.7 · Naves, después de F4.5 o en el pulido)

1. **Prueba fuera del repo** (un artefacto, como el retrato): el satélite y la nave nodriza en partículas con el
   estilo del shader, los dos morphs y el encaje con un marco HTML al 85 %. Víctor elige la forma.
2. **Su ADR:** mapa de formas (`uFrom`/`uTo`/`uT`), naves paramétricas en el shader, el tramo de llegada y el peso.
3. **Construcción** en un PR: mapa de formas y tramos, satélite (Mission log), nave nodriza (Mission control), el
   retrato directo desde la Tierra (hecho en el primer paso de C.7: la llegada del epílogo, ADR-039, con el tipo de
   tramo `arrival` que pueden usar las naves), CSS del marco,
   tests y capturas.

Al construir C.4 (Mission control) y C.6 (Crew file) no se cerró nada de esto: los tramos y el componente
`Transmission` admiten un tramo de llegada y un marco más estrecho sin rehacerse. Lo que sí hay que rehacer sobre el
mapa de formas es lo del retrato: lo atado a `m − 4`, la dispersión de `k > 3.5`, `LAST_M` y la subida de `uPor`
(ADR-034, nota del cierre de la fase C).

## En cristiano

Ahora mismo, al llegar a tu experiencia, la pantalla ámbar sube como una persiana. Con la idea, el universo «fabrica»
la pantalla: las partículas de la nebulosa se juntan en un satélite que se acerca a la cámara, y tu experiencia se lee
en su monitor. Después se aleja y se deshace en la galaxia. Para no repetirte, la segunda vez es una nave nodriza, y
al final la Tierra se convierte directamente en tu cara.

Para hacerlo, la escena tiene que aprender a mezclar dos formas cualesquiera, no solo la de un capítulo con la del
siguiente. Y las naves se «dibujan» con fórmulas en el propio programa de la tarjeta gráfica, para que no pesen
apenas. El texto sigue siendo una página normal encajada en el hueco de la pantalla del satélite: se lee bien, lo
lee un lector de pantalla y sin 3D se ve como hoy. Cuesta unos dos días y algo de peso, así que va después del 1 de
diciembre, empezando por una prueba para ver si queda bonito antes de tocar el proyecto.
