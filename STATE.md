# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** **Fase C · C.1, C.2 y C.3 hechos; AUD-C2 corregida** (`main` en `209573f`) · siguiente:
**AUD-C3** y el **lote de menores 7–18 de AUD-F4-3C**, cada uno en su PR; luego **C.4 · Mission control** (objetivo:
27 nov).

_Última actualización: 2026-11-21 (**CIERRE DE SESIÓN · 36**) · la galaxia de skills tiene 37 estrellas y los nombres
del CV (C.3); AUD-C2 corregida entera; desde ahora cada auditoría se corrige entera antes del paso siguiente._

**Hecho esta sesión** (vivas S36 en `_claude/cadena/hecho/2026-11-21/decisiones-vivas-S36.md`):
1. **C.3 · galaxia de skills** (PR #98, `7d7ecd1`): sale Bootstrap; entran GLSL (web), Next.js, Electron y NestJS
   (libraries), npm, pnpm y n8n (tools): 37 estrellas (8 + 12 + 11 + 6). «TanStack Query» y «Tailwind CSS» como el
   CV, también en la ficha de Chessmate (los `id` no cambian). AJAX no es estrella (va en la formación). Posiciones de
   una búsqueda en pantalla fuera del repo (`_claude/c3/`) con holgura sobre las reglas del test, cada grupo en su
   franja y orden; ninguna línea entra en el texto de sus extremos; a 390×844 se ven 13 etiquetas. Menores 19–24 de
   AUD-F4-3C. La escena, +127 B.
2. **AUD-C2 corregida entera** (PR #99, `209573f`): 13 recomendados, 10 menores, P1-A (no se reescribe el historial),
   P2-A (las viñetas se quedan), P3-A (fondo `Canvas` en alto contraste) y P4-A (fuera el número de los módulos).
   Tres fallos confirmados con un e2e que falla en la base: sin WebGL el raíl encontraba la foto fija
   (`data-still-chapter`); cambiar de idioma leyendo el Mission log llevaba a About (`selectActiveStop` +
   `stopHref`); con la letra al 200 % se cortaba el título. Además: el HUD se esconde leyendo un interludio; el cursor
   parpadea 4 veces; `TRANSMISSION_ENTRY` por margen de la ventana; tamaños a tokens; el test AA mide sobre el velo;
   `isPlainClick` en `lib/events` y las paradas del raíl en `content/chapters`; docs al día.
3. **Plan y método** (vivas #7–#10): las fechas del roadmap se quedan (C.3 25 nov, C.4 27, C.5 29, C.6 1 dic; C.7
   sin fecha); antes de recortar o mover algo para llegar, se le pregunta a Víctor. **Cada auditoría se corrige
   entera** (recomendados y menores) en su PR, antes del paso siguiente (`DEVELOPMENT_RULES.md` §13).
4. **AUD-C3** entregada por la Mesa: sin bloqueantes ni recomendados, 10 menores y ninguna pregunta. Sin decidir.

**Incidencias y lecciones:**
- **`npm run visual:update` sin argumentos borra todas las capturas antes de rehacerlas:** si una falla por tiempo,
  se queda borrada (S36). Con cualquier argumento no borra: usar `npm run visual:update -- --workers=1` y comparar con
  `md5sum` contra las de `main` para saber cuáles cambian de verdad.
- **Comprobar las auditorías antes de corregir:** los tres fallos «sospechados» de AUD-C2 se confirmaron escribiendo
  primero su e2e y corriéndolo sobre la base; el del texto tapado (umbral 0,2) no se reproduce en Chromium y se
  arregló igual.
- **Copiar archivos al equipo de Víctor:** `tar` no puede sobrescribir (borra antes de escribir, y borrar no está
  permitido): escribir con `cat origen > destino`, con los md5 de la base comprobados antes y los nuevos después.
- **Privacidad:** una lista de palabras «prohibidas» escrita en un repo público es la propia filtración; la guarda
  es la revisión del texto. Al archivar el cierre S35 en el historial se cambió la frase que las repetía.

**Deuda anotada:**
- **CI · WebKit a ~3 fps (S35):** la traza del CI de C.2 lo midió: WebKit sin GPU pinta unos 3 frames por segundo con
  la página entera, y la detonación pide 15 frames (la carga avanza como mucho 0,1 s por frame). Las esperas de
  detonación de `journey.spec.ts` van a 15 s (`DETONATE_TIMEOUT_MS`). No dice nada de un móvil real: medir en un
  iPhone (F6) que el Mission log (cursor que parpadea siempre, líneas de barrido, velo) no pese.
- **AUD-F4-3C-2 · iPhone real:** el toque en el margen de la escena solo lo cubre el e2e con `touchscreen`; mirarlo
  en un iPhone (si no hay móvil a mano, en F6).
- **C.7 · Naves** (idea aprobada sin calendario): estudio, versiones de la prueba y lecciones del shader en
  `docs/02-experiencia/transiciones-naves.md` (manda la versión 8: se lee a pantalla completa). La prueba es el
  artefacto privado «Naves · prueba»; copia del código en `_claude/naves/`. Al construir: ADR-035 y medir el peso
  (~1,6 KB de margen en la escena tras F4.4 y F4.5).
- **Fase C · privacidad de Studios Demanzon:** el sitio y el repo no enseñan qué es el producto de la empresa ni
  cómo está construido: solo herramientas, para qué y lo hecho (nota de ADR-034; `experiencia.md` → «Regla de
  privacidad», sin ejemplos desde AUD-C2: una lista en un repo público sería la filtración). Las viñetas y la bio van
  suavizadas; se ha pedido lo mismo para el CV y LinkedIn en `trabajo-ofertas` (chat de mentor). El historial de git
  conserva la descripción vieja: se acepta (AUD-C2-P1-A). Cuando cambie el CV, volver a copiar el PDF a
  `public/`. Vale también para la ficha, el README y las capturas.
- **Fase C · lo provisional de Mission control y Crew file** (docs de cada sección → «Pendiente»): redacción
  EN/ES; nivel de inglés visible o no; cifras de Mission control sacadas del repo en el build (o redondeadas), nunca
  a mano. El Mission log quedó cerrado en C.2.
- **Fase C · colores de canal:** el ámbar ya es token con el contraste AA medido (C.2, `styles.test.ts`); el azul
  y el verde siguen como propuesta de `design-system.md` → «Transmisiones» y pasan a tokens en C.4 y C.6, con su AA.
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
- **e2e en el equipo de Víctor (S32):** la primera tanda completa de Chromium en Windows sacó dos carreras de carga
  que pasaban solas (el recuento de chunks de `scene.spec.ts`, que contaba la descarga tardía de la página del
  `beforeEach`, y el espaciado del nombre en `journey.spec.ts`, que tardaba más de 5 s con pocos frames). Blindadas
  en el PR #93 (`about:blank` antes de apuntar; `expect.poll` a 15 s). Si sale otra así, mirar primero si pasa sola.
- **F6 · meta description de Cosmos (AUD-F3-CIERRE-P1, A):** es el `summary` tal cual, 220 caracteres (EN) y 228
  (ES); los buscadores cortan hacia 155–160. Decidir en F6 si se acorta o se añade un `metaDescription` (roadmap F6).
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
  (`calidad.md` → «Regresión visual»). En la cola: un PR pequeño
  que dé más tiempo o caliente el servidor solo en `visual`.
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
- **Peso de la escena:** 253 038 B de 260 000 (ADR-032 y sus notas; C.3 pesó 127 B y AUD-C2, 1 B). Topes que
  quedan: F4.4 ≤ 2,5 KB y F4.5 ≤ 3 KB, ~1,46 KB de margen; cada paso apunta lo que pesó en `rendimiento.md`. Por
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


**Siguiente paso (próxima sesión, conversación nueva):**
1. Arrancar con `session-start` (y la skill `taller`).
2. **AUD-C3** (`_claude/cadena/aud-c3/auditoria.md`; base `c053dc8` · hasta `7d7ecd1`): Víctor pega el mensaje de
   la Mesa; se corrige entera (viva S36 #8) en `fix/aud-c3`.
3. **Lote de menores 7–18 de AUD-F4-3C** y el resto del 23 (`_claude/cadena/hecho/2026-11-21/aud-f4-3c/auditoria.md`),
   en su PR. El orden entre 2 y 3 lo decide Víctor (los dos tocan Skills y las constelaciones: uno detrás del otro).
4. **C.4 · Mission control** (objetivo: 27 nov): esquema → VB. Después C.5 (29 nov) y C.6 (1 dic); C.7 si queda
   tiempo, si no en el pulido; luego F4.4.
5. Propuesta sin VB: un PR pequeño para el arranque en frío de `npm run visual` (deuda).
6. Víctor: suavizar el CV y LinkedIn con el chat de mentor (y avisar para volver a copiar el PDF); redirigir el
   portfolio antiguo de Vercel a tortoisecode.dev (un `vercel.json` con un 308 en ese proyecto); mirar las líneas de
   las constelaciones en su pantalla (deuda «líneas … en retina»).

**Dudas abiertas:** D5 · analítica (F7). Tareas de Víctor: script de consola en el README de Chessmate (lo cita el
«Try it»).
**Limpieza manual del usuario:**
- Todo `_claude/tmp/` (copias del repo y diffs de las sesiones 34 a 36, entre ellas `c3/` y `aud-c2/`) y
  `_claude/lstree.txt`: borrarlos.
- Ramas locales ya fusionadas (todas menos `main`, entre ellas `feat/c3-skills-galaxy` y `fix/aud-c2`):
  `git branch` para verlas y `git branch -D <rama>`.
- En el buzón se puede borrar todo lo de `_claude/cadena/tmp/` y, dentro de `_claude/cadena/hecho/`, los
  `arbol.tar.gz` y `cambio.diff` (nunca la carpeta `_claude/cadena/`, ni `hecho/2026-10-28/medir-fps.js` ni
  `hecho/2026-10-28/encuadre/`, que se reutilizan). Mover a mano `_claude/cadena/aud-f4-1/` a
  `_claude/cadena/hecho/2026-11-18/` y `_claude/cadena/aud-c2/` a `_claude/cadena/hecho/2026-11-21/` (desde aquí da
  «Permission denied»). No borrar `_claude/diseno/`, `_claude/retrato/`, `_claude/naves/` ni `_claude/c3/` (el script
  de la búsqueda de posiciones: sirve para recolocar las estrellas otra vez).
- En la raíz del repo, si siguen, los zips de los informes del CI (`playwright-report-*.zip`): borrarlos.
- Perfiles temporales de las pruebas sin WebGL: `$env:TEMP\cosmos-sin-webgl` y `$env:TEMP\cosmos-swiftshader`.
- Si alguna vez falla `npm ci` dentro de Docker: `docker volume rm cosmos-portfolio-visual-node-modules`.

**Bloqueos:** ninguno.
