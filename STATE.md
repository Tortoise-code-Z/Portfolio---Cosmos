# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** **F3 · paso 6 hecho** (`main` en `efdac6a`: AUD-F3-5 corregida en PR #65, encuadre en PR #66,
AUD-F3-6 corregida en PR #67, e2e de Chromium en Bajo y fps medidos en PR #68) · **AUD-F3-6C** lanzada a la Mesa ·
siguiente: decidirla y **F3.7** (ficha de Cosmos) para cerrar F3 con `v0.2.0`.

_Última actualización: 2026-10-28 (**CIERRE DE SESIÓN · 25**) · dos auditorías corregidas y F3.6c en tres PR: la
cámara deja cada forma entre el panel y el raíl, las capturas detectan cambios pequeños, los e2e de Chromium arrancan
en Bajo y la escena va a 60 fps estables en Alto en el equipo de Víctor. 1145 unitarios y 199 e2e en Chromium._

**Hecho esta sesión** (vivas S25 en `_claude/cadena/hecho/2026-10-28/decisiones-vivas-S25.md`):
1. **AUD-F3-5 corregida** (PR #65, `de1ec17`; vivas #1–#5): el e2e de About entra por una carga nueva
   (`about:blank`), el `<Canvas>` falso puede crear el renderer después (prueba la pausa al montar), `damp` con
   factor 0 si `dt` o `rate` no son positivos, una `m` no finita vuelve a `mTarget`, el paralaje usa `damp`,
   cobertura del 90 % **archivo a archivo** (`perFile` en `STRICT`), el guardián de citas exige un ejemplo propio por
   alternativa, y docs (quién lee `m` tras ADR-028, la pausa ya no en futuro, ADR-004/021/027, capas). P1-A: la
   escena se congela al abrir la misión rápida, bajo el fundido (`rendimiento.md` → «Ahorro de trabajo»).
2. **F3.6c · encuadre** (PR #66, `9634291`; vivas #9–#13, F36-12-A): `CAMERA_KEYFRAMES` 1–4 algo más lejos con el
   mismo ángulo y `shiftX` centrando cada forma entre panel y raíl, medido con capturas sin interfaz en los 6 tamaños
   (`camara-y-encuadre.md`). 8 referencias visuales nuevas, generadas por Víctor en Docker.
3. **AUD-F3-6 corregida** (PR #67, `97a7967`; vivas #14–#16): tolerancia de las capturas `threshold` 0,05 + 50
   píxeles (con la de antes, bajar un 15 % el alfa pasaba 10/10; ahora caen 8), la config se niega fuera de Docker
   (`COSMOS_VISUAL_DOCKER`), `scripts/visual.ts` reenvía argumentos y `visual:update` sin filtro limpia las viejas;
   e2e de la degradación con 90 s y ~20 fps puestos por el test; cuatro tests que no fallaban con su mutación;
   `readHandheldSignals` único y `nextLowerLevel` exhaustivo; el guardián lee `scripts/`; docs y ADR-010/026.
4. **F3.6c · e2e en Bajo y medición** (PR #68, `efdac6a`; vivas #8, #17–#19; F36-8-A, F36-9-A, F36-10-A):
   `tests/e2e/support/test.ts` fuerza Bajo en Chromium (`forceSoftwareWebGL`, compartido con las capturas) y ESLint
   lo exige en los specs; fps medidos por Víctor en producción: 60 en los 5 capítulos y en el viaje (p95 16,8 ms), así
   que el shader no se toca (`calidad.md` → «Mediciones»). ADR-024 matizado en el cierre.
5. **AUD-F3-6C lanzada** (base `de1ec17` · hasta `efdac6a`): audita los PR #66–#68.

**Incidencias y lecciones:**
- **`--coverage.thresholds.perFile=true` por la línea de comandos solo cambia el umbral global**, no los de cada glob:
  el `perFile` de un glob va en su propio objeto. El comando que propuso la Mesa no comprobaba lo que decía: mirar
  el código de la herramienta cuando una verificación dependa de cómo se aplica una opción.
- **`Object.assign` copia un getter como valor fijo**: para un documento falso con `visibilityState` cambiante,
  `Object.defineProperty`.
- **El umbral por píxel de `toHaveScreenshot` es 0,2 por defecto** (~20 % de brillo): con escenas oscuras hay que
  fijarlo.
- **Medir el encuadre:** capturas con todo en `visibility: hidden` salvo el `<canvas>`, más las cajas del panel y el
  raíl del DOM, dan cifras (qué fracción de partículas cae bajo cada uno) en vez de solo opinión.
- **`pkill -f` volvió a matar la propia shell** del contenedor: usar `pgrep` y excluir `$$` (ya estaba anotado).
- **Un `switch` sin `default` sobre una unión**, con tipo de retorno, ya no compila si falta un caso (sin rama muerta
  que baje la cobertura).
- **Método del contenedor** (sin cambios): Node 24 con `npm pack`, navegadores enlazados, árbol por `tar` desde el
  equipo, vuelta con `tar --overwrite` tras el md5 de la base y de cada archivo. El aviso de «cambios sin commit» se
  refiere a esa copia: `git stash -u`, nunca commit ni push desde ahí.

**Deuda anotada:**
- **Peso de la escena:** 248,97 KB de 250 (F3.6a 249,0; encuadre +7 B; corrección de AUD-F3-6 −51 B).
  R3F importa Three.js entero: las constelaciones y el Sol de F4 no caben en ~1 KB. Subir el límite, solo con
  ADR; antes, mirar qué más se puede ahorrar (sangría y líneas vacías del GLSL solo darían ~77 B y romperían las
  líneas de los errores).
- **Capturas con movimiento reducido (F36-5-A):** no vigilan lo que solo se ve en movimiento (oscilaciones, estela).
- **Degradación en caliente:** un navegador que limita los frames a 30 (ahorro de batería) baja a Bajo en
  escritorio: aceptado y escrito en `rendimiento.md`.
- **e2e de Chromium:** ~7,7–8,4 min en el contenedor, ya en Bajo (los dos de la degradación arrancan en Alto con
  los frames retrasados por el test: 22 y 15 s). SwiftShader pinta sin parar mientras la página está a la vista:
  mirar los tiempos del CI.
- **F4 · escena:** todo lo nuevo lee `SceneFrame.m` (la `m` suavizada de la escena), nunca `sceneStore.m`
  (ADR-028). Un módulo nuevo de `scene/` con Three, React o un store se añade a `IMPURE_SCENE_MODULES` de
  `eslint.config.js` (la lista es a mano), y uno de lógica que se prueba sin WebGL, al 90 % de `vitest.config.ts`
  (F3.6a lo olvidó con `fpsMeter` y `useHotDegradation`; `useSceneShapes` sigue fuera de esa lista).
- **F4 · gravedad:** las coordenadas del puntero son sobre la ventana, no sobre el lienzo: con una barra de scroll
  clásica, `uMouse` se desplaza ~1–2 % (lo apuntó la Mesa como descartado para F3.4).
- **Encuadre (F3.6c):** a 1280 y 1440 los brazos tenues de la galaxia montan un 3–5 % en el panel (aceptado para
  que siga grande); en móvil las formas quedan algo más pequeñas que antes y la galaxia roza el raíl (~3 %). El CI
  solo vigila 1440×900 y 390×844: los otros cuatro tamaños se miran con las herramientas de
  `_claude/cadena/hecho/2026-10-28/encuadre/` al tocar la cámara (F4).
- **F4.1 · halo del hero:** con escena, el halo CSS se queda (solo se funde el punto, `scene-on`), pero va en el
  hero (se va con el scroll); en el prototipo era fijo, se apagaba con `m` (`1 − smooth(0, 0,12, m)`) y crecía con
  la carga. Hacerlo con la detonación.
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
- Grupos de Skills enfocables (`tabindex`) solo en **F4.3**, cuando enciendan su constelación.
- Iconos de GitHub y LinkedIn: hoy enlaces de texto + icono externo; decidir si se dibujan en F6.
- **WebKit descarga dos veces las fuentes precargadas** (bug 194589): en F6, medir en un Safari real.
- Contraste AA sobre el velo de los paneles (`--color-veil`) encima de la escena: con la cámara de F3.4 ya hay
  partículas detrás de los paneles en escritorio; medirlo con las capturas de F3.6 y en F4 (ADR-015).
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
1. Arrancar con `session-start` (y la skill `taller`). Si la Mesa ya entregó **AUD-F3-6C**
   (`_claude/cadena/aud-f3-6c/auditoria.md`; sello `efdac6a` + vivas S25 hasta #20), decidirla y corregir lo elegido
   en su propio PR (con `npm run visual` si cambia algo visible).
2. **F3.7** (esquema → VB): ficha de Cosmos con la escena (`docs/01-contenido/proyectos/cosmos.md`: el resumen final,
   «Scroll-driven particle morphing…», «Works without WebGL…» y Three.js / React Three Fiber / GLSL en el stack).
3. **Cierre de F3 y `v0.2.0`:** comprobar el «Hecho cuando» del roadmap (las 5 formas, 60 fps en escritorio, sin
   errores sin WebGL), Lighthouse a mano y su apunte en `calidad.md` → «Mediciones», y ofrecer la Mesa de cierre de
   fase.

**Dudas abiertas:** D5 · analítica (F7). Tareas de Víctor: script de consola en el README de Chessmate (lo cita el
«Try it»), CV en PDF EN/ES.
**Limpieza manual del usuario:**
- Ramas locales ya fusionadas (todas menos `main`): `chore/ci-e2e-docker`, `chore/domain-tortoisecode`,
  `chore/f33-6-glsl-comments`, `chore/release-0.1.0`, todas las `docs/session-close-*` (de `2026-10-23-4` a
  `2026-10-27-3`, y la de este cierre, `docs/session-close-2026-10-28`, cuando se fusione), `feat/f3-1-scene-mount`,
  `feat/f3-2-shapes`, `feat/f3-3-layers`, `feat/f3-3-particles`, `feat/f3-4-camera-rig`, `feat/f3-5-smoothing-pause`,
  `feat/f3-6-hot-degradation`, `feat/f3-6c-framing`, `feat/project-images`, `feat/project-page`,
  `feat/quick-mission`, `feat/scroll-nav-hud`, `fix/aud-f2-5`, `fix/aud-f2-6`, `fix/aud-f2-7`, `fix/aud-f2-8`,
  `fix/aud-f2-cierre`, `fix/aud-f3-1` a `fix/aud-f3-6`, `fix/cosmos-entry-f2`, `fix/mono-fallback-cls`,
  `perf/f3-6c-measure`, `test/f3-6-visual` y `test/recruiter-journeys` (`git branch -D <rama>`: con squash, `-d` no
  las reconoce como fusionadas).
- En el buzón se puede borrar todo lo de `_claude/cadena/tmp/` y, dentro de `_claude/cadena/hecho/`, los
  `arbol.tar.gz` y `cambio.diff` (nunca la carpeta `_claude/cadena/`, ni `hecho/2026-10-28/medir-fps.js` ni
  `hecho/2026-10-28/encuadre/`, que se reutilizan).
- Si alguna vez falla `npm ci` dentro de Docker: `docker volume rm cosmos-portfolio-visual-node-modules`. La carpeta
  `build\` quedó construida desde Linux: `npm run build` la rehace en Windows si hace falta.

**Bloqueos:** ninguno.
