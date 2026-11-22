# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** **Fase C · C.1–C.5 hechos y auditados; C.6a (el epílogo sin retrato) fusionado** (`main` en
`4743248`) · siguiente: **AUD-C6A a la Mesa**, su corrección y después **C.6b · el retrato** (objetivo: 1 dic).

_Última actualización: 2026-11-22 (**CIERRE DE SESIÓN · 39**) · C.5 completo (la ficha de Cosmos, el README y el
detalle fuera de la home), AUD-C5 corregida entera y C.6a fusionado: el Crew file en el canal verde._

**Hecho esta sesión** (vivas S39 en `_claude/cadena/hecho/2026-11-22/decisiones-vivas-S39.md`):
1. **C.5 · Cosmos completo** (PR #105, `9f8f574`; 4 commits): el detalle de las fichas fuera del JS de la home
   (ADR-036: tarjeta `ProjectEntry` en `content/projects/<slug>.ts`, detalle `ProjectDetail` en `details/`, que solo
   junta `content/projects/index.ts`; la home baja de 38,5 a 34,7 KB); `metaDescription` opcional (≤ 160, solo
   Cosmos); la ficha de Cosmos con proceso, retos medidos, funcionalidades nuevas y la nota del README; el
   `README.md` en inglés con 7 capturas (las hizo Víctor; Claude las recortó al píxel: `docs/readme/`); la
   descripción y los topics de GitHub en `ABOUT_REPOS.md` del Proyecto de claude.ai (Víctor los pega).
2. **AUD-C5 corregida entera** (PR #106, `806cf02`): 3 recomendados y 18 menores. Lo principal: la ficha y el README
   dicen el método como Mission control (se audita cada tarea) y los 60 fps «en mis mediciones»; el diagrama de capas
   del README corregido (importa / allow-list / lint, no build); las puertas de ESLint de ADR-036 cierran también el
   índice con extensión y los `import()`, con su test (`scripts/eslintDoors.test.ts`).
3. **C.6a · el epílogo sin retrato** (PR #107, `4743248`), avanzado mientras la Mesa auditaba C.5 (regla nueva,
   §13): el capítulo 5, Crew file, en el canal verde (tokens con su AA), con la ficha como lista de definiciones
   (puesto, base, permiso, disponibilidad, idiomas sin nivel y la formación, que se muda de Contacto), «Download CV»
   tras el título, el email y el pie del sitio; `Transmission` acepta un interludio o un capítulo; el raíl de 8
   paradas que encogen en una ventana baja; el HUD se esconde en el epílogo; Contacto cambia en su segunda mitad (la
   escena se queda en la Tierra hasta C.6b). Home 35,5 KB; escena +52 B.
4. **Decisiones para C.6b:** la transición B (la Tierra se convierte en el retrato; las partículas se encienden al
   paso del haz de barrido, atado al morph; al acabar, «Identity verified») y la foto de la prueba (sesión 34) entra
   al repo público (`05-crew-file.md`).

**Incidencias y lecciones:**
- **`npm run check` otra vez tras el último cambio de docs:** una clave del buzón («AUD-C4») escrita en
  `rendimiento.md` después del check la paró `code-references.test.ts` en el pre-push de Víctor.
- **El puente con el equipo de Víctor se corta al cerrar el portátil:** Claude sigue en la nube (contenedor) y
  pasa los archivos al volver; si hace falta, un zip con las rutas del repo. Antes de pasarlos, comprobar que la
  rama del equipo está sobre el `main` correcto (C.6a se hizo sobre `806cf02` y la rama seguía en `9f8f574`).
- **`visual:update` sin argumentos borra todas las capturas:** las que fallan por el arranque en frío se quedan sin
  archivo; se rehacen con `--workers=1` (no borra) y, si la primera sigue fallando, `--repeat-each=3 --grep`.
- **Con 8 paradas el raíl no cabía en un móvil apaisado** (390 de alto; 360 ya se salía con 7): ahora encoge.
- **Contenedor (S39):** como en S38 (Node 24 del paquete npm, Chromium de `/opt/pw-browsers` enlazado como 1248 en
  `~/pwb`, `.env` desde `.env.example`, `git init` local); el repo se trae con un `tar` del árbol de trabajo.
  Docker no arranca en el contenedor: `npm run stills` y `npm run visual` los pasa Víctor.

**Deuda anotada:**
- **CI · WebKit a ~3 fps (S35):** la traza del CI de C.2 lo midió: WebKit sin GPU pinta unos 3 frames por segundo con
  la página entera, y la detonación pide 15 frames (la carga avanza como mucho 0,1 s por frame). Las esperas de
  detonación de `journey.spec.ts` van a 15 s (`DETONATE_TIMEOUT_MS`). No dice nada de un móvil real: medir en un
  iPhone (F6) que el Mission log (cursor que parpadea siempre, líneas de barrido, velo) no pese.
- **AUD-F4-3C-2 · iPhone real:** el toque en el margen de la escena solo lo cubre el e2e con `touchscreen`; mirarlo
  en un iPhone (si no hay móvil a mano, en F6).
- **C.7 · Naves** (idea aprobada sin calendario): estudio, versiones de la prueba y lecciones del shader en
  `docs/02-experiencia/transiciones-naves.md` (manda la versión 8: se lee a pantalla completa). La prueba es el
  artefacto privado «Naves · prueba»; copia del código en `_claude/naves/`. Al construir: su ADR-037 y medir el peso
  (C.6b sale antes del mismo margen de la escena).
- **Fase C · privacidad de Studios Demanzon:** el sitio y el repo no enseñan qué es el producto de la empresa ni
  cómo está construido: solo herramientas, para qué y lo hecho (nota de ADR-034; `experiencia.md` → «Regla de
  privacidad», sin ejemplos desde AUD-C2: una lista en un repo público sería la filtración). Las viñetas y la bio van
  suavizadas; se ha pedido lo mismo para el CV y LinkedIn en `trabajo-ofertas` (chat de mentor). El historial de git
  conserva la descripción vieja: se acepta (AUD-C2-P1-A). Cuando cambie el CV, volver a copiar el PDF a
  `public/`. Vale también para la ficha, el README y las capturas.
- **Fase C · textos del Crew file (C.6a):** los escribió Claude (`textos-sitio.md` → «Epílogo») y entraron sin
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
- **C.6 · retrato:** sale de una sola foto (relieve, no cabeza completa): giro limitado (~±25°). Mejora posible: un
  escaneo 3D con una app del móvil (KIRI Engine o Scaniverse) y convertir el modelo a partículas. La foto y los
  datos del retrato no entran al repo hasta C.6 (copia y scripts en `_claude/retrato/`).
- **F4.5 · gravedad sobre la Tierra:** hoy la misma intensidad en todos los capítulos (F4.2); F4.5 la suaviza
  sobre la Tierra (`04-tierra.md`). Las constelaciones no son partículas: la gravedad no las mueve (F4.3b).
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
- **Vitest:** avisa «jsdom was created 121 times · ~123 s» (tiempo sumado entre hilos). No activar `isolate: false` ni
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
- **`npm run visual` en Docker:** el primer test de cada tanda se pasa a menudo de 30 s (arranque en frío): con 4
  workers, las 4 primeras de escritorio; con `--workers=1`, a veces la primera, también sola con `--grep` (S36).
  `visual:update` sin argumentos borra **todas** las capturas antes de rehacerlas (`visual-in-docker.sh`): la que
  falla se queda borrada (devolverla con `git restore` si no cambia). Con `-- --workers=1` no borra
  (`calidad.md` → «Regresión visual»). En S39 fue peor: la primera captura de escritorio (`chapter-0-start`) falló
  siempre, también sola y con `--timeout=120000` (lo que se pasa son los 15 s del `expect` de `PARTICLES_PAINTED`); se
  salvó con `npm run visual:update -- --workers=1 --repeat-each=3 --grep "chapter 0"` (la segunda vuelta, en
  caliente, la escribe). Fuera de Docker la misma captura pinta en 2,5 s. En la cola: un PR pequeño que caliente el
  servidor o dé más tiempo solo en `visual` (ya conviene).
  `visual:update` rehace todas y puede meter ruido (≤ 4/255) en capturas que no cambian (`chapter-0-start`,
  `chapter-4-contact`): devolverlas con `git restore` antes del commit.
- **F6 · hero con la letra al 200 % (AUD-F4-1-4):** a 390 px el nombre ya no cabe en su columna y ahora se corta
  (`overflow-x: clip`) en vez de dar scroll de lado. Junto al resto del texto al 200 %.
- **F6 · iPhone real (AUD-F4-1-13):** con el bucle del Big Bang, el halo es fijo a `50svh` y el lienzo a toda la
  ventana: con la barra de direcciones escondida pueden no ser concéntricos (solo en `m` < 0,12).
- **F4 · fotos fijas:** cada paso que cambie lo que se ve (formas, shaders, cámara, placas, el Sol) pide
  `npm run stills` en el mismo PR; una carpeta nueva de `scene/` que cambie las fotos va a `STILLS_SOURCES`
  (`tests/stills/fingerprint.ts`).
  La lista es a mano: AUD-F3-CIERRE sumó `sceneClock` y `reducedMotion`, que `SceneRoot` importa por ruta relativa.
  Al añadir una carpeta, mirar también sus imports relativos (si F4 trae varias, un guardián que recorra el grafo
  desde `SceneRoot`). Lo recuerdan §13, «hecho» y el roadmap.
- **WebKit y el `<picture>`:** que WebKit pidiera el `src` del `<img>` antes de entrar en el `<picture>` es deducido
  (no hay WebKit en el contenedor); el arreglo lo vigila el e2e de escritorio sin WebGL en el CI.
- **Peso de la escena:** 253 121 B de 260 000 (ADR-032 y sus notas; C.3 pesó 127 B, AUD-C2 1 B, los menores de
  AUD-F4-3C 2 B, la sesión 38 31 B, C.5 nada y C.6a 52 B: el raíl que encoge). Topes que quedan: F4.4 ≤ 2,5 KB y
  F4.5 ≤ 3 KB, ~1,4 KB de margen, y **C.6b (el retrato) tiene que salir de ahí**: medirlo antes de nada y, si no cabe,
  decidirlo (un ADR que suba el tope o recortar). Cada paso apunta lo que pesó en `rendimiento.md`. Por
  paquete se mide con `npx source-map-explorer <chunk>.js --gzip --no-border-checks` sobre un build con
  `sourcemap: true` (sin commitear).
- **Capturas con movimiento reducido (F36-5-A):** no vigilan lo que solo se ve en movimiento (oscilaciones, estela).
- **Degradación en caliente:** un navegador que limita los frames a 30 (ahorro de batería) baja a Bajo en
  escritorio: aceptado y escrito en `rendimiento.md`.
- **e2e de Chromium:** ~6–7 min en el contenedor (219), en Bajo en los tres motores (los dos de la degradación
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
- **F5:** la placa iluminada al volver lee `uiStore.visitedProject` (el mismo dato del foco en la fila).
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
- **Hasta C.6b · el epílogo sobre la Tierra:** el Crew file tiene `m` = 5, pero la escena no tiene sexta forma: el
  shader y la cámara se quedan en la Tierra (también la foto fija sin WebGL). Contacto ya cambia en su segunda mitad
  (el 52 %, como Skills): con el retrato, esa ventana es la transición del haz de barrido (`05-crew-file.md`).
- **C.6a · el raíl que encoge** (decidido por Claude con Víctor fuera; él lo vio en el PR): en una ventana baja las
  ocho paradas bajan de 44 px hasta 24 px como mínimo (WCAG 2.5.8). El e2e lo mide en Chromium a 844×390 y 800×360;
  en el CI, los tres motores. Mirarlo en un móvil real apaisado (F6).
- **e2e · emails duplicados:** el email sale en Contacto y en el Crew file: un `getByRole('link', { name: email })`
  sin acotar a su sección falla por modo estricto (lo arregló `journey.spec.ts`).

**Siguiente paso (próxima sesión, conversación nueva):**
1. Arrancar con `session-start` (y la skill `taller`).
2. **AUD-C6A a la Mesa** (encargo listo para un chat nuevo):
   `Usa la skill mesa. Encargo para la Mesa · AUD-C6A · base 806cf02 · hasta 4743248` · Audita C.6a · el epílogo
   sin retrato (PR #107): el capítulo 5 Crew file (`EPILOGUE`, `isTransmissionStop`, `JOURNEY_SEGMENTS`), `CrewFile`
   y `Transmission` con capítulo, el canal verde (tokens y AA), la formación y el pie mudados de Contacto,
   `Profile.languages`, el raíl de 8 paradas que encoge (`--rail-stop`, `railHalfHeight`), el HUD escondido, la foto
   de la Tierra en el capítulo 5 y `crew-file.spec.ts`. Especificación: `05-crew-file.md`, `componentes.md` (Raíl),
   `design-system.md` (Transmisiones), `scroll-y-escena.md`, `textos-sitio.md` (Epílogo), ADR-034; vivas S39
   #24–#27 y #32–#35 (`_claude/cadena/hecho/2026-11-22/decisiones-vivas-S39.md`). Ámbitos: estilos e interfaz ·
   lógica y contenido · escena 3D (lo que toca: `labelFit`, `constellationLayout`) · tests · documentación y ADR.
   No es hallazgo: la deuda de STATE, C.6b (retrato, transición, layout con datos a los lados), F5/F6. Entrega:
   `_claude/cadena/aud-c6a/auditoria.md`.
3. Corregirla entera en su PR. En paralelo (regla nueva de §13), el **esquema de C.6b**: medir antes el peso del
   retrato (datos ~150 KB aparte; el código, del margen de ~1,4 KB), la transición B en el shader, la foto fija del
   retrato, el layout de escritorio con los datos a los lados, la foto de la prueba al repo (`_claude/retrato/`).
4. Propuesta (sin VB, ya conviene): el PR pequeño del arranque en frío de `npm run visual`.
5. Víctor: pegar la descripción, la web y los topics de Cosmos en GitHub (`ABOUT_REPOS.md` del Proyecto de
   claude.ai); suavizar el CV y LinkedIn con el chat de mentor (y avisar para volver a copiar el PDF); redirigir el
   portfolio antiguo de Vercel a tortoisecode.dev; mirar las líneas de las constelaciones en su pantalla.

**Dudas abiertas:** D5 · analítica (F7). Tareas de Víctor: script de consola en el README de Chessmate (lo cita el
«Try it»).
**Limpieza manual del usuario:**
- Todo `_claude/tmp/` (copias del repo y archivos de las sesiones 34 a 39, entre ellas `s37/`, `s38/`, `s39/`, `c3/`
  y `aud-c2/`) y `_claude/lstree.txt`; `_claude/readme-originales/` (las capturas sin recortar) si ya no hacen falta;
  `fix-aud-c5.zip` en Descargas (ya no hace falta).
- Ramas locales ya fusionadas (todas menos `main`, entre ellas `feat/cosmos-complete`, `fix/aud-c5` y
  `feat/crew-file`): `git branch` para verlas y `git branch -D <rama>`.
- En el buzón se puede borrar todo lo de `_claude/cadena/tmp/` y, dentro de `_claude/cadena/hecho/`, los
  `arbol.tar.gz` y `cambio.diff` (nunca la carpeta `_claude/cadena/`, ni `hecho/2026-10-28/medir-fps.js` ni
  `hecho/2026-10-28/encuadre/`, que se reutilizan). Mover a mano `_claude/cadena/aud-f4-1/` a
  `_claude/cadena/hecho/2026-11-18/` y `_claude/cadena/aud-c2/` a `_claude/cadena/hecho/2026-11-21/` (y `aud-c5/` a
  `hecho/2026-11-22/` si desde aquí no se pudo). No borrar `_claude/diseno/`, `_claude/retrato/`, `_claude/naves/` ni
  `_claude/c3/`.
- En la raíz del repo, `playwright-report-firefox.zip` y la carpeta `test-results/`: borrarlos.
- Perfiles temporales de las pruebas sin WebGL: `$env:TEMP\cosmos-sin-webgl` y `$env:TEMP\cosmos-swiftshader`.
- Si alguna vez falla `npm ci` dentro de Docker: `docker volume rm cosmos-portfolio-visual-node-modules`.

**Bloqueos:** ninguno.
