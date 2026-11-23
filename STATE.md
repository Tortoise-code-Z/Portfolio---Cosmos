# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** **Fase C · C.1–C.6 hechos y todas sus auditorías corregidas** (`main` en `1b8a187`) · siguiente:
**cierre de la fase C**: lanzar AUD-C-CIERRE a la Mesa, Lighthouse a mano y corregir la auditoría entera. C.7 (Naves)
queda fuera del cierre.

_Última actualización: 2026-11-23 (**CIERRE DE SESIÓN · 41**) · AUD-C6B corregida entera (PR #111) y el plan del
cierre de la fase C decidido._

**Hecho esta sesión** (vivas S41 en `_claude/cadena/hecho/2026-11-23/decisiones-vivas-S41.md`):
1. **AUD-C6B corregida entera** (PR #111, `1b8a187`; 7 recomendados, 22 menores y 2 preguntas, con las
   recomendaciones; P1-A, P2-A, 3-A; 5-A tras verlo Víctor en Brave). Entre otras:
   - **Shader:** el haz sin `pow` de base negativa (un test vigila todos los `pow(` y ata `LAST_M` a la última forma);
     el haz en bucle entra fundido; el fundido del busto por la altura (`PORTRAIT_FADE_H`); giro acotado; tick acotado.
   - **El retrato que llega tarde** (salto por el raíl, `/#crew-file`): `uPor` sube en 0,6 s (`PORTRAIT_FADE_IN_S`)
     y la Tierra pasa a retrato con el retraso del morph y el haz; sin retrato, el 4→5 no hincha la Tierra.
   - **Carga:** un solo encargo por visita (`usePortrait`), `pPor` en `useLayoutEffect` y `uPor` leído de la geometría,
     `data-portrait="painted"` al pintarlo entero, el worker responde el fallo al contestar.
   - **Forma:** paredes del contorno hacia dentro (sin pelillos ni pinchos); canal R de 3 a 255 contra el ruido de
     Brave (`PORTRAIT.depthFloor`; `pack.py` al día; el PNG rehecho sin la foto original); imágenes sin metadatos
     (−11,5 KB, con test); `PORTRAIT_FRAME` desde constantes.
   - **Crew file desde lg:** la pista del centro bajo el visor (pistas asimétricas), líneas guía hasta el marco,
     título con `--text-crew-title` (variable nueva `--_title-size` de `Transmission`), **el email abajo a la izquierda
     y «Download CV» a la derecha** (en la pista derecha el email se partía; Víctor lo vio en las capturas). En una
     columna, el visor con la proporción del retrato (`--visor-ratio`) y centrado con él.
   - **Tests y docs:** e2e de la degradación con el retrato en vuelo (falla en la base), del layout del Crew file y
     presupuesto de las imágenes; arquitectura, docs de la escena, calidad, Crew file, design system, ADR-032/034.
     Peso: +252 B (254 340 B).
2. **Plan del cierre de la fase C** (vivas S41 #27–#29): CIERRE-C-0-A (sin C.7), 1-A (sin versión: `v0.3.0` al acabar
   F4.5), 2-A (auditoría de cierre a la Mesa), 3-B (PageSpeed en F6). Roadmap, `transiciones-naves.md` y ADR-034 al
   día. AUD-C-CIERRE preparada **sin lanzar** (mensaje abajo y en la cola del tablero; la copia del CV para la Mesa en
   `_claude/cadena/aud-c-cierre/CV_base_EN.md`).

**Incidencias y lecciones:**
- **Los binarios que pasan por el contenedor sueltos pueden volver firmados** (C2PA, ~5,7 KB por imagen: así llegaron
  las del retrato en C.6b). Ahora lo rechaza `shapeContract.test.ts`; los binarios van dentro de un `tar` comprobado con
  sha256, y las imágenes se miran en el equipo de Víctor tras copiarlas.
- **En el equipo de Víctor, `tar` no puede sobrescribir** (sin permiso de borrar: «File exists»): se extrae a una
  carpeta aparte y se copia con `cat` sobre cada archivo, comprobando antes que los de destino son los de la base.
- **La fórmula de la Mesa para `LAST_M` iba desplazada en uno** (`length − 1`): es `length − 2 + 0,999`. Contrastar
  cada arreglo propuesto con el código antes de copiarlo.
- **Un unitario con `rerender` no ve un frame colado entre el render y los efectos** (`act` corre también los
  efectos pasivos): ese orden lo dan `useLayoutEffect` y leer el estado de la geometría, no el test.
- **Centrar con la ventana en un e2e:** comparar con el lienzo (o la foto fija), no con `clientWidth`
  (`scrollbar-gutter: stable` lo descuadra 7,5 px).
- **Contenedor (S41):** como en S40 (Node 24 del paquete npm, Chromium enlazado como 1248 en `~/pwb`, `.env` desde
  `.env.example`, `git init` local, el árbol con `git archive` del commit de `main`). Docker no arranca: `stills` y
  `visual` en el equipo de Víctor; las fotos fijas sin Docker solo para mirar.

**Deuda anotada:**
- **CI · WebKit a ~3 fps (S35):** la traza del CI de C.2 lo midió: WebKit sin GPU pinta unos 3 frames por segundo con
  la página entera, y la detonación pide 15 frames (la carga avanza como mucho 0,1 s por frame). Las esperas de
  detonación de `journey.spec.ts` van a 15 s (`DETONATE_TIMEOUT_MS`). No dice nada de un móvil real: medir en un
  iPhone (F6) que el Mission log (cursor que parpadea siempre, líneas de barrido, velo) no pese.
- **AUD-F4-3C-2 · iPhone real:** el toque en el margen de la escena solo lo cubre el e2e con `touchscreen`; mirarlo
  en un iPhone (si no hay móvil a mano, en F6).
- **C.7 · Naves** (fuera del cierre de la fase C, viva S41 #27: después de F4.5 o en el pulido): estudio, versiones
  de la prueba y lecciones del shader en `docs/02-experiencia/transiciones-naves.md` (manda la versión 8: se lee a
  pantalla completa). La prueba es el artefacto privado «Naves · prueba»; copia del código en `_claude/naves/`. Al
  construir: su ADR-037 (mapa de formas `uFrom`/`uTo`/`uT`, que obliga a rehacer sobre él lo del retrato atado a
  `m − 4`, la dispersión de `k > 3.5`, `LAST_M` y la subida de `uPor`) y el peso: el margen libre es de ~0,16 KB
  tras AUD-C6B, así que su ADR subirá el límite, con los números reales de F4.4 y F4.5.
- **Fase C · privacidad de Studios Demanzon:** el sitio y el repo no enseñan qué es el producto de la empresa ni
  cómo está construido: solo herramientas, para qué y lo hecho (nota de ADR-034; `experiencia.md` → «Regla de
  privacidad», sin ejemplos desde AUD-C2: una lista en un repo público sería la filtración). Las viñetas y la bio van
  suavizadas; se ha pedido lo mismo para el CV y LinkedIn en `trabajo-ofertas` (chat de mentor). El historial de git
  conserva la descripción vieja: se acepta (AUD-C2-P1-A). Cuando cambie el CV, volver a copiar el PDF a
  `public/`. Vale también para la ficha, el README y las capturas.
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
- **Peso de la escena:** 254 340 B de 260 000 (ADR-032 y sus notas; medido commit a commit: tras S38 253 071,
  C.5 −2, C.6a +52, C.6b +967, AUD-C6B +252). Quedan 5 660 B: F4.4 ≤ 2,5 KB y F4.5 ≤ 3 KB, y ~0,16 KB de margen. Cada paso apunta lo
  que pesó en `rendimiento.md`. Por paquete se mide con `npx source-map-explorer <chunk>.js --gzip
  --no-border-checks` sobre un build con `sourcemap: true` (sin commitear).
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
2. **Lanzar AUD-C-CIERRE** (si Víctor no lo ha hecho ya; el mensaje está en la cola del tablero) y apuntarla
   `[lanzado]`.
3. **Lighthouse a mano** del cierre de C (`calidad.md` → «Mediciones»: tres pasadas y la mediana en `/`, `/es`,
   `/projects/cosmos`, una ficha en ES y la 404; versión exacta de Lighthouse), en el contenedor sobre el build, y
   apuntarlo en `calidad.md` («Cierre de la fase C»).
4. **Corregir AUD-C-CIERRE entera** en su PR; después, el commit de docs del cierre (roadmap con la fase C hecha).
   Sin versión ni etiqueta (CIERRE-C-1-A). Luego, **F4.4**.
5. Víctor: mirar `/#crew-file` en Brave en producción (AUD-C6B-5); pegar la descripción, la web y los topics de
   Cosmos en GitHub (`ABOUT_REPOS.md` del Proyecto de claude.ai); suavizar el CV y LinkedIn con el chat de mentor (y
   avisar para volver a copiar el PDF); redirigir el portfolio antiguo de Vercel a tortoisecode.dev; mirar las líneas
   de las constelaciones en su pantalla; revisar los textos del Crew file y, si la quiere, una captura del Crew file
   para el README.

**Dudas abiertas:** D5 · analítica (F7). Tareas de Víctor: script de consola en el README de Chessmate (lo cita el
«Try it»).
**Limpieza manual del usuario:**
- Todo `_claude/tmp/` (copias del repo y archivos de las sesiones 34 a 41, entre ellas `s37/` a `s41/`, `c3/` y
  `aud-c2/`) y `_claude/lstree.txt`; `_claude/readme-originales/` si ya no hacen falta.
- Ramas locales ya fusionadas (todas menos `main`, entre ellas `feat/portrait`, `fix/aud-c6a`, `fix/visual-cold-start`
  y `fix/aud-c6b`): `git branch` para verlas y `git branch -D <rama>`.
- En el buzón se puede borrar todo lo de `_claude/cadena/tmp/` y, dentro de `_claude/cadena/hecho/`, los
  `arbol*.tar.gz` y los `*.diff` (nunca la carpeta `_claude/cadena/`, ni `hecho/2026-10-28/medir-fps.js` ni
  `hecho/2026-10-28/encuadre/`). Mover a mano a `hecho/` lo que no se pudo desde aquí (`aud-f4-1/` a `hecho/2026-11-18/`,
  `aud-c2/` a `hecho/2026-11-21/` si siguen fuera). No borrar
  `_claude/diseno/`, `_claude/retrato/`, `_claude/naves/` ni `_claude/c3/`.
- En la raíz del repo, `playwright-report-firefox.zip`, `playwright-report-firefox (1).zip` y `test-results/`.
- Perfiles temporales de las pruebas sin WebGL: `$env:TEMP\cosmos-sin-webgl` y `$env:TEMP\cosmos-swiftshader`.
- Si alguna vez falla `npm ci` dentro de Docker: `docker volume rm cosmos-portfolio-visual-node-modules`.

**Bloqueos:** ninguno.
