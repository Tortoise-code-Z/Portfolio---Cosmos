# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** **F4.4 · Tortuga hecha** (placas, ciclo y pins; `main` en `f82a745` antes de este cierre) y su
primera auditoría corregida; **AUD-F4-4B en la Mesa** · siguiente: decidir y corregir AUD-F4-4B y **F4.5 · Tierra**
(cierra F4: `v0.3.0`).

_Última actualización: 2026-11-23 (**CIERRE DE SESIÓN · 43**) · F4.4 en dos PR (placas encendidas y pins), AUD-F4-4A
corregida entera, AUD-F4-4B lanzada._

**Hecho esta sesión** (vivas S43 en `_claude/cadena/hecho/2026-11-23/decisiones-vivas-S43.md`):
1. **F4.4a · placas encendidas** (PR #114, `2b4020f`; TOR-1-A, TOR-2-A, TOR-3-A): `uiStore.activeProject` lo
   escriben las filas (ratón, foco del teclado en sus enlaces, toque; tocar fuera apaga, `useTapOutsideTurnsOff`
   compartido con Skills); `scene/math/plateCycle` (la placa señalada o un ciclo cada 2,6 s que se para mientras hay
   un proyecto señalado y vuelve donde iba; nada con movimiento reducido ni lejos de la tortuga) → `SceneFrame.plate`
   → `uPlate` y `data-plate`; el pulso de la placa, por `uMotion`. El ciclo no marca filas. +391 B.
2. **F4.4b · pins** (PR #115, `4ae33ec`; PIN-1-A, PIN-2-B): `scene/PlatePins` (capa en `body`, solo en el viaje, con
   nombres y `onOpenProject` desde `SceneMount`); el ratón señala, el clic abre la ficha, en táctil el primer toque
   señala y el segundo abre; el balanceo de la tortuga compartido TS/GLSL (`TURTLE_SWAY` → cabecera `TURTLE_SWAY_*`,
   un test los ata); `fitPins` sube un piso (46 → 76 → 106 px) al que choca, de derecha a izquierda: en el móvil, en
   escalera; ocultos mientras se lee una transmisión (Mission control). `scene/labelWriter` compartido con las
   etiquetas de las estrellas; `--gradient-pin-stem`. +1 729 B.
3. **AUD-F4-4A corregida entera** (PR #116, `f82a745`; 0 bloqueantes, 6 recomendados, 12 menores, 3 preguntas; P1-A,
   P2-A, P3-A y las opciones recomendadas): un proyecto sin placa también para el ciclo; `chapterPresence(m, capítulo)`
   con `CHAPTER_PRESENCE_FADE` (una rampa para galaxia, placas y pins); `pointGestures` (Skills y filas); el `:hover`
   de la fila solo con `hover: hover`; `Highlight` en alto contraste; la zona de puntero de la fila hasta medio hueco
   (confirmado: al bajar despacio de una fila a otra asomaba la placa del ciclo); `skipWithoutWebGL2`; tests de gestos
   sin ciclo y docs de F4.4 entera. +21 B.
4. **AUD-F4-4B lanzada** a la Mesa · base `2b4020f` · hasta `f82a745` (F4.4b y la corrección de AUD-F4-4A; vivas S43
   hasta #30) → `_claude/cadena/aud-f4-4b/auditoria.md`.

**Incidencias y lecciones:**
- **F4.4b se fusionó antes de corregir AUD-F4-4A** (§13 pide esperar): sin daño, la corrección fue sobre `main` y
  cada hallazgo se contrastó con el código nuevo. Recordarlo justo antes de fusionar, no solo en el PR.
- **Sacar código cubierto de un módulo baja su cobertura de ramas** (`Constellations` cayó por debajo del 90 % al
  sacar `labelWriter`): se arregló quitando ramas imposibles (cada grupo guarda su malla), no con tests forzados.
- **CSS de los módulos:** una variable que escribe la escena va con prefijo privado (`--_pin-floor`) y un degradado,
  como token (`styles.test.ts`).
- **e2e con el ratón:** `page.mouse.move` fuera de la ventana no dispara nada: llevar antes la fila a la vista
  (`scrollIntoView`). Las comprobaciones de «no hay» esperan antes una señal positiva.
- **Contenedor (S43):** como S42; Node con `npm install --prefix ~/node24 node@24.22.0`; e2e con `--workers=1`.

**Deuda anotada:**
- **CI · WebKit a ~3 fps (S35):** la traza del CI de C.2 lo midió: WebKit sin GPU pinta unos 3 frames por segundo con
  la página entera, y la detonación pide 15 frames (la carga avanza como mucho 0,1 s por frame). Las esperas de
  detonación de `journey.spec.ts` van a 15 s (`DETONATE_TIMEOUT_MS`); desde S42, la espera a que las etiquetas de las
  constelaciones se queden quietas también (`LABELS_STILL_TIMEOUT_MS`, con `test.slow` en WebKit): con 5 s falló dos
  veces en el CI del PR #112. Si vuelve a fallar con 15 s, no es tiempo: mirar si algo ralentiza WebKit. No dice nada de un móvil real: medir en un
  iPhone (F6) que el Mission log (cursor que parpadea siempre, líneas de barrido, velo) no pese.
- **AUD-F4-3C-2 · iPhone real:** el toque en el margen de la escena solo lo cubre el e2e con `touchscreen`; mirarlo
  en un iPhone (si no hay móvil a mano, en F6).
- **C.7 · Naves** (fuera del cierre de la fase C, viva S41 #27: después de F4.5 o en el pulido): estudio, versiones
  de la prueba y lecciones del shader en `docs/02-experiencia/transiciones-naves.md` (manda la versión 8: se lee a
  pantalla completa). La prueba es el artefacto privado «Naves · prueba»; copia del código en `_claude/naves/`. Al
  construir: su ADR (uno nuevo, numerado al escribirlo: mapa de formas `uFrom`/`uTo`/`uT`, que obliga a rehacer sobre él lo del retrato atado a
  `m − 4`, la dispersión de `k > 3.5`, `LAST_M` y la subida de `uPor`) y el peso: el margen libre es de ~0,52 KB tras F4.4
  tras AUD-C6B, así que su ADR subirá el límite, con los números reales de F4.4 y F4.5.
- **Fase C · privacidad de Studios Demanzon:** el sitio y el repo no enseñan qué es el producto de la empresa ni
  cómo está construido: solo herramientas, para qué y lo hecho (nota de ADR-034; `experiencia.md` → «Regla de
  privacidad», sin ejemplos desde AUD-C2: una lista en un repo público sería la filtración). Las viñetas y la bio van
  suavizadas; se ha pedido lo mismo para el CV y LinkedIn en `trabajo-ofertas` (chat de mentor). El historial de git
  conserva la descripción vieja: se acepta (AUD-C2-P1-A). Cuando cambie el CV, volver a copiar el PDF a
  `public/`: desde S42 falla `content.test.ts` (su sha256) hasta revisar `CV_FACTS` contra el PDF nuevo y poner su hash. Vale también para la ficha, el README y las capturas.
- **Fase C · textos del Crew file (C.6a y C.6b, con «Identity verified»):** los escribió Claude (`textos-sitio.md` → «Epílogo») y entraron sin
  cambios en el PR #107; Víctor los revisa cuando quiera (y la Mesa en AUD-C6A). El nivel de inglés no se enseña
  (solo los idiomas).
- **Hasta F5 · la ficha de proyecto con velo y pausa (S38):** el lienzo es persistente y la atenuación de la ficha
  es de F5; mientras, `--color-veil` detrás del texto y la escena pausada (`uiStore.projectPageOpen`). F5 los quita
  (roadmap → F5, `pagina-proyecto.md` → «Hasta F5»).
- **C.4 · Projects conserva su alto** (240 vh; 260 en móvil) aunque ya no cambia de forma, como About en C.2: la
  página crece una pantalla de transmisión y su cola. Revisarlo si se quiere acortar el viaje.
- **C.4 · la cuenta atrás con una pantalla por paso** al hacer scroll: para el pulido o C.7 (MC-2-A).
- **C.4 · el ancho del raíl en WebKit** con «Control de misión» no se ha medido (154,02 es de C.3; Chromium da 155,1;
  se reservan 158 y el e2e de `constellations.spec.ts` lo compara en los tres motores).
- **AUD-C6B-5 · Brave:** Víctor vio los puntos sueltos en Brave (no tiene Firefox); el arreglo (canal R de 3 a 255,
  `PORTRAIT.depthFloor`) solo lo cubre un unitario: **mirar `/#crew-file` en Brave en producción** (o en la preview)
  y, si se puede, en la ventana privada de Firefox o Safari.
- **C.6b · el retrato:** de una sola foto sale un relieve (giro limitado, ~±25°, solo con ratón). En táctil no gira:
  la inclinación del móvil pide permiso en iOS (F6, con un móvil real, y mirar allí los fps con el atributo de más,
  `pPor`). Entre md y lg (900–1279 px) va la columna de móvil: el retrato se ve por el hueco del visor al pasar, no
  junto a la ficha. Mejora posible: un escaneo 3D (KIRI Engine o Scaniverse) convertido a partículas. El README no
  tiene captura del Crew file (si Víctor la quiere, la hace como las otras y Claude la recorta).
- **F4.5 · gravedad sobre la Tierra:** hoy la misma intensidad en todos los capítulos (F4.2); F4.5 la suaviza
  sobre la Tierra (`04-tierra.md`). Las constelaciones no son partículas: la gravedad no las mueve (F4.3b).
- **Dependencias · `overrides` (S42):** `eslint-plugin-jsx-a11y-x` 0.2.0 recibe `minimatch` 11.0.9 por `overrides`
  (`stack.md` → «Conflictos»): quitarlo cuando el plugin publique una versión con `minimatch` 11.
- **Transmisiones entre md y lg (S42):** de 900 a 1279 px, el Mission log y Mission control van en la columna de
  móvil, como el Crew file (antes partían palabras): mirarlo en una tableta apaisada real (F6).
- **Colores repetidos:** `--color-flash` y `--color-singularity` ya tienen test de pareja con `scenePalette`
  (F4.1); `--gradient-space` sigue repitiendo a mano el violeta y el turquesa de la nebulosa.
- **F6 · Big Bang (ADR-030):** el `wdth` del `<h1>` cambia por frame mientras se carga o se baja por el hero:
  medir el CLS. Las variables `--_bang-*` van en `<html>`: cada escritura recalcula el estilo de toda la página
  mientras dura el hero; medirlo con Performance (y, si pesa, escribirlas más abajo).
- **WebKit (CI) · test de Tab** («1280×720: every focusable element… comes into view with Tab»): ha fallado cinco
  veces; la 5.ª, en el CI de C.2, por tiempo (WebKit a ~3 fps y más enlaces con el Mission log). Desde C.2 lleva
  `test.slow()` en WebKit (90 s). Desde F4.3c, si lo enfocado no se ve, vuelve a mirarlo unos frames antes de darlo
  por tapado. Si vuelve a fallar por algo que no sea tiempo: mirar `scroll-padding` en WebKit.
- **Contenedor · `recruiter.spec.ts` (S36):** «390 px: the «Projects · Cosmic turtle» dot…» (EN) falla 1 de cada 5
  en el contenedor, también sobre `main`: no es de ningún cambio; en el CI pasa. Si sale en el CI, mirarlo.
- **e2e en el equipo de Víctor con varios workers (S43):** `plates.spec.ts` agotó dos tiempos (hover y Tab) y la
  prueba de movimiento reducido tardó 29,9 s de 30: SwiftShader en varias ventanas a la vez satura la máquina (en el
  contenedor, 4 workers sobre 2 núcleos rompen también `constellations.spec.ts`). Los e2e de la escena, en local, con
  `--workers=1`. En `npm run check`, `scripts/docsOnly.test.ts` agotó una vez los 10 s de su `beforeAll` (crea un repo
  de git de usar y tirar): si se repite suelto en Windows, subir su `hookTimeout` en un PR aparte.
- **F6 · móvil real (F4.4):** los pins en escalera a 390 px (`fitPins`), la fila que ya no se queda ámbar tras tocar
  fuera (`:hover` solo con `hover: hover`, sospechado en iOS: AUD-F4-4A-5) y el ciclo de placas con la `m` suavizada.
- **e2e en el equipo de Víctor (S32, S38):** la primera tanda completa de Chromium en Windows sacó dos carreras de
  carga que pasaban solas (el recuento de chunks de `scene.spec.ts`, que contaba la descarga tardía de la página del
  `beforeEach`, y el espaciado del nombre en `journey.spec.ts`, que tardaba más de 5 s con pocos frames). Blindadas
  en el PR #93 (`about:blank` antes de apuntar; `expect.poll` a 15 s). En S38, un `page.goto` de
  `mission-control.spec.ts` se pasó de 30 s esperando `networkidle` con la página ya pintada, y pasó al repetirlo. Si
  sale otra así, mirar primero si pasa sola (`--repeat-each=3`); si se repite, cambiar ese `goto` a `load`.
- **F5 · la 404:** enseña la singularidad (bajo el título a 1440×900; entre el título y la frase a 390×844, sin tapar
  texto). La nebulosa atenuada llega en F5, con un e2e de que no tapa el texto (roadmap F5).
- **Mediciones (desde F3.8):** Lighthouse y PageSpeed corren sin GPU y miden el modo sin WebGL (con fotos fijas):
  el rendimiento de la escena solo lo miden los fps (`calidad.md` → «F3.6c · fps de la escena»). En F6, con
  Lighthouse CI, decidir si se mide también con GPU; falta el móvil real (≥ 30 fps en Bajo).
- **Vitest:** avisa «jsdom was created 145 times · ~68 s» (S42; tiempo sumado entre hilos). No activar `isolate: false` ni
  `vmThreads` (quitan aislamiento: stores, globales y mocks). Valorar pasar a entorno `node` los tests sin DOM (lógica
  pura de `lib`, `content`; hoy 8 de 121), midiendo antes y después. Tarea pequeña aparte.
- **Fotos fijas (F3.9):** límites aceptados en `camara-y-encuadre.md` («Dónde no cuadra»: franjas en móvil apaisado,
  en ventanas ≥ 900 px más estrechas que 1,25 y en las más anchas que 2,4; puntos más gordos al escalar). En F6, con
  un móvil real sin WebGL: el encaje con la barra de direcciones visible y escondida (ya lo mide `@container`), el
  fundido entre capítulos y AVIF 4:4:4 en Safari.
- **F6 · zona segura en horizontal (F4.3c):** en un iPhone grande ≥ 900 px con muesca, `--gutter` suma
  `env(safe-area-inset-*)` y el panel crece ~35 px, pero `STAR_LABEL_KEEP_OUT` no: una etiqueta podría quedar bajo su
  velo. Mirarlo con el iPhone real. (Lo demás que la escena reserva a mano ya lo compara el e2e de F4.3c con la
  página real en los tres motores.)
- **F4.3c · deslizar no apaga:** solo lo cubre el test unitario (Playwright no simula un deslizamiento táctil);
  mirarlo en un móvil real (F6).
- **F4.3 · líneas de las constelaciones en retina (pregunta abierta):** WebGL pinta las líneas de 1 px del
  dispositivo: a DPR 2 son 0,5 px CSS y, en reposo (0,22), dan la mitad de luz que en Bajo. Víctor lo mira en su
  pantalla (Alto, DPR 1 y 2) y decide: aceptarlo y escribirlo en «Estados», o multiplicar `uOpacity` de las líneas
  por `min(uPR, 2)` (unos bytes de GLSL).
- **`npm run visual` en Docker:** el primer test de cada tanda se pasaba de los 15 s esperando la escena (arranque en
  frío). Desde el PR #110 la espera a la escena tiene su plazo (60 s; el test, 90): **confirmarlo** en la próxima tanda
  completa. `visual:update` sin argumentos borra **todas** las capturas antes de rehacerlas (`visual-in-docker.sh`):
  la que falla se queda borrada (devolverla con `git restore`). Con `-- --workers=1` no borra (`calidad.md` →
  «Regresión visual»). `visual:update` rehace todas y puede meter ruido (≤ 4/255) en capturas que no cambian:
  devolverlas con `git restore` antes del commit.
- **F6 · hero con la letra al 200 % (AUD-F4-1-4):** a 390 px el nombre ya no cabe en su columna y ahora se corta
  (`overflow-x: clip`) en vez de dar scroll de lado. Junto al resto del texto al 200 %.
- **F6 · iPhone real (AUD-F4-1-13):** con el bucle del Big Bang, el halo es fijo a `50svh` y el lienzo a toda la
  ventana: con la barra de direcciones escondida pueden no ser concéntricos (solo en `m` < 0,12).
- **F4 · fotos fijas:** cada paso que cambie lo que se ve (formas, shaders, cámara, placas, el Sol) pide
  `npm run stills` en el mismo PR; una carpeta nueva de `scene/` que cambie las fotos va a `STILLS_SOURCES`
  (`tests/stills/fingerprint.ts`).
  La lista es a mano (desde S40 suma el retrato —`usePortrait`, `worker`, sus imágenes byte a byte— y `content/chapters.ts` con `lib/scroll/mapM`): AUD-F3-CIERRE sumó `sceneClock` y `reducedMotion`, que `SceneRoot` importa por ruta relativa.
  Al añadir una carpeta, mirar también sus imports relativos (si F4 trae varias, un guardián que recorra el grafo
  desde `SceneRoot`). Lo recuerdan §13, «hecho» y el roadmap.
- **WebKit y el `<picture>`:** que WebKit pidiera el `src` del `<img>` antes de entrar en el `<picture>` es deducido
  (no hay WebKit en el contenedor); el arreglo lo vigila el e2e de escritorio sin WebGL en el CI.
- **Peso de la escena:** 256 481 B de 260 000 (ADR-032 y sus notas; medido commit a commit: tras S38 253 071,
  C.5 −2, C.6a +52, C.6b +967, AUD-C6B +252, F4.4a +391, F4.4b +1 729, AUD-F4-4A +21). Quedan 3 519 B: F4.5 ≤ 3 KB
  y ~0,52 KB de margen. Cada paso apunta lo que pesó en `rendimiento.md`. Por paquete se mide con
  `npx source-map-explorer <chunk>.js --gzip --no-border-checks` sobre un build con `sourcemap: true` (sin commitear).
- **Capturas con movimiento reducido (F36-5-A):** no vigilan lo que solo se ve en movimiento (oscilaciones, estela).
- **Degradación en caliente:** un navegador que limita los frames a 30 (ahorro de batería) baja a Bajo en
  escritorio: aceptado y escrito en `rendimiento.md`.
- **e2e de Chromium:** ~10 min en el contenedor (323), en Bajo en los tres motores (los de la degradación
  arrancan en Alto con los frames retrasados por el test). SwiftShader pinta sin parar mientras la página está a la
  vista: mirar los tiempos del CI. En la tanda completa del contenedor, «1280×720: loading the hero with slow fonts
  keeps CLS under 0.1» se pasó una vez de 30 s en `page.goto` (y pasó 3 de 3 suelto): vigilarlo en el CI.
- **F4 · escena:** todo lo nuevo lee `SceneFrame.m` (la `m` suavizada de la escena), nunca `sceneStore.m`
  (ADR-028). Un módulo nuevo de `scene/` con Three, React o un store se añade a `IMPURE_SCENE_MODULES` de
  `eslint.config.js` (la lista es a mano), y uno de lógica que se prueba sin WebGL, al 90 % de `vitest.config.ts`
  (F3.6a lo olvidó con `fpsMeter` y `useHotDegradation`; `useSceneShapes` sigue fuera de esa lista).
- **Encuadre (F3.6c):** a 1280 y 1440 los brazos tenues de la galaxia montan un 3–5 % en el panel (aceptado para
  que siga grande); en móvil las formas quedan algo más pequeñas que antes y la galaxia roza el raíl (~3 %). El CI
  solo vigila 1440×900 y 390×844: los otros cuatro tamaños se miran con las herramientas de
  `_claude/cadena/hecho/2026-10-28/encuadre/` al tocar la cámara (F4).
- **Shaders:** los coeficientes propios de cada forma (giros, amplitudes) van en el GLSL junto a su fórmula, sin
  `const` con nombre (peso; `particulas-y-shaders.md` → «Mejoras»). Si se ajustan algún día, valorar nombrarlos.
- **`npm run dev`:** en una navegación dentro de la misma página el worker de las formas puede pasar de 3 s (Vite
  lo transforma al pedirlo) y se usa el reintento; en el build y los e2e va por el worker.
- La guarda `controller.signal.aborted` de `useSceneShapes` no la puede ver ningún test (`obtainShapes` ya
  devuelve `'aborted'` en todos los caminos): se queda como defensa.
- **Shader medido y aceptado (F3.6c):** `SIZE_MAX_PX = 48`, `MAX_STEP_S = 0,1`, la estela con alfa 0 en Bajo y la
  compilación al primer frame se quedan como están (60 fps estables en Alto, `rendimiento.md` → «Presupuesto»).
  Volver a mirarlo con un móvil real o si F4 baja de los presupuestos.
- **Fps medidos solo en un equipo** (Brave en Windows, 6 núcleos, ventana 1029×637 a DPR 1,5) y limitados por el
  refresco de la pantalla (60): falta un móvil real (≥ 30 fps en Bajo), una ventana maximizada y Firefox/Safari
  (F6). El fragmento de medida está en `_claude/cadena/hecho/2026-10-28/medir-fps.js`.
- **Capturas con tolerancia estrecha (AUD-F3-6-2):** `threshold` 0,05 y 50 píxeles. Pasó dos veces en Docker; si el
  CI da algún fallo suelto de bordes, mirar el informe antes de aflojar.
- **F6 · alto contraste (AUD-F3-3-P6, A):** con `forced-colors` la escena sigue pintando detrás del texto;
  decidirlo con NVDA y alto contraste a mano.
- **Generación de 60.000 partículas:** ~0,4 s en el contenedor (casi todo la nube de la nebulosa; algoritmo del
  prototipo). Pasa el límite de 1 s; si en el CI o en un móvil real pesa, mirarlo allí antes de tocar nada.
- **CI · Firefox y WebKit:** pasan presentados como GPU y en Bajo (F3.8); sigue sin saberse qué `renderer` real dan
  ni si tienen WebGL2 por GPU. Los e2e con WebGL se omiten si no lo hay.
- **R3F 9.8.1 + three 0.186:** `console.warn` «THREE.Clock: This module has been deprecated» al montar el lienzo.
  Se va cuando R3F use `THREE.Timer`: mirarlo al subir R3F.
- **F6 · NVDA:** el aviso sin WebGL se descarta con «Got it» y el foco cae al `body` (igual que «No, gracias»).
- **F6 · fuentes:** IBM Plex Mono no se precarga y pinta la primera pantalla (barra, metadatos de la ficha, HUD,
  eyebrows). Desde #43 sus reservas miden lo mismo por letra (0,6 em) y el cambio ya no mueve las líneas; valorar
  precargarla midiendo la LCP, y mirar en un Windows real cómo se ve Courier New mientras llega.
- **CI:** cada job de e2e descarga la imagen de Playwright (~2 GB). Si el CI vuelve a ir lento, medir cuánto es
  la descarga antes de tocar nada. Subir `@playwright/test` = subir cada `image:` de `ci.yml` (ADR-024) y `npm run visual:update`.
- **F6 · Lighthouse:** aviso sin peso `label-content-name-mismatch` en EN / ES (se ve «EN», el nombre accesible
  es «English», decidido en `componentes.md`): revisarlo con NVDA y control por voz. Hasta F6, Lighthouse se pasa
  a mano al cerrar cada fase y se apunta en `calidad.md` → «Mediciones» (en local y, con PageSpeed Insights, en
  producción).
- **F3–F4 · móvil:** a 390 px el raíl (y cualquier ancla) cae en el capítulo con la escena primero
  (`03-tortuga.md` → «Móvil»); en F2 son ~700 px vacíos. La escena los llena; `recruiter.spec.ts` fija que las filas
  quedan a **un** deslizamiento y avisará si el hueco crece.
- **Imágenes (F2.8):** Vercel no guarda la caché de `vite-imagetools`, así que cada despliegue genera las 128
  variantes (~1 min más; ADR-023). La LCP de las fichas es la portada: medida al cerrar F2 (`calidad.md` →
  «Mediciones»); en local pasa algo de 2,5 s y en producción no: vigilarla en F6.
  El `og:image` de las fichas mide ~1200×576 (proporción de la captura, no 1,91:1): ver cómo lo recortan las redes
  cuando se hagan las imágenes del sitio (F6). Las capturas traen de origen la barra de scroll del navegador a la
  derecha: recortarla en F6 si molesta. En el contenedor solo corre Chromium: Firefox y WebKit de
  `project-images.spec.ts` se ven en el CI.
- **`sizes` (AUD-F2-8):** los cortes no cuentan una barra de scroll clásica de escritorio: en esa franja de ~15 px
  se pide una variante algo menor, que solo se nota a densidad 2. Si cambian `--read-w`, `--project-col-min`,
  `--space-3` o `--gutter`, `imageSizes.test.ts` falla y hay que revisar `PROJECT_LAYOUT`.
- **F6:** mirar si al navegar dentro del sitio a una ficha se pide también la WebP de 1920 (`src`) además de la
  AVIF elegida (sin evidencia; la Mesa lo dejó como comprobación: `page.on('request')` yendo de `/` a «View
  project»).
- **Windows/Edge:** comprobar a mano que abrir y cerrar «Quick mission» no hace saltar la página de lado
  (`scrollbar-gutter`), si no se hizo.
- **F6 · iPhone real:** el aire de arriba de la ficha con la zona segura (headless no la tiene).
- **F5:** la placa iluminada al volver lee `uiStore.visitedProject` (el mismo dato del foco en la fila). Hasta
  entonces, volviendo con el teclado ya se enciende, porque ese foco señala la fila (AUD-F4-4A-P3-A); con el ratón, no.
- En el visor y en la misión rápida (modal nativo), el Tab puede pasar por la interfaz del navegador antes de volver
  al diálogo: la página sigue inerte. Aceptado; mirarlo con NVDA en F6.
- **F6 · NVDA:** el foco al nombre del proyecto al llegar a una ficha (también al cambiar EN / ES); tras «No,
  gracias» el aviso desaparece y el foco cae al `body`; antes de hidratar, «Quick mission» no hace nada; en modo
  exploración, NVDA/JAWS activan con un clic sintético que el `HoldButton` ignora.
- **F6 · tableta:** entre 520 y 900 px el HUD (abajo a la izquierda) pasa por encima del texto del panel al hacer
  scroll, como el prototipo (es decorativo y sin puntero), y la sugerencia de idioma lo tapa hasta que se contesta.
- **F6 · texto al 200 %:** a 390 px, las filas de Proyectos del viaje se salen del ancho (`scrollWidth` ≈ 605 px).
  La ficha de proyecto y la 404 no (lo vigila `project-page.spec.ts`).
- **F6:** el «≈» de los eyebrows, los superíndices `⁰ ⁴–⁹ ⁻` y el «∞» del HUD salen con la mono del sistema
  (excepción en `design-system.md` → «Iconos»): mirarlo en los tres motores. El hero en un móvil real y el CLS.
- El `useLayoutEffect` del HUD (sin parpadeo al cambiar de idioma) no tiene test: mirarlo con Performance en F6.
- El e2e de alto contraste y el de copiar al portapapeles solo corren en Chromium.
- ADR-022 (entre features, solo contratos sin React) no lo vigila ESLint: se revisa en las auditorías.
- Iconos de GitHub y LinkedIn: hoy enlaces de texto + icono externo; decidir si se dibujan en F6.
- **WebKit descarga dos veces las fuentes precargadas** (bug 194589): en F6, medir en un Safari real.
- La lista de valores neutros del test de colores obliga a ampliarla con un valor legítimo nuevo (a propósito).
- `@lhci/cli` y el script `lhci` se instalan en F6.
- **F7:** que `/es/*` reciba la 404 ES y que las 404 salgan con estado 404 real en Vercel (en `preview` salen con
  200); comprobar el `X-Robots-Tag: noindex` de las previews (ahora más importante: su canónica apunta a
  `tortoisecode.dev`, ADR-025); **`cleanUrls: true`** en `vercel.json`.
- Provisional: `favicon.svg` (F6).
- **React Router 8.4 no pasa `caseSensitive` a las rutas del cliente:** lo cubre `isLowerCasePathname`. Al
  actualizar React Router, comprobar si ya lo pasa.
- Si alguna ruta lanza un 404 desde un `loader` (`throw data(null, { status: 404 })`), choca con
  `@typescript-eslint/only-throw-error`: configurar el `allow` de la regla. Hoy ninguna lo hace.
- **C.6a · el raíl que encoge:** en una ventana baja las ocho paradas bajan de 44 px hasta 24 px como mínimo (WCAG
  2.5.8; excepción escrita en las reglas, «Accesibilidad común» y ADR-034), sin entrar en las zonas seguras; en una
  ventana ancha pero baja (`height < 30em`), solo los puntos y sin HUD. Mirarlo en un móvil real apaisado (F6).
- **e2e · emails duplicados:** el email sale en Contacto y en el Crew file: un `getByRole('link', { name: email })`
  sin acotar a su sección falla por modo estricto (lo arregló `journey.spec.ts`).
- **Fotos fijas en el contenedor (S40):** se pueden sacar sin Docker (`COSMOS_STILLS_DOCKER=1 npx playwright test -c
  playwright.stills.config.ts`) para comprobar o para rehacer solo `stills.json`; las fotos que entran son las de
  Docker (`npm run stills` en el equipo de Víctor).

**Siguiente paso (próxima sesión, conversación nueva):**
1. Arrancar con `session-start` (y la skill `taller`).
2. **AUD-F4-4B:** cuando la Mesa entregue, decidir (Víctor) y corregir entera en su rama desde `main`.
3. **F4.5 · Tierra:** esquema (roadmap → F4 · 5; `docs/02-experiencia/capitulos/04-tierra.md`,
   `docs/04-escena/particulas-y-shaders.md`, `formas.md`): día/noche, amanecer, luces de ciudad, atmósfera y Sol, y la
   gravedad del cursor más suave sobre la Tierra; ≤ 3 KB de escena (quedan 3 519 B); `npm run stills` y capturas.
   Puede avanzar en su rama mientras se audita F4.4b, pero no se fusiona hasta que esa corrección esté en `main`.
   Con F4.5, F4 cerrada: Lighthouse a mano, auditoría de cierre y etiqueta `v0.3.0`.
4. Víctor: mirar `/#crew-file` en Brave en producción (AUD-C6B-5); pegar la descripción, la web y los topics de
   Cosmos en GitHub (`ABOUT_REPOS.md` del Proyecto de claude.ai); suavizar el CV y LinkedIn con el chat de mentor (y
   avisar para volver a copiar el PDF: lo pedirá `content.test.ts`); redirigir el portfolio antiguo de Vercel a
   tortoisecode.dev; mirar las líneas de las constelaciones en su pantalla; revisar los textos del Crew file y, si la
   quiere, una captura del Crew file para el README.

**Dudas abiertas:** D5 · analítica (F7). Tareas de Víctor: script de consola en el README de Chessmate (lo cita el
«Try it»).
**Limpieza manual del usuario:**
- Todo `_claude/tmp/` (copias del repo y archivos de las sesiones 34 a 43, entre ellas `s37/` a `s43/`, `c3/` y
  `aud-c2/`) y `_claude/lstree.txt`; `_claude/readme-originales/` si ya no hacen falta.
- Ramas locales ya fusionadas (todas menos `main`, entre ellas `feat/turtle-plates`, `feat/turtle-pins`,
  `fix/aud-f4-4a`, `fix/aud-c-cierre` y `chore/deps-2026-11`): `git branch` para verlas y `git branch -D <rama>`.
- En el buzón se puede borrar todo lo de `_claude/cadena/tmp/` y, dentro de `_claude/cadena/hecho/`, los
  `arbol*.tar.gz`, `previas.tar.gz` y los `*.diff` (nunca la carpeta `_claude/cadena/`, ni `hecho/2026-10-28/medir-fps.js`
  ni `hecho/2026-10-28/encuadre/`). Mover a mano a `hecho/` lo que no se pudo desde aquí (`aud-f4-1/` a
  `hecho/2026-11-18/`, `aud-c2/` a `hecho/2026-11-21/` si siguen fuera). No borrar `_claude/diseno/`, `_claude/retrato/`,
  `_claude/naves/` ni `_claude/c3/`.
- En la raíz del repo, `playwright-report-firefox.zip`, `playwright-report-firefox (1).zip`,
  `playwright-report-webkit.zip` y `test-results/`.
- Perfiles temporales de las pruebas sin WebGL: `$env:TEMP\cosmos-sin-webgl` y `$env:TEMP\cosmos-swiftshader`.
- Si alguna vez falla `npm ci` dentro de Docker: `docker volume rm cosmos-portfolio-visual-node-modules`.

**Bloqueos:** ninguno.
