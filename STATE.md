# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** **F3 · paso 4 hecho** (`main` en `b3d3c4e`: F33-6 en PR #55, F3.4 en PR #56) · **AUD-F3-3**
entregada y decidida (corrige todo, 1–18, y P1–P6 = A), **sin corregir** · siguiente: corregir AUD-F3-3 y después
**F3 · paso 5** (puente `sceneStore` ↔ scroll y pausa).

_Última actualización: 2026-10-27 (**CIERRE DE SESIÓN · 22**) · los shaders llegan sin comentarios (F33-6) y la
cámara sigue el viaje: keyframes, encuadre de escritorio, campo de visión de móvil y paralaje con el ratón. 1072
unitarios y 194 e2e en Chromium; los dos PR fusionados con el check obligatorio del CI._

**Hecho esta sesión** (vivas S22 en `_claude/cadena/hecho/2026-10-27/decisiones-vivas-S22.md`):
1. **F33-6 decidida (B) y hecha** (PR #55, `ca9a3d3`; vivas #1, #5–#7): `stripGlslComments`
   (`scene/shaders/stripGlslComments/`, una pasada con los dos tipos de comentario; conserva los saltos de línea
   para que la línea de un error sea la del archivo) y el plugin `cosmos:glsl-without-comments` de
   `vite.config.ts` (`*.glsl?raw`, también en dev; Vitest lee los archivos tal cual). Escena de 248,2 a 247,0 KB.
   Guarda e2e en `budgets.spec.ts`: ningún texto de los comentarios llega a los chunks (comprobado quitando el
   plugin).
2. **F3.4 · `CameraRig`** (PR #56, `b3d3c4e`; vivas #2–#4, #18–#22): `scene/math/camera` (pose por `m` con
   `smoothstep`, `m = 4` exacto, `shiftX` en escritorio, FOV de móvil con tope de 100°, paralaje `min(1, dt·2)`),
   `scene/CameraRig` (FOV solo al cambiar el aspecto), `scene/pointer` (solo `pointerType: mouse`; fuera de la
   ventana vuelve al centro, CAM-1-B), `lib/device/mediaQuery` (`watchMediaQuery`; `watchReducedMotion` lo usa) con
   `(width >= 900px)`, la media query de los paneles (CAM-2-A, atada por test a `ChapterPanel.module.css`).
   `SceneFrame` gana `delta`, `wide` y `pointer`; fuera la cámara provisional. Escena 247,9 KB.
3. **AUD-F3-3** entregada por la Mesa (0 bloqueantes · 6 recomendados · 12 menores · 6 preguntas) y **decidida**
   (vivas #9–#17): se corrige todo con las opciones recomendadas (1-A, 3-A, 5-A, 12-B, 16-A) y P1–P6 = A. La parte
   de la 18 que toca a `watchMediaQuery` y la línea de `camara-y-encuadre.md` de la 9 ya entraron en F3.4.

**Incidencias y lecciones:**
- **La cifra del peso de F3.3 en los docs (247,3 KB) no cuadraba** con lo que mide `budgets.spec.ts` sobre el mismo
  código (248,2 KB). Medir siempre con el algoritmo del test (`gzipSync` de los chunks que sigue desde
  `SceneRoot`) y apuntar esa cifra.
- **Linter de React (`immutability`):** no deja asignar propiedades de la cámara de `useThree` ni de un valor de
  `useState` dentro del componente: el FOV va en una función de fuera (`fitLens`) y el aspecto en un `useRef`.
- **Una regex por tipo de comentario falla** (`// a /* b` se comía código): una sola pasada con la alternancia,
  donde manda el que empieza antes. Lo cazó su propio test.
- **El aviso de commit y push del contenedor** (stop hook) se refiere a la copia de trabajo de la nube: se guarda con
  `git stash -u` y no se empuja nada desde allí (el git lo ejecuta Víctor).
- **Método del contenedor** (sin cambios): Node 24 con `npm pack node-linux-x64@24.22.0`,
  `PLAYWRIGHT_BROWSERS_PATH` propio con enlaces `chromium*-1248 → -1243`, árbol por `tar` desde
  `_claude/cadena/tmp/` y vuelta con `tar --overwrite` tras comprobar el md5 de la base y después el de cada
  archivo. Capturas de los capítulos con `vite preview` y Playwright (SwiftShader) para enseñarlas; en móvil, al
  principio de cada capítulo (con `scrollIntoView` el panel tapa la escena). En dev, la primera carga con la caché
  `.vite` vacía da «Outdated Optimize Dep» (ya pasaba); la segunda va bien.

**Deuda anotada:**
- **Peso de la escena:** 247,9 KB de 250 tras F33-6 (shaders sin comentarios, −1,2 KB) y F3.4 (cámara,
  +0,9 KB). R3F importa Three.js entero: las constelaciones y el Sol de F4 apenas caben. Subir el límite, solo con
  ADR; antes, mirar qué más se puede ahorrar (sangría y líneas vacías del GLSL solo darían ~77 B y romperían las
  líneas de los errores).
- **F3.6 · encuadre:** la cámara usa las cifras del prototipo. En las capturas de F3.4, a 1280×720 y 1920×1080 la
  Tierra se corta un poco por la derecha, bajo el raíl, y la cabeza de la tortuga queda pegada a él; en móvil
  (390, 360) el campo de visión llega al tope de 100° (como el prototipo). Ajustar `CAMERA_KEYFRAMES` /
  `shiftX` con las capturas de regresión de F3.6.
- **F3.5 · pausa:** la escena pinta continua (ADR-027) hasta la pausa; la pausa es no pedir el frame siguiente en
  `scene/frameLoop`. Desde F3.3 los e2e de Chromium pasan de ~4,5 a ~6,7 min (SwiftShader pinta sin parar):
  mirar los tiempos del CI.
  El suavizado de `m` y la pausa leen el tiempo real de `SceneFrame.delta` (`sceneClock.delta`, F3.4), no el
  `delta` que R3F pasa a `useFrame` (sin tope).
- **F4.1 · halo del hero:** con escena, el halo CSS se queda (solo se funde el punto, `scene-on`), pero va en el
  hero (se va con el scroll); en el prototipo era fijo, se apagaba con `m` (`1 − smooth(0, 0,12, m)`) y crecía con
  la carga. Hacerlo con la detonación.
- **Shaders:** los coeficientes propios de cada forma (giros, amplitudes) van en el GLSL junto a su fórmula, sin
  `const` con nombre (peso; `particulas-y-shaders.md` → «Mejoras»). Si se ajustan con capturas (F3.6), valorar
  nombrarlos.
- **`npm run dev`:** en una navegación dentro de la misma página el worker de las formas puede pasar de 3 s (Vite
  lo transforma al pedirlo) y se usa el reintento; en el build y los e2e va por el worker.
- La guarda `controller.signal.aborted` de `useSceneShapes` no la puede ver ningún test (`obtainShapes` ya
  devuelve `'aborted'` en todos los caminos): se queda como defensa.
- **F3.6 · regenerar a media visita (AUD-F3-2-3-B):** hoy cualquier cambio de `count` pasa por `obtainShapes`,
  que reintenta en el hilo principal y, si falla, apaga la escena. F3.6 debe regenerar con `loadShapes` sin
  reintento y, si falla, quedarse como estaba. Pregunta de orden: si se baja el nivel antes de regenerar,
  «dejar el nivel actual» ya no es posible.
- **F3.6 · rendimiento del shader (AUD-F3-3-P5, A):** medir antes de tocar: tope del tamaño de punto en píxeles
  del dispositivo (`SIZE_MAX_PX = 48`), `MAX_STEP_S = 0,1` (por debajo de 10 fps la animación va más lenta que el
  reloj), la estela con alfa 0 en Bajo (`gl_PointSize = 0.0` la saltaría) y la compilación síncrona del shader al
  primer frame.
- **F4 · ratón:** `uMouse` sale de `SceneFrame.pointer` (si `inside`; si no, `POINTER_AWAY`), el mismo objeto que
  usa el paralaje; solo `pointerType: mouse`.
- **F4.1 · capas (AUD-F3-3-P2, A):** el halo del hero va dentro de `main` y su `--z-glow` es relativo a `main`; el
  destello y las etiquetas irán fuera, por debajo. Decidir el orden con la detonación.
- **F4 · colores repetidos (AUD-F3-3-P4, A):** `--gradient-space` y `--color-flash` (`#fff4dc`) repiten a mano
  colores de `scenePalette` (`flash` es `#fff2d9`): unificar el destello en F4.
- **F6 · alto contraste (AUD-F3-3-P6, A):** con `forced-colors` la escena sigue pintando detrás del texto;
  decidirlo con NVDA y alto contraste a mano.
- **Generación de 60.000 partículas:** ~0,4 s en el contenedor (casi todo la nube de la nebulosa; algoritmo del
  prototipo). Pasa el límite de 1 s; si en el CI o en un móvil real pesa, mirarlo allí antes de tocar nada.
- **CI · Firefox y WebKit:** no sabemos si tienen WebGL2 ni si solo por software (desde P1-B arrancarían en Bajo);
  los e2e con WebGL se omiten si no lo hay. Mirarlo en el log de un PR.
- **R3F 9.8.1 + three 0.186:** `console.warn` «THREE.Clock: This module has been deprecated» al montar el lienzo.
  Se va cuando R3F use `THREE.Timer`: mirarlo al subir R3F.
- **F6 · NVDA:** el aviso sin WebGL se descarta con «Got it» y el foco cae al `body` (igual que «No, gracias»).
- **F6 · fuentes:** IBM Plex Mono no se precarga y pinta la primera pantalla (barra, metadatos de la ficha, HUD,
  eyebrows). Desde #43 sus reservas miden lo mismo por letra (0,6 em) y el cambio ya no mueve las líneas; valorar
  precargarla midiendo la LCP, y mirar en un Windows real cómo se ve Courier New mientras llega.
- **CI:** cada job de e2e descarga la imagen de Playwright (~2 GB). Si el CI vuelve a ir lento, medir cuánto es
  la descarga antes de tocar nada. Subir `@playwright/test` = subir cada `image:` de `ci.yml` (ADR-024).
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
- Grupos de Skills enfocables (`tabindex`) solo en **F4.3**, cuando enciendan su constelación.
- Iconos de GitHub y LinkedIn: hoy enlaces de texto + icono externo; decidir si se dibujan en F6.
- **WebKit descarga dos veces las fuentes precargadas** (bug 194589): en F6, medir en un Safari real.
- Contraste AA sobre el velo de los paneles (`--color-veil`) encima de la escena: con la cámara de F3.4 ya hay
  partículas detrás de los paneles en escritorio; medirlo con las capturas de F3.6 y en F4 (ADR-015).
- La lista de valores neutros del test de colores obliga a ampliarla con un valor legítimo nuevo (a propósito).
- `@lhci/cli` y los scripts `visual` / `lhci` se instalan en F3/F6.
- **F7:** que `/es/*` reciba la 404 ES y que las 404 salgan con estado 404 real en Vercel (en `preview` salen con
  200); comprobar el `X-Robots-Tag: noindex` de las previews (ahora más importante: su canónica apunta a
  `tortoisecode.dev`, ADR-025); **`cleanUrls: true`** en `vercel.json`.
- Provisional: `favicon.svg` (F6).
- **React Router 8.4 no pasa `caseSensitive` a las rutas del cliente:** lo cubre `isLowerCasePathname`. Al
  actualizar React Router, comprobar si ya lo pasa.
- Si alguna ruta lanza un 404 desde un `loader` (`throw data(null, { status: 404 })`), choca con
  `@typescript-eslint/only-throw-error`: configurar el `allow` de la regla. Hoy ninguna lo hace.
- **F3.5:** la escena deja de pintar con `quickMissionOpen` de `uiStore` y suaviza `m`; hasta entonces
  `setScrollTarget` escribe `m = mTarget` (ADR-021 → Consecuencias) y el morph va pegado al scroll.

**Siguiente paso (próxima sesión, conversación nueva):**
1. Arrancar con `session-start` (y la skill `taller`). **Corregir AUD-F3-3** en `fix/aud-f3-3`: todo (1–18) con
   las opciones de las vivas S22 #10–#17 (copia en `hecho/2026-10-27/decisiones-vivas-S22.md`; la entrega en
   `hecho/2026-10-27/aud-f3-3/auditoria.md`). Aplicarlo sobre la versión de F3.4 de `SceneRoot`, `SceneFrame`,
   `sceneClock` y `watchMediaQuery`. Incluye anotar P1 en `estados-y-accesibilidad.md`, P2 en la tabla «Capas»,
   el fundido de P3 y el comentario de P4 en `tokens.css`; P5 y P6 ya están en la deuda.
2. Ofrecer la Mesa para F33-6 + F3.4 (`base f850371 · hasta b3d3c4e`) si Víctor quiere auditarlos, o junto con la
   corrección.
3. **F3 · paso 5** (esquema → VB): puente `sceneStore` ↔ scroll (la escena suaviza `m` con `SceneFrame.delta`) y
   pausa con la pestaña oculta y en misión rápida (`quickMissionOpen`), en `scene/frameLoop`.

**Dudas abiertas:** D5 · analítica (F7). Tareas de Víctor: script de consola en el README de Chessmate (lo cita el
«Try it»), CV en PDF EN/ES.
**Limpieza manual del usuario:**
- Ramas locales ya fusionadas: `feat/f3-1-scene-mount`, `docs/session-close-2026-10-26-2`,
  `docs/session-close-2026-10-26-3`, `docs/session-close-2026-10-26-4`, `docs/session-close-2026-10-26-5`,
  `fix/aud-f3-1`, `feat/f3-2-shapes`, `chore/domain-tortoisecode`, `fix/aud-f3-2`, `feat/f3-3-layers`,
  `feat/f3-3-particles`, `chore/f33-6-glsl-comments`, `feat/f3-4-camera-rig`, y la de este cierre
  (`docs/session-close-2026-10-27`) cuando se fusione.
- En el buzón se puede borrar todo lo de `_claude/cadena/tmp/` (`arbol*.tar.gz`, `cambio*.tar.gz`, `*.md5`,
  `*.blobs`, `cierre-s*.tar.gz`, `s16-files.list`, `STATE-*.md`) y, dentro de `_claude/cadena/hecho/`, los
  `arbol.tar.gz` y `cambio.diff` (nunca la carpeta `_claude/cadena/`).

**Bloqueos:** ninguno.
