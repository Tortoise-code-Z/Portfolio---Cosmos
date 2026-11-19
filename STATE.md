# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** **F4 · paso 3 (galaxia) hecho** (`main` en `d0c022a`: F4.3c en el PR #94) · siguiente:
**AUD-F4-3C a la Mesa** y **F4.4** (tortuga).

_Última actualización: 2026-11-19 (**CIERRE DE SESIÓN · 33**, empezada el 2026-11-18) · F4.3c: el panel de Skills y
las etiquetas de las estrellas encienden su constelación (ratón, foco, toque), con e2e de la interacción y del no
solapamiento sobre la página real; el e2e de WebKit pilló un fallo real (etiquetas que volvían ocultas) y quedó
corregido. 1389 unitarios; 234 e2e de Chromium en verde; CI en verde en los tres motores._

**Hecho esta sesión** (vivas S33 en `_claude/cadena/hecho/2026-11-19/decisiones-vivas-S33.md`):
1. **F4.3c** (PR #94, `d0c022a`; vivas #1–#4):
   - `uiStore`: `releaseActiveSkillGroup` (apaga solo si sigue encendido: manda el último gesto) y `selectSceneOn`.
   - Panel de Skills: con la escena encendida, cada grupo es enfocable (nombrado por su título) y lo encienden el
     ratón, el foco y un toque; un toque limpio fuera (`click` en la captura del documento) apaga; al desmontarse el
     viaje o apagarse la escena, se apaga. `data-hot` con el estilo de `:hover` y del foco.
   - El ratón llega a las etiquetas: `<main>` y el capítulo de Skills con `pointer-events: none`, el panel y los
     demás capítulos con `auto` (`ChapterSection` con `passThrough`). Con la sección sola no bastaba: lo hereda de
     `<main>`.
   - Etiquetas: `data-live` con el capítulo a más de 0,6 (`interactiveFrom`); solo esas reciben el puntero; el
     ratón o un toque encienden su grupo.
   - e2e nuevo `tests/e2e/constellations.spec.ts`; el test de Tab del viaje espera a la escena y cuenta los grupos;
     `hud` pasa a `tests/e2e/support/helpers.ts`. Peso +172 B (252 910 B).
2. **Arreglos del CI en el mismo PR** (vivas #5–#7): el HUD en español mide 251,3 px en el Chromium del CI (247 en
   local: sus glifos de la mono del sistema) y el raíl 154,02 en WebKit, así que `STAR_LABEL_KEEP_OUT` reserva 256 y
   158 (en reposo se siguen viendo todas a 1280×720 y 1440×900, EN y ES); los tests de `labelFit` leen las cifras de
   la configuración; el e2e de la vuelta espera cualquier etiqueta viva; el de Tab vuelve a mirar unos frames.
3. **Fallo real que pilló WebKit** (vivas #8–#10): tras misión rápida → ficha → Atrás, las etiquetas volvían
   colocadas pero ocultas. La escena solo olvidaba lo escrito si pintaba un frame con la capa desmontada, y con la
   misión rápida abierta a la ida y a la vuelta está en pausa todo ese rato (hueco del arreglo de AUD-F4-3B). Ahora
   cada etiqueta recuerda en qué elemento escribió (`WrittenLabel.element`); test unitario que desmonta y monta sin
   frame en medio (falla con el código viejo).

**Incidencias y lecciones:**
- **Zonas protegidas:** las herramientas remotas no escriben en `.husky/` ni en `.github/workflows/`. Esos archivos
  se dejan en `_claude/cadena/tmp/` y Víctor los copia con `Copy-Item` antes del commit.
- **Contenedor:** nodejs.org no está permitido; Node 24 se instala desde npm (`node-linux-x64@24.22.0`, enlazado en
  el `PATH`). Los navegadores de Playwright no se descargan, pero hay un Chrome en `/usr/bin/google-chrome`: con una
  config local (sin commitear) que lo pase como `executablePath`, los e2e de Chromium corren en el contenedor (234
  en ~7,5 min). Firefox, WebKit, `visual` y `stills` los pasa Víctor (o el CI).
- **La huella de las fotos fijas** cambia con cualquier cambio en `STILLS_SOURCES`, también de comentarios: tocar
  `scene/config`, `Constellations` o `CameraRig` pide `npm run stills` y commitear `stills.json`.
- **Cobertura y `noUncheckedIndexedAccess`:** los bucles por índice añaden ramas (`=== undefined`) que la cobertura
  del 90 % cuenta, y ESLint pide `for…of` en los recorridos simples: en el código por frame, `for…of` sobre arrays
  (sin copiarlos) y un contador cuando hace falta el índice.
- **e2e en Windows:** con Docker en marcha a la vez o el equipo cargado, la tanda completa saca timeouts en serie
  (las formas del worker pasan de 6 s, las páginas de 30 s). Lección: pasar antes los fallidos solos
  (`npm run e2e:chromium -- --last-failed`) y nada de Docker en paralelo.
- **Medidas a mano de la interfaz:** lo medido en Chromium en local no vale para el CI (los glifos de la mono del
  sistema cambian de ancho entre máquinas y motores). Reservar con holgura y que un e2e lo compare en los tres
  motores.
- **Un test que demuestra un arreglo tiene que recorrer el camino que fallaba:** el de AUD-F4-3B pintaba un frame en
  medio y no veía el caso de la pausa. Lo pilló el e2e en WebKit.
- **Trazas del CI:** las trazas de un fallo van en el artefacto `playwright-report-<motor>` de la ejecución (sección
  «Artifacts» de Actions). Víctor lo baja y lo deja en la carpeta; Claude no necesita acceso a GitHub (los
  registros de texto, «logs_*.zip», no traen trazas).
- ⚠ El texto exacto del aviso de GitHub al saltar la regla de `main` sigue sin apuntar (el doc dice «lo avisa como
  una regla saltada»): si Víctor lo ve en la salida de un push, ajustar `git-y-despliegue.md`.

**Deuda anotada:**
- **F4.5 · gravedad sobre la Tierra:** hoy la misma intensidad en todos los capítulos (F4.2); F4.5 la suaviza
  sobre la Tierra (`04-tierra.md`). Las constelaciones no son partículas: la gravedad no las mueve (F4.3b).
- **Colores repetidos:** `--color-flash` y `--color-singularity` ya tienen test de pareja con `scenePalette`
  (F4.1); `--gradient-space` sigue repitiendo a mano el violeta y el turquesa de la nebulosa.
- **F6 · Big Bang (ADR-030):** el `wdth` del `<h1>` cambia por frame mientras se carga o se baja por el hero:
  medir el CLS. Las variables `--_bang-*` van en `<html>`: cada escritura recalcula el estilo de toda la página
  mientras dura el hero; medirlo con Performance (y, si pesa, escribirlas más abajo).
- **WebKit (CI) · test de Tab** («1280×720: every focusable element… comes into view with Tab»): falló tres veces
  y pasó al reintento (la tercera, en S33, con el grupo de IA de Skills y «View project Chessmate»). Desde F4.3c,
  si lo enfocado no se ve, vuelve a mirarlo unos frames antes de darlo por tapado. Si vuelve a fallar, ya no es
  que se mida a mitad del desplazamiento: mirar `scroll-padding` en WebKit.
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
- **`npm run visual` en Docker:** la primera tanda de 4 capturas de escritorio se pasa de 30 s en `page.goto`
  (arranque en frío). En S33 se repitió dos veces seguidas en el equipo de Víctor; con `npm run visual --
  --workers=1` pasa. En la cola: un PR pequeño que limite los workers o dé más tiempo solo en `visual`.
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
- **Peso de la escena:** 252 910 B de 260 000 (ADR-032 y su nota; F4.3c pesó 172 B de su tope de 1 KB). Topes que
  quedan: F4.4 ≤ 2,5 KB y F4.5 ≤ 3 KB, ~1,6 KB de margen; cada paso apunta lo que pesó en `rendimiento.md`. Por
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
2. **AUD-F4-3C a la Mesa** (en la cola del tablero, con su mensaje): base `05b14ab` · hasta `d0c022a` (PR #94;
   vivas S33 hasta #10). Ámbitos: estilos e interfaz, lógica (`uiStore`), escena 3D, tests y docs.
3. Mientras se audita, un PR pequeño: `npm run visual` en Docker con menos workers o más tiempo para el arranque en
   frío (deuda «`npm run visual` en Docker»).
4. **F4.4 · Tortuga** (roadmap; ≤ 2,5 KB del chunk de la escena): esquema → VB.
5. Víctor: mirar las líneas de las constelaciones en su pantalla (deuda «líneas … en retina») y decidir.

**Dudas abiertas:** D5 · analítica (F7). Tareas de Víctor: script de consola en el README de Chessmate (lo cita el
«Try it»), CV en PDF EN/ES.
**Limpieza manual del usuario:**
- Ramas locales ya fusionadas (todas menos `main`): las de las listas de los cierres 25 y 29 (en
  `docs/_historial/estado/2026-10.md`) y de los cierres 30 y 31 (en `2026-11.md`) que sigan, más
  `chore/docs-direct-to-main`, `fix/aud-docs-main`, `fix/aud-f4-3b` y `feat/f4-3c-skills-interaction`
  (`git branch -D <rama>`). Para verlas:
  `git branch`.
- En el buzón se puede borrar todo lo de `_claude/cadena/tmp/` y, dentro de `_claude/cadena/hecho/`, los
  `arbol.tar.gz` y `cambio.diff` (nunca la carpeta `_claude/cadena/`, ni `hecho/2026-10-28/medir-fps.js` ni
  `hecho/2026-10-28/encuadre/`, que se reutilizan). Mover a mano `_claude/cadena/aud-f4-1/` a
  `_claude/cadena/hecho/2026-11-18/` (desde aquí da «Permission denied»).
- En la raíz del repo, los zips del CI de S33 (`logs_120249887476.zip` y `playwright-report-webkit.zip`): borrarlos
  (no van a git; ya están descomprimidos en `_claude/cadena/tmp/`).
- Perfiles temporales de las pruebas sin WebGL: `$env:TEMP\cosmos-sin-webgl` y `$env:TEMP\cosmos-swiftshader`.
- Si alguna vez falla `npm ci` dentro de Docker: `docker volume rm cosmos-portfolio-visual-node-modules`.

**Bloqueos:** ninguno.
