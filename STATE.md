# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** **F3 · paso 7 hecho** (`main` en `d5ee0a9`: AUD-F3-6C corregida en PR #70, F3.7 en PR #71) ·
**ADR-029 decidido**: siguiente, F3.8 (WebGL por software → sin escena) y F3.9 (fotos fijas en el modo sin WebGL);
después la versión 0.2.0, la Mesa de cierre y la etiqueta.

_Última actualización: 2026-10-29 (**CIERRE DE SESIÓN · 26**) · AUD-F3-6C corregida, la ficha de Cosmos ya cuenta
la escena y, al medir el cierre de F3, PageSpeed pinta la escena por software (Performance 83–88, TBT 450–660 ms,
por debajo del brief): se decide apagarla en ese caso y vestir el modo sin WebGL con fotos fijas. 1146 unitarios y
199 e2e en Chromium._

**Hecho esta sesión** (vivas S26 en `_claude/cadena/hecho/2026-10-29/decisiones-vivas-S26.md`):
1. **AUD-F3-6C corregida entera** (PR #70, `099c27a`; vivas #1–#4): la regla de ESLint del `test` de los e2e cierra
   el import por defecto y `playwright/test`, y `testMatch: '**/*.spec.ts'`; opción `sceneInLow` del fixture sobre
   el contexto (cubre `context.newPage()` y popups; la degradación la apaga con `test.use`); el e2e «en Chromium,
   Bajo» lee el nivel una vez; avisos de WebGL en la degradación; `visual:update` solo borra sin más argumentos;
   el guardián de citas exige cada carpeta de la raíz que sigue git (`NOT_CODE_DIRS`); docs, comentarios y
   ADR-024.
2. **F3.7 · ficha de Cosmos con la escena** (PR #71, `d5ee0a9`; vivas #5–#8, F37-1-A): resumen final en tres
   frases en EN y ES, «Scroll-driven particle morphing across five scenes», «Works without WebGL and with reduced
   motion» y Three.js / React Three Fiber / GLSL en el stack principal. Referencia de escritorio de
   `chapter-3-projects` rehecha (la de móvil no cambió).
3. **Mediciones del cierre de F3** (vivas #9–#13): Lighthouse local 63–64 (TBT 4,8–7,4 s; con WebGL apagado, 94 y
   0 ms) y PageSpeed en producción `/` 88 · TBT 450 ms y `/projects/cosmos` 83 · TBT 660 ms (A11y, BP y SEO 100;
   CLS 0). `npm audit`: 0. En `calidad.md` → «Mediciones».
4. **Decisiones para cerrar F3** (vivas #10, #14–#17): ADR-029 (por software → sin escena, detección por
   `renderer`; fotos fijas de la escena real en el modo sin WebGL; pasos 8 y 9 del roadmap). La etiqueta va al
   final del cierre, ya auditada (`git-y-despliegue.md`).

**Incidencias y lecciones:**
- **Chromium sin GPU da contexto WebGL2 con `failIfMajorPerformanceCaveat`** (headless 156 en el contenedor;
  PageSpeed con HeadlessChromium 153 pintó la escena): la única pista fiable es el `renderer` («… SwiftShader
  driver»). PageSpeed **sí ejecuta WebGL**: cuenta cada frame como trabajo del hilo principal.
- **Medir en local no basta para Performance:** el contenedor (2 núcleos, CPU ×4) exagera el TBT (5 s frente a
  450 ms en PageSpeed). Sirve para comparar con y sin escena (`--disable-3d-apis`), no como cifra.
- **El guardián de carpetas lista con git:** la copia del contenedor debe llevar `.git` (y `safe.directory`), o el
  test falla.
- **Leer PageSpeed:** los informes se leen bien desde el navegador de la app con `javascript_tool` (filas de
  `long-tasks` y `mainthread-work-breakdown`); `pagespeed.web.dev` quedó permitido en el navegador de la app.
- **Método del contenedor** (sin cambios): Node 24 con `npm pack node-linux-x64@<versión>`, navegadores enlazados
  (`chromium-<revisión pedida>` → la instalada), árbol por `tar` desde el equipo con `.git`, `.env` desde
  `.env.example`; tras un PR, `git stash -u` en la copia, nunca commit ni push desde ahí.

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
- **CI · Firefox y WebKit:** no sabemos si tienen WebGL2 ni si solo por software (desde P1-B arrancarían en Bajo;
  con ADR-029, sin escena); los e2e con WebGL se omiten si no lo hay. Mirarlo en el log de un PR.
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
- **ADR-029 al implementarlo:** «Elección inicial» de `rendimiento.md` y «Sin WebGL» de
  `estados-y-accesibilidad.md` aún dicen «por software → Bajo» y no cuentan las fotos fijas; `forceSoftwareWebGL`,
  el `test` de `tests/e2e/support` (opción `sceneInLow`), `calidad.md`, ADR-010/024 y `chapters.spec.ts` se apoyan
  en fingir «software». Las e2e de la degradación en caliente fuerzan Alto quitando la opción: revisar que sigan
  teniendo sentido con la detección por `renderer` (en la imagen, el `renderer` es SwiftShader).
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
1. Arrancar con `session-start` (y la skill `taller`). Cola vacía de auditorías.
2. **F3.8 · ADR-029, detección por software** (esquema → VB): `detectWebGL2` mira el `renderer` (lista de nombres
   por software, con tests), «por software» → Apagado con su aviso; los e2e y las capturas consiguen Bajo sin
   fingir «software» (p. ej. `navigator.connection.saveData` o `deviceMemory` simulados y el `renderer` de GPU);
   revisar `forceSoftwareWebGL`, `sceneInLow`, la degradación en caliente (fuerza Alto), `chapters.spec.ts`,
   ADR-010/024, `rendimiento.md` y `estados-y-accesibilidad.md`. `npm run visual` (no debería cambiar).
3. **F3.9 · fotos fijas** (esquema → VB): script en Docker (lienzo solo, fondo transparente, capítulos 1–4 en
   escritorio y móvil, AVIF/WebP; las herramientas de `_claude/cadena/hecho/2026-10-28/encuadre/` sirven de
   punto de partida), CSS de `no-gl` con la del capítulo activo y fundido, presupuesto de imágenes, captura nueva
   del modo sin WebGL si conviene.
4. **Versión 0.2.0:** repetir Lighthouse local y PageSpeed (`/` y `/projects/cosmos`, lo pasa Víctor) tras
   desplegar, `npm audit`, PR con la versión; después la Mesa AUD-F3-CIERRE, sus correcciones y la etiqueta
   `v0.2.0` sobre el último commit del cierre.

**Dudas abiertas:** D5 · analítica (F7). Tareas de Víctor: script de consola en el README de Chessmate (lo cita el
«Try it»), CV en PDF EN/ES.
**Limpieza manual del usuario:**
- Ramas locales ya fusionadas (todas menos `main`): las de la lista del cierre 25 (en `docs/_historial/estado/2026-10.md`) que sigan, más
  `docs/session-close-2026-10-28`, `fix/aud-f3-6c`, `feat/f3-7-cosmos-entry` y la de este cierre,
  `docs/session-close-2026-10-29`, cuando se fusione (`git branch -D <rama>`: con squash, `-d` no las reconoce
  como fusionadas). Para verlas: `git branch`.
- En el buzón se puede borrar todo lo de `_claude/cadena/tmp/` y, dentro de `_claude/cadena/hecho/`, los
  `arbol.tar.gz` y `cambio.diff` (nunca la carpeta `_claude/cadena/`, ni `hecho/2026-10-28/medir-fps.js` ni
  `hecho/2026-10-28/encuadre/`, que se reutilizan).
- Perfiles temporales de las pruebas sin WebGL: `$env:TEMP\cosmos-sin-webgl` y `$env:TEMP\cosmos-swiftshader`.
- Si alguna vez falla `npm ci` dentro de Docker: `docker volume rm cosmos-portfolio-visual-node-modules`.

**Bloqueos:** ninguno.
