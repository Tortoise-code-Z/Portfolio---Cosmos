# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** **F4 · paso 3 (galaxia) a medias** (`main` en `7ebff3b`: F4.3a en PR #87, F4.3b en PR #88,
corrección de AUD-F4-3A en PR #89) · siguiente: lanzar **AUD-F4-3B** y hacer **F4.3c** (panel, táctil y e2e).

_Última actualización: 2026-11-18 (**CIERRE DE SESIÓN · 31**, empezada el 2026-11-01) · AUD-F4-1 y AUD-F4-2
corregidas; las constelaciones de la galaxia en la escena, con sus etiquetas; AUD-F4-3A corregida. 1335 unitarios
y 219 e2e de Chromium en verde._

**Hecho esta sesión** (vivas S31 en `_claude/cadena/hecho/2026-11-18/decisiones-vivas-S31.md`):
1. **AUD-F4-1** corregida (PR #85, `6e89a84`; vivas #1–#6): P1 medido (con el destello del scroll parado, el texto
   del hero quedaba a 1,1–2:1) → el destello del scroll es un golpe que se apaga solo y se rearma arriba
   (**ADR-031**). El bucle del DOM persigue `m` también pasado el hero; `setScrollTarget` ignora lo que no es
   finito; contratos de CSS anclados a su regla; parejas del tope del paso y del `wdth` de reposo; docs.
2. **AUD-F4-2** corregida (PR #86, `de51d37`; vivas #7–#12): los e2e de la gravedad recargan de verdad, exigen la
   nebulosa y miran una celda de control (la mutación `uGrav = 0` los hace fallar); docs; contraste medido en Alto
   con la gravedad (panel ≥ 6,2:1, raíl ≥ 4,66:1) en `design-system.md` → «Garantía de lectura».
3. **F4.3a** (PR #87, `94c1012`; vivas #13–#17): **ADR-032** (chunk de la escena a 260 KB, con topes por paso),
   `scene/math/projection` (comparada con Three) y `scene/config/constellationLayout` (posiciones buscadas en
   pantalla a 1280×720; test de reglas y de no solapamiento).
4. **F4.3b** (PR #88, `4effc0f`; vivas #18–#23): `scene/Constellations` (estrellas con halo de tamaño fijo y
   líneas), `scene/ConstellationLabels` (capa del DOM en `body`, `--z-labels`; textos de `SceneMount` solo en el
   viaje; `fitLabels` oculta las que no caben en cualquier tamaño y `m`), `uiStore.activeSkillGroup`, `SceneFrame`
   con la pose de la cámara, paleta de constelaciones. Fotos y captura de la galaxia rehechas.
5. **AUD-F4-3A** corregida (PR #89, `7ebff3b`; vivas #24–#26): `react-query` y las estrellas de `ai` en su fila
   (figuras reconocibles; test en pantalla: ninguna línea a < 12 px de otra estrella ni tachando una etiqueta);
   `STAR_LABEL_KEEP_OUT` con test de pareja contra los tokens; tokens en px para la letra de las etiquetas
   (`--text-star-label`); peso medido con `source-map-explorer` y explicado en ADR-032 (252 594 B).

**Incidencias y lecciones:**
- **Claves del buzón en docs:** el pre-push falló (`code-references.test.ts`) porque escribí «AUD-F4-3A» en dos
  docs después de pasar `npm run check`. Lección: tras el último cambio, otra vez `npm run check`, aunque sea de
  docs.
- **Reglas de los hooks (compilador de React):** no dejan cambiar props ni valores de `useMemo` dentro de
  `useFrame`: el trabajo de cada frame va en funciones fuera del componente (`aimCamera`, `stepConstellations`).
- **Peso por paquete:** mi primera cuenta casera sobre los mapas de fuente se quedaba corta (three 152,7 KB frente
  a 167,9). La buena: `source-map-explorer --gzip --no-border-checks`.
- **Posiciones de las constelaciones:** las regiones del doc eran de la cámara del prototipo y no cabían (~510×285
  px para 31 etiquetas): se buscaron en pantalla y se llevaron a la escena. Las de arriba flotan más allá del disco
  de la galaxia (escrito en `constelaciones-y-placas.md`).
- **Contenedor:** el árbol se trae por `tar` (sin `node_modules`, `.env` de `.env.example`, `react-router
  typegen`) y vuelve con md5 de la base y de cada archivo; los cambios se escriben con `cat` (el equipo no deja
  borrar, y `tar` sobre archivos existentes falla).

**Deuda anotada:**
- **F4.5 · gravedad sobre la Tierra:** hoy la misma intensidad en todos los capítulos (F4.2); F4.5 la suaviza
  sobre la Tierra (`04-tierra.md`). Las constelaciones no son partículas: la gravedad no las mueve (F4.3b).
- **Colores repetidos:** `--color-flash` y `--color-singularity` ya tienen test de pareja con `scenePalette`
  (F4.1); `--gradient-space` sigue repitiendo a mano el violeta y el turquesa de la nebulosa.
- **F6 · Big Bang (ADR-030):** el `wdth` del `<h1>` cambia por frame mientras se carga o se baja por el hero:
  medir el CLS. Las variables `--_bang-*` van en `<html>`: cada escritura recalcula el estilo de toda la página
  mientras dura el hero; medirlo con Performance (y, si pesa, escribirlas más abajo).
- **WebKit (CI) · test de Tab** («1280×720: every focusable element… comes into view with Tab»): ha fallado dos
  veces y pasado al reintento («View project Cosmos», el email de Contacto). No parece de F4 (pasado el hero el
  bucle del Big Bang no escribe nada); a la tercera, mirar si el foco se mide a mitad de un scroll suave.
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
- **F4.3c · lo que mide la escena a mano:** `STAR_LABEL_KEEP_OUT` lleva medidos el ancho del raíl (154 en
  escritorio con el español, 52 por debajo) y el HUD (247 × 62); el panel, la barra y el alto del raíl ya salen de
  los tokens (test de pareja). El e2e de F4.3c tiene que compararlos con la página real.
- **F4.3 · etiquetas de las estrellas:** sobre el núcleo brillante de la galaxia se leen peor (decorativas,
  `aria-hidden`; la lista accesible es la del panel). A 390×844 se ven ~13 de 31. Que lo mire AUD-F4-3B.
- **`npm run visual` en Docker:** la primera tanda de 4 capturas de escritorio puede pasarse de 30 s en `page.goto`
  (arranque en frío; en el contenedor, 15–19 s también con `main`): repetir. Si se repite, valorar menos workers o
  más tiempo solo en `visual`. `visual:update` rehace todas y puede meter ruido (≤ 4/255) en capturas que no
  cambian (`chapter-0-start`, `chapter-4-contact`): devolverlas con `git restore` antes del commit.
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
- **Peso de la escena:** 252 594 B de 260 000 (ADR-032). Topes que quedan: F4.4 ≤ 2,5 KB y F4.5 ≤ 3 KB, ~2 KB de
  margen; cada paso apunta lo que pesó en `rendimiento.md`. Por paquete se mide con
  `npx source-map-explorer <chunk>.js --gzip --no-border-checks` sobre un build con `sourcemap: true` (sin commitear).
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
- Grupos de Skills enfocables (`tabindex`) en **F4.3c**, cuando enciendan su constelación.
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
2. **AUD-F4-3B** a la Mesa: base `94c1012` · hasta `7ebff3b` (F4.3b, PR #88, y la corrección de AUD-F4-3A, PR #89;
   vivas S31 #18–#26).
3. **F4.3c** (vivas S31 #15 y #18): grupos de Skills enfocables; ratón, foco y toque escriben
   `activeSkillGroup` (tocar otro cambia, tocar fuera apaga); en Skills la sección deja pasar el ratón y solo el
   panel lo recoge (F43-2-A); las etiquetas reciben el ratón con presencia > 0,6 y marcan su grupo; e2e de la
   interacción y de no solapamiento sobre la página real (compara `STAR_LABEL_KEEP_OUT`). Después, F4.4 (tortuga).

**Dudas abiertas:** D5 · analítica (F7). Tareas de Víctor: script de consola en el README de Chessmate (lo cita el
«Try it»), CV en PDF EN/ES.
**Limpieza manual del usuario:**
- Ramas locales ya fusionadas (todas menos `main`): las de las listas de los cierres 25 y 29 (en
  `docs/_historial/estado/2026-10.md`) y del 30 (en `2026-11.md`) que sigan, más `fix/aud-f4-1`, `fix/aud-f4-2`,
  `fix/aud-f4-3a`, `feat/f4-3a-constellation-layout`, `feat/f4-3b-constellations`, `docs/session-close-2026-11-01`
  y la de este cierre, `docs/session-close-2026-11-18`, cuando se fusione (`git branch -D <rama>`). Para verlas:
  `git branch`.
- En el buzón se puede borrar todo lo de `_claude/cadena/tmp/` y, dentro de `_claude/cadena/hecho/`, los
  `arbol.tar.gz` y `cambio.diff` (nunca la carpeta `_claude/cadena/`, ni `hecho/2026-10-28/medir-fps.js` ni
  `hecho/2026-10-28/encuadre/`, que se reutilizan).
- Perfiles temporales de las pruebas sin WebGL: `$env:TEMP\cosmos-sin-webgl` y `$env:TEMP\cosmos-swiftshader`.
- Si alguna vez falla `npm ci` dentro de Docker: `docker volume rm cosmos-portfolio-visual-node-modules`.

**Bloqueos:** ninguno.
