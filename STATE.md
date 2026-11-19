# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** **Fase C planificada y diseñada** (`main` en `22f8ec7`; ADR-034) · siguiente: **C.1 · alinear el
contenido con el CV** (objetivo: 20 nov) y **AUD-F4-3C a la Mesa**.

_Última actualización: 2026-11-19 (**CIERRE DE SESIÓN · 34**) · parón en F4 para la búsqueda de empleo: el CV que
Víctor envía desde el 25 nov enlaza al portfolio y este lo contradecía (948 h, email antiguo, sin experiencia). Plan
de la fase C con su ADR, prueba del retrato en partículas y diseño de las secciones nuevas («transmisiones»)
aprobados. Solo docs en el repo; nada de código._

**Hecho esta sesión** (vivas S34 en `_claude/cadena/hecho/2026-11-19/decisiones-vivas-S34.md`):
1. **Análisis de `trabajo-ofertas`** (proyecto de claude.ai, fuente de verdad sobre Víctor: `HANDOFF_PORTFOLIO.md`,
   `perfil/PERFIL.md`, `cv/CV_base_EN.md`) frente a `src/content/`. Decisiones de Víctor (vivas #3–#6): titular
   «Frontend Developer» (se queda); skills: sale Bootstrap, entran Next.js, NestJS, Electron, n8n, npm, pnpm y GLSL,
   se quedan Vitest, Playwright y Virtual machines; el CV en inglés para EN y ES; bio con su origen (Física 2019,
   Python; vuelta en 2022); AstroHub usa `password_hash()`.
2. **Fase C en el roadmap y ADR-034** (commit `22f8ec7`): C.1 alinear con el CV → C.2 interludios + Mission log →
   C.3 galaxia de skills → C.4 Mission control → C.5 Cosmos completo → C.6 epílogo con el retrato; F4.4, F4.5 y F5
   después.
3. **Prueba del retrato** (artefacto privado; scripts y datos en `_claude/retrato/`): Depth Anything V2 (ONNX) sobre
   una foto → color + profundidad + contornos (~150 KB). Elegido: holograma «Escáner» con fallos de señal, ~135 k
   partículas, robot ↔ realista 74 %, relieve 44 %.
4. **Diseño de las secciones nuevas** (lienzo privado; copia y capturas PNG en `_claude/diseno/`): tras tres direcciones y una
   mezcla, aprobadas las «transmisiones» a pantalla completa por canal de color: Mission log ámbar, Mission control
   azul, Crew file verde; escritorio y móvil, encajadas entre capturas reales de los capítulos. Spec:
   `docs/02-experiencia/capitulos/interludio-1-mission-log.md`, `interludio-2-mission-control.md`, `05-crew-file.md`;
   `docs/03-diseno/design-system.md` → «Transmisiones»; nota en ADR-034; Mapa de `CLAUDE.md`.
5. **`trabajo-ofertas`** (permisos del handoff): `STATE.md` («Para revisar por el chat de mentor» y «Chat del
   portfolio: estado») y una entrada en `BITACORA.md`.

**Incidencias y lecciones:**
- **Push del cierre parado por el pre-push (bien parado):** un commit intermedio añadió por error
  `playwright-report-webkit.zip` (un `git add` sin la lista exacta) y el siguiente lo borró; el hook mira commit a
  commit (`--each`), así que lo frenó aunque el resultado final fuera solo docs. Se rehízo con `git reset --soft` al
  último commit publicado y un único commit. Lección: siempre `git add` con la lista exacta de archivos.
- **Información de terceros:** un esquema del producto de la empresa de las prácticas (deducido del CV) llegó al
  boceto; Víctor lo paró: es privado del cliente. Lección: en lo público, solo lo que ya dice el CV; nada de cómo
  está hecho el producto de otro.
- **Retrato desde una foto:** el filtro bilateral con umbral fino hace terrazas en la profundidad (mejor un
  gaussiano dentro de la máscara); hay que desproyectar cada punto con la cámara para que de frente no se abran
  grietas; con mezcla normal, los puntos tienen que escribir profundidad (o lo de atrás tapa lo de delante); en
  mezcla aditiva, alfa ~0,3. El modelo base de Depth Anything da bastante más detalle que el pequeño.
- **Bocetos con capturas reales:** las de `tests/visual/__screenshots__/desktop/` sirven tal cual para encajar
  diseños nuevos en el viaje.
- **Contenedor:** el build del repo corre con Node 24 instalado desde npm (`node-linux-x64@24.22.0`); GitHub
  Releases es accesible (modelos ONNX), Hugging Face y jsdelivr no.

**Deuda anotada:**
- **Fase C · privacidad de Studios Demanzon:** el sitio no enseña cómo está construido el producto de la empresa
  (arquitectura ni conexiones): solo herramientas, para qué y las viñetas del CV (nota de ADR-034). Vale también
  para la ficha, el README y las capturas.
- **Fase C · lo provisional del diseño** (docs de cada sección → «Pendiente»): redacción EN/ES de las tres
  transmisiones; viñetas acortadas del registro contra el CV; frase del CTO solo con su permiso; nivel de inglés
  visible o no; cifras de Mission control sacadas del repo en el build (o redondeadas), nunca a mano.
- **Fase C · colores de canal:** los valores de `design-system.md` → «Transmisiones» son propuesta; pasan a tokens
  en C.2 con el contraste AA medido sobre su fondo.
- **C.6 · retrato:** sale de una sola foto (relieve, no cabeza completa): giro limitado (~±25°). Mejora posible: un
  escaneo 3D con una app del móvil (KIRI Engine o Scaniverse) y convertir el modelo a partículas. La foto y los
  datos del retrato no entran al repo hasta C.6 (copia y scripts en `_claude/retrato/`).
- **`.gitignore`:** lo privado vive en `_claude/` (excluido con `.git/info/exclude`). Si Víctor lo quiere también
  explícito en `.gitignore`, va en el PR de C.1 (no es solo docs, ADR-033).
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
2. **C.1 · alinear el contenido con el CV** (objetivo: 20 nov): esquema → VB. Primero, la bio nueva EN/ES para que
   Víctor la apruebe (Física 2019 con Python, vuelta en 2022, el curso de 975 h con Distinction, las prácticas, la IA
   como acelerador). Toca `src/content/profile.ts`, `projects/astrohub.ts`, `projects/cosmos.ts`,
   `public/Victor_Perez_CV.pdf` (copia de `trabajo-ofertas/cv/`) y `docs/01-contenido/`; tests y e2e que esperan 948
   o el email antiguo; `npm run visual:update`.
3. **AUD-F4-3C a la Mesa** (en la cola del tablero), en un chat nuevo:
   `Usa la skill mesa. Encargo para la Mesa · AUD-F4-3C · base 05b14ab · hasta d0c022a` — Audita F4.3c (PR #94).
   Especificación: `02-galaxia.md`, `constelaciones-y-placas.md`, roadmap F4.3 y vivas S33 #1–#10. Un auditor por
   ámbito: estilos e interfaz · lógica (uiStore) · escena 3D · tests · documentación y ADR. No es hallazgo: deuda de
   STATE.md, el roadmap (incluida la fase C: las skills y sus estrellas cambian en C.3) y lo decidido en las vivas.
   Entrega: `_claude/cadena/aud-f4-3c/auditoria.md`.
4. Después, C.2 a C.6 en su orden (C.3 tras corregir AUD-F4-3C); luego F4.4 · Tortuga.
5. Víctor: preguntar a Ángel (CTO de Studios Demanzon) por la frase de su carta; redirigir el portfolio antiguo de
   Vercel a tortoisecode.dev (un `vercel.json` con un 308 en ese proyecto); mirar las líneas de las constelaciones en
   su pantalla (deuda «líneas … en retina»).

**Dudas abiertas:** D5 · analítica (F7). Tareas de Víctor: script de consola en el README de Chessmate (lo cita el
«Try it»). ~~CV en PDF EN/ES~~: el inglés sirve para los dos (C.1).
**Limpieza manual del usuario:**
- `_claude/tmp/repo-s34.tgz` (copia del repo para el build del contenedor, 18 MB): borrarlo.
- Ramas locales ya fusionadas (todas menos `main`): las de las listas de los cierres 25 y 29 (en
  `docs/_historial/estado/2026-10.md`) y de los cierres 30 y 31 (en `2026-11.md`) que sigan, más
  `chore/docs-direct-to-main`, `fix/aud-docs-main`, `fix/aud-f4-3b` y `feat/f4-3c-skills-interaction`
  (`git branch -D <rama>`). Para verlas: `git branch`.
- En el buzón se puede borrar todo lo de `_claude/cadena/tmp/` y, dentro de `_claude/cadena/hecho/`, los
  `arbol.tar.gz` y `cambio.diff` (nunca la carpeta `_claude/cadena/`, ni `hecho/2026-10-28/medir-fps.js` ni
  `hecho/2026-10-28/encuadre/`, que se reutilizan). Mover a mano `_claude/cadena/aud-f4-1/` a
  `_claude/cadena/hecho/2026-11-18/` (desde aquí da «Permission denied»). No borrar `_claude/diseno/` ni
  `_claude/retrato/` (privados, para la fase C).
- En la raíz del repo, los zips del CI de S33 (`logs_120249887476.zip` y `playwright-report-webkit.zip`): borrarlos.
- Perfiles temporales de las pruebas sin WebGL: `$env:TEMP\cosmos-sin-webgl` y `$env:TEMP\cosmos-swiftshader`.
- Si alguna vez falla `npm ci` dentro de Docker: `docker volume rm cosmos-portfolio-visual-node-modules`.

**Bloqueos:** ninguno.
