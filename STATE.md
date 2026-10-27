# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** **F3 · paso 5 hecho** (`main` en `e6dfbf5`: AUD-F3-3 corregida en PR #58, F3.5 en PR #59,
AUD-F3-4 corregida en PR #60) · siguiente: ofrecer la Mesa para F3.5 + la corrección de AUD-F3-4 y **F3 · paso 6**
(capturas de regresión visual, fps y degradación en caliente).

_Última actualización: 2026-10-27 (**CIERRE DE SESIÓN · 23**) · el fondo del espacio ya es `--color-void` (no
negro), la escena suaviza su propia `m` y se pausa cuando no se ve, y dos auditorías corregidas. 1111 unitarios y
196 e2e en Chromium; los tres PR fusionados con el check obligatorio del CI._

**Hecho esta sesión** (vivas S23 en `_claude/cadena/hecho/2026-10-27/decisiones-vivas-S23.md`):
1. **AUD-F3-3 corregida** (PR #58, `2c248aa`; vivas #1–#9): el lienzo se limpia con los números del hex tal cual
   (`scene/voidColour`: `hexToRgb` + `Color.setRGB`; `new Color('#…')` lo dejaba casi negro) y lo repone al
   recuperar el contexto, escuchando después de Three; potencias del GLSL sin base negativa; ojos con
   `COLOR_TURTLE_EYES`; `Particles/` con `useParticles`; `SceneMount` quita sus clases al desmontarse; 90 % para
   la lógica de la escena y guarda de ESLint de la capa pura (`IMPURE_SCENE_MODULES`); guardián de citas más
   amplio (quitó «F33-6» de 7 sitios); e2e de píxeles, movimiento reducido y avisos de WebGL; docs y ADR-027.
2. **F3.5 · suavizado y pausa** (PR #59, `ce325b6`; vivas #12–#14; F35-1-A): **ADR-028**: la escena suaviza su
   propia `m` (`SceneFrame.m`, `lib/math/damp`, `M_SMOOTHING` 3,4 / 12 con movimiento reducido, umbral 1e-4) y
   arranca en `mTarget`; `sceneStore.m` sigue siendo `mTarget` (raíl, HUD e idioma a saltos). La pausa:
   `FrameLoop.setPaused` y `scene/pause` (`watchScenePause`: pestaña oculta o misión rápida), `data-paused`.
3. **AUD-F3-4** (F33-6 + F3.4 + la corrección de AUD-F3-3; 0 · 1 recomendado · 15 menores) decidida (todo, con lo
   recomendado) y **corregida** (PR #60, `e6dfbf5`; vivas #15–#20): `pointerout` solo de ratón, paralaje acotado
   a ±1, `stripGlslComments` no pega palabras, `BackgroundStars/` con `useBackgroundStars`, `pointer` y
   `contextLoss` al 90 %, criterio escrito de la guarda, e2e de píxeles por `/#about` con `expect.poll` (F35-2-A)
   y del color del fondo (al cargar y tras recuperar el contexto; comprobado quitando el oyente), guardián de
   citas con más formatos (lee JSON y `public/`), docs del puntero en `SceneFrame` (ADR-004 matizado en su estado).

**Incidencias y lecciones:**
- **El orden de los oyentes de `webglcontextrestored` importa:** Three rehace su fondo en negro en el suyo, que se
  registra al crear el renderer (R3F lo crea tras medir el lienzo, después de los efectos de `SceneRoot`). Lo que
  deba ir detrás de Three se escucha desde `onCreated`.
- **Un test que lee «todos los archivos» lee también binarios:** `code-references` leía las PNG (un byte casó por
  azar) y, al añadir JSON, `package-lock.json` (licencias SPDX como «BSD-2-Clause»). Filtrar por tipo.
- **Un JSDoc no puede contener `*/`** (ni dentro de un ejemplo de código): cierra el comentario.
- **No dar los comandos de commit con una pregunta abierta que pueda tocar los archivos:** F3.5 se commiteó antes
  de decidir F35-2 y su arreglo pasó al PR siguiente.
- **La sesión se reinició a mitad de un turno** y la #9 de las vivas quedó repetida (aclarado en la #10): tras un
  reinicio, releer el final de las vivas y el tablero antes de escribir.
- **Medir píxeles de la escena:** entrar por el ancla del capítulo (la escena arranca en su `m` exacto) y medir
  con `expect.poll`; el fondo, por el color dominante de una zona vacía contra el token leído en la página.
- **Método del contenedor:** Node 24 con `npm pack node-linux-x64@24.22.0`, `PLAYWRIGHT_BROWSERS_PATH` propio con
  enlaces `chromium*-1248 → -1243`, árbol por `tar` desde `_claude/cadena/tmp/` (con `.git`; sin `node_modules`,
  `build`, `_claude` ni `.env`, que se copia de `.env.example`) y vuelta con `tar --overwrite` tras comprobar el
  md5 de la base y después el de cada archivo. Un commit auxiliar en el contenedor hace saltar el aviso de push:
  dejar la copia en `main` y borrar la rama auxiliar (nunca push). Un archivo movido (`Particles.tsx`,
  `BackgroundStars.tsx`) se quita en el equipo con `git rm`, en los comandos del commit.

**Deuda anotada:**
- **Peso de la escena:** 248,4 KB de 250 (F3.4 248,0; corrección de AUD-F3-3 +155 B; F3.5 +290 B; AUD-F3-4
  +22 B). R3F importa Three.js entero: las constelaciones y el Sol de F4 apenas caben. Subir el límite, solo con
  ADR; antes, mirar qué más se puede ahorrar (sangría y líneas vacías del GLSL solo darían ~77 B y romperían las
  líneas de los errores).
- **e2e de Chromium:** ~6–7,5 min en el contenedor. SwiftShader pinta sin parar mientras la página está a la vista
  (la pausa de F3.5 solo actúa con la pestaña oculta o la misión rápida): mirar los tiempos del CI.
- **F4 · escena:** todo lo nuevo lee `SceneFrame.m` (la `m` suavizada de la escena), nunca `sceneStore.m`
  (ADR-028). Un módulo nuevo de `scene/` con Three, React o un store se añade a `IMPURE_SCENE_MODULES` de
  `eslint.config.js` (la lista es a mano).
- **F4 · gravedad:** las coordenadas del puntero son sobre la ventana, no sobre el lienzo: con una barra de scroll
  clásica, `uMouse` se desplaza ~1–2 % (lo apuntó la Mesa como descartado para F3.4).
- **F3.6 · encuadre:** la cámara usa las cifras del prototipo. En las capturas de F3.4, a 1280×720 y 1920×1080 la
  Tierra se corta un poco por la derecha, bajo el raíl, y la cabeza de la tortuga queda pegada a él; en móvil
  (390, 360) el campo de visión llega al tope de 100° (como el prototipo). Ajustar `CAMERA_KEYFRAMES` /
  `shiftX` con las capturas de regresión de F3.6.
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
**Siguiente paso (próxima sesión, conversación nueva):**
1. Arrancar con `session-start` (y la skill `taller`). Ofrecer la Mesa **AUD-F3-5** para F3.5 + la corrección de
   AUD-F3-4 (`base 2c248aa · hasta e6dfbf5`, PR #59 y #60), si Víctor quiere auditarlos.
2. **F3 · paso 6** (esquema → VB): primeras capturas de regresión visual (Docker), medición de fps y degradación
   en caliente de nivel (media de fps en ventanas de 2 s, medida en el `step` del bucle, ADR-027). Con la deuda de
   F3.6: encuadre (`CAMERA_KEYFRAMES` / `shiftX`), regenerar a media visita sin reintento (AUD-F3-2-3-B) y los
   ajustes del shader (AUD-F3-3-P5), medidos antes de tocar.

**Dudas abiertas:** D5 · analítica (F7). Tareas de Víctor: script de consola en el README de Chessmate (lo cita el
«Try it»), CV en PDF EN/ES.
**Limpieza manual del usuario:**
- Ramas locales ya fusionadas: `feat/f3-1-scene-mount`, `docs/session-close-2026-10-26-2`,
  `docs/session-close-2026-10-26-3`, `docs/session-close-2026-10-26-4`, `docs/session-close-2026-10-26-5`,
  `fix/aud-f3-1`, `feat/f3-2-shapes`, `chore/domain-tortoisecode`, `fix/aud-f3-2`, `feat/f3-3-layers`,
  `feat/f3-3-particles`, `chore/f33-6-glsl-comments`, `feat/f3-4-camera-rig`, `docs/session-close-2026-10-27`,
  `fix/aud-f3-3`, `feat/f3-5-smoothing-pause`, `fix/aud-f3-4`, y la de este cierre
  (`docs/session-close-2026-10-27-2`) cuando se fusione.
- En el buzón se puede borrar todo lo de `_claude/cadena/tmp/` (`arbol*.tar.gz`, `cambio*.tar.gz`, `*.md5`,
  `*.blobs`, `cierre-s*.tar.gz`, `s16-files.list`, `STATE-*.md`, `historial-*.md`) y, dentro de `_claude/cadena/hecho/`, los
  `arbol.tar.gz` y `cambio.diff` (nunca la carpeta `_claude/cadena/`).

**Bloqueos:** ninguno.
