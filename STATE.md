# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** **F3 · paso 6 a medias** (`main` en `3e6ac0a`: F3.6a degradación en caliente en PR #62, F3.6b
capturas de regresión visual en PR #63) · siguiente: decidir **AUD-F3-5** (ya entregada) y **F3.6c** (encuadre,
fps medidos y shader).

_Última actualización: 2026-10-27 (**CIERRE DE SESIÓN · 24**) · la escena baja un nivel sola si va lenta, hay 10
capturas de referencia comparadas en Docker y en el CI, y `main` por fin exige los cuatro checks. 1133 unitarios y
198 e2e en Chromium; las capturas, 10/10 dos veces en Docker._

**Hecho esta sesión** (vivas S24 en `_claude/cadena/hecho/2026-10-27/decisiones-vivas-S24.md`):
1. **F3.6a · degradación en caliente** (PR #62, `65683de`; vivas #1–#9, F36-1/2/3-A): `scene/fpsMeter` (puro: ventanas
   de 2 s, 3 lentas seguidas, sin los 2 s de calentamiento ni la ventana de una pausa), `useHotDegradation` (solo con
   partículas y un nivel por debajo; deja de medir si una bajada falla), `useSceneShapes` → `lowerTo` (primero las
   formas del worker, sin reintento, y después el nivel, a la vez; si no llegan, todo sigue igual: cierra
   AUD-F3-2-3-B), `nextLowerLevel` e `isHandheld` en `lib/device/sceneLevel`, `HOT_DEGRADATION` en `sceneConfig`,
   `data-level` en `SceneRoot`. Dos e2e: Alto → Medio → Bajo con SwiftShader y «las formas no llegan».
2. **F3.6b · regresión visual** (PR #63, `3e6ac0a`; vivas #10–#19, F36-4/5/6/7-A): `playwright.visual.config.ts`,
   `tests/visual/chapters.spec.ts` (5 capítulos × 1440×900 y 390×844 táctil, movimiento reducido, siempre en Bajo),
   `scripts/visual.ts` + `scripts/visual-in-docker.sh` (`npm run visual` / `visual:update` en la imagen de la versión de
   `@playwright/test`, volumen propio para `node_modules`; `visual:run` sin Docker), job `Visual regression` del CI,
   10 referencias (2,5 MB) generadas por Víctor con Docker Desktop. `calidad.md` → «Regresión visual»; ADR-010 matizado.
   `fpsMeter` y `useHotDegradation` entran en el 90 % de la lógica de la escena.
3. **Protección de `main`:** ningún check estaba marcado como obligatorio (la doc decía lo contrario). Víctor marca
   los cuatro: `Typecheck · lint · format · tests`, `Build`, `E2E (Chromium · Firefox · WebKit)`, `Visual regression`.
4. **AUD-F3-5 entregada** por la Mesa (F3.5 + corrección de AUD-F3-4): 0 · 2 recomendados · 15 menores · 1 pregunta.
   Sin decidir.
5. Dudas de Víctor guardadas en `_claude/dudas/` (por qué Docker, check obligatorio, paso a paso en Docker, por qué
   fallaban las capturas, checks obligatorios de `main`).

**Incidencias y lecciones:**
- **En un e2e, ir de `/` a `/#about` solo cambia el ancla:** no recarga, así que un `addInitScript` añadido después no
  corre. Pasar antes por `about:blank` (F3.6a). La Mesa encontró lo mismo en un e2e de F3.4 (AUD-F3-5-1).
- **Docker Desktop no es el contenedor de Claude:** dentro, `localhost` llevaba a `::1` al escuchar y a `127.0.0.1` al
  conectar, y el pre-renderizado del build fallaba (`ECONNREFUSED`): `--dns-result-order=ipv4first` en
  `visual-in-docker.sh`. Y el Chromium de la imagen dice tener GPU: la escena arrancaba en Alto y la degradación la
  bajaba a mitad de la foto. Las referencias se generan siempre en Docker; Claude solo prueba la lógica.
- **La doc decía que `main` tenía checks obligatorios y no los tenía:** comprobar en GitHub lo que la doc da por hecho
  cuando se pueda (se descubrió al marcar el nuevo).
- **Un módulo nuevo de lógica de la escena va también al 90 % de `vitest.config.ts`** (F3.6a lo olvidó; entró en F3.6b).
- **El aviso de «cambios sin commit» del entorno de Claude** se refiere a su copia del repo: se deja limpia con
  `git stash`; nunca commit ni push desde ahí.
- **Método del contenedor:** el de la sesión 23 (Node 24 con `npm pack`, navegadores enlazados, árbol por `tar`, md5
  de la base y de cada archivo). Para un archivo suelto que cambia después, `device_commit_files` y comprobar su md5.

**Deuda anotada:**
- **Peso de la escena:** 249,0 KB de 250 (F3.5 248,4; AUD-F3-4 +22 B; F3.6a, la degradación en caliente, +590 B).
  R3F importa Three.js entero: las constelaciones y el Sol de F4 no caben en ~1 KB. Subir el límite, solo con
  ADR; antes, mirar qué más se puede ahorrar (sangría y líneas vacías del GLSL solo darían ~77 B y romperían las
  líneas de los errores).
- **CI · nivel de la escena en los e2e de Chromium:** en la imagen de Playwright, Chromium da contexto WebGL con
  `failIfMajorPerformanceCaveat` (la detección dice «hardware»): en escritorio los e2e arrancan casi seguro en Alto y
  la degradación en caliente puede cambiar el nivel a mitad de un e2e (las capturas ya fuerzan «software»). Nada
  falla hoy; decidir en F3.6c si los e2e fuerzan también Bajo o se deja (sin comprobar en el log del CI).
- **Capturas con movimiento reducido (F36-5-A):** no vigilan lo que solo se ve en movimiento (oscilaciones, estela).
- **Degradación en caliente:** un navegador que limita los frames a 30 (ahorro de batería) baja a Bajo en
  escritorio: aceptado y escrito en `rendimiento.md`. Medirla en un equipo real en F3.6c.
- **e2e de Chromium:** ~7,1 min en el contenedor (F3.6a añadió ~45 s: los dos e2e de la degradación). SwiftShader pinta sin parar mientras la página está a la vista
  (la pausa de F3.5 solo actúa con la pestaña oculta o la misión rápida): mirar los tiempos del CI.
- **F4 · escena:** todo lo nuevo lee `SceneFrame.m` (la `m` suavizada de la escena), nunca `sceneStore.m`
  (ADR-028). Un módulo nuevo de `scene/` con Three, React o un store se añade a `IMPURE_SCENE_MODULES` de
  `eslint.config.js` (la lista es a mano), y uno de lógica que se prueba sin WebGL, al 90 % de `vitest.config.ts`
  (F3.6a lo olvidó con `fpsMeter` y `useHotDegradation`; `useSceneShapes` sigue fuera de esa lista).
- **F4 · gravedad:** las coordenadas del puntero son sobre la ventana, no sobre el lienzo: con una barra de scroll
  clásica, `uMouse` se desplaza ~1–2 % (lo apuntó la Mesa como descartado para F3.4).
- **F3.6 · encuadre:** la cámara usa las cifras del prototipo. En las capturas de F3.4, a 1280×720 y 1920×1080 la
  Tierra se corta un poco por la derecha, bajo el raíl, y la cabeza de la tortuga queda pegada a él; en móvil
  (390, 360) el campo de visión llega al tope de 100° (como el prototipo). Ajustar `CAMERA_KEYFRAMES` /
  `shiftX` con las capturas de regresión de F3.6 (en las de F3.6b, a 1440×900, la Tierra queda detrás de las
  etiquetas del raíl y la tortuga roza su columna). Cada cambio visible, con `npm run visual:update` y sus PNG.
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
**Siguiente paso (próxima sesión, conversación nueva):**
1. Arrancar con `session-start` (y la skill `taller`). **Decidir AUD-F3-5** (`_claude/cadena/aud-f3-5/auditoria.md`:
   2 recomendados, 15 menores y la pregunta P1 sobre congelar la escena durante el fundido de la misión rápida).
   Su sello es `e6dfbf5`: contrastar con F3.6a/F3.6b (`65683de`, `3e6ac0a`), que tocan `SceneRoot`, `useSceneShapes` y
   `vitest.config.ts`. Corregir lo elegido en su propio PR (con `npm run visual` si cambia algo visible).
2. **F3.6c** (esquema → VB): encuadre con las capturas (`CAMERA_KEYFRAMES` / `shiftX`, y `visual:update`), medición de
   fps a mano en un equipo real, ajustes del shader medidos antes de tocar (AUD-F3-3-P5) y si los e2e de Chromium del
   CI deben forzar Bajo.
3. Ofrecer la Mesa para F3.6a + F3.6b (base `f576888` · hasta `3e6ac0a`), sola o con F3.6c. Después, F3.7 (ficha de
   Cosmos) y `v0.2.0`.

**Dudas abiertas:** D5 · analítica (F7). Tareas de Víctor: script de consola en el README de Chessmate (lo cita el
«Try it»), CV en PDF EN/ES.
**Limpieza manual del usuario:**
- Ramas locales ya fusionadas: `feat/f3-1-scene-mount`, `docs/session-close-2026-10-26-2`,
  `docs/session-close-2026-10-26-3`, `docs/session-close-2026-10-26-4`, `docs/session-close-2026-10-26-5`,
  `fix/aud-f3-1`, `feat/f3-2-shapes`, `chore/domain-tortoisecode`, `fix/aud-f3-2`, `feat/f3-3-layers`,
  `feat/f3-3-particles`, `chore/f33-6-glsl-comments`, `feat/f3-4-camera-rig`, `docs/session-close-2026-10-27`,
  `fix/aud-f3-3`, `feat/f3-5-smoothing-pause`, `fix/aud-f3-4`, `docs/session-close-2026-10-27-2`,
  `feat/f3-6-hot-degradation`, `test/f3-6-visual` y la de este cierre (`docs/session-close-2026-10-27-3`) cuando se fusione.
- En el buzón se puede borrar todo lo de `_claude/cadena/tmp/` (`arbol*.tar.gz`, `cambio*.tar.gz`, `*.md5`,
  `*.blobs`, `cierre-s*.tar.gz`, `s16-files.list`, `STATE-*.md`, `historial-*.md`, `cambio-s24-*.tar.gz`, `*-s24-*.md5`) y, dentro de `_claude/cadena/hecho/`, los
  `arbol.tar.gz` y `cambio.diff` (nunca la carpeta `_claude/cadena/`).
- Si alguna vez falla `npm ci` dentro de Docker: `docker volume rm cosmos-portfolio-visual-node-modules`. La carpeta
  `build\` quedó construida desde Linux: `npm run build` la rehace en Windows si hace falta.

**Bloqueos:** ninguno.
