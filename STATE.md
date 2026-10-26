# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** **F3 · paso 3 hecho** (`main` en `7a56e41`: AUD-F3-2 corregida en PR #51, F3.3 en PR #52 y
#53) · **AUD-F3-3** preparada para la Mesa (los dos PR de F3.3, base `3f3ff07` · hasta `7a56e41`), sin lanzar ·
siguiente: lanzarla, decidir F33-6 (peso) y **F3 · paso 4** (`CameraRig`).

_Última actualización: 2026-10-26 (**CIERRE DE SESIÓN · 21**) · AUD-F3-2 corregida y la escena pinta: partículas
con el shader de morph entre las 5 formas, estrellas de fondo y un bucle de frames propio. 1034 unitarios y 191 e2e
en Chromium; los tres PR fusionados con el check obligatorio del CI._

**Hecho esta sesión** (vivas S21 en `_claude/cadena/hecho/2026-10-26/decisiones-vivas-S21.md`):
1. **AUD-F3-2 corregida** (PR #51, `3f3ff07`; vivas #1–#6): tests que ahora pueden fallar (la Tierra agota sus
   intentos y cuenta el azar; huellas con 1.000 partículas, con ojos y cola; bulbo 7–9 %; partes de la tortuga
   > 0 y cajas completas; `terminate` contado; otro `count` → otras formas y cancelación; `mockReset` de
   `SceneRoot`; el e2e normal no descarga los generadores y el del reintento sí), `obtainShapes` devuelve
   `'aborted'` sin `console.error` si se desmonta mientras falla el reintento, tiempo como mejor de 3 vueltas,
   ESLint de la capa pura (sin `import()`, sin datos de `content` salvo en tests, `react/**`,
   `globalThis.Math.random`) y cinco docs. Comprobado rompiendo cada guarda a propósito.
2. **F3.3 · PR 1** (PR #52, `d56399d`; vivas #7–#15): el `main` de cada página en `--z-content` (por encima del
   lienzo) y, sin WebGL, un fondo estático del espacio (`--gradient-space`).
3. **F3.3 · PR 2** (PR #53, `7a56e41`; vivas #16–#21): `Particles` (un `Points`, morph de la forma actual a la
   siguiente, animaciones de cada forma, luz de la Tierra; carga, placa y gravedad a 0 hasta F4), `BackgroundStars`,
   cabecera GLSL generada desde TS (etiquetas del contrato, que pasan a `shapeContract`, y la paleta, contrastada
   con la tabla del design system), Bajo sin estela ni luces de ciudad, movimiento reducido que congela el reloj,
   **bucle de frames propio** (ADR-027: `frameloop="never"`, `advance()` en un `try`, `frame-error`), lienzo opaco
   sin gestión de color, cámara fija provisional y el relevo del punto del hero (`scene-on`: el punto se funde, el
   halo se queda, como el prototipo).

**Incidencias y lecciones:**
- **El relevo del hero:** fundir el punto y el halo dejaba el hero en un puntito de 2 px. El prototipo mantiene el
  halo CSS por encima del lienzo (su `core-glow`): con escena solo cede el punto (viva #17).
- **La regla de estructura (ADR-018) cuenta el nombre antes del primer punto:** `particles.vert.glsl` y
  `particles.frag.glsl` son el mismo nombre y van en su carpeta (`shaders/particles/`). Un componente sin test
  (`Particles.tsx`) no puede ir solo en `Particles/`: va suelto.
- **Las etiquetas no pueden salir de los generadores:** importar `TURTLE_TAG` de `turtle.ts` en la escena metería
  el generador en el chunk (como ADR-026); van en `shapeContract`.
- **`no-unnecessary-condition` y los cierres:** TS no ve que una función llamada dentro del frame pare el bucle; se
  pide el frame siguiente antes del `step` y la parada lo cancela.
- **`pkill -f` en el contenedor** mata la propia shell si el patrón aparece en el comando: usar `pgrep` y excluir
  `$$`. `vite preview`/`react-router dev` con `waitUntil: 'networkidle'` no acaba en dev (HMR): usar `load`.
- **Método del contenedor** (sin cambios): Node 24 con `npm pack node-linux-x64@24.22.0`,
  `PLAYWRIGHT_BROWSERS_PATH` propio con enlaces `chromium*-1248 → -1243`, árbol por `tar` desde
  `_claude/cadena/tmp/` y vuelta con `tar --overwrite` tras comprobar el md5 de la base y después el de cada
  archivo. Capturas de los capítulos con `vite preview` y Playwright para enseñarlas.

**Deuda anotada:**
- **Peso de la escena (F33-6, sin decidir):** 247,3 KB de 250 con las partículas, sus shaders y las estrellas
  (+5,7 KB; R3F importa Three.js entero). Opción a mano: quitar los comentarios del GLSL al compilar (un plugin en
  `vite.config.ts`, ~−1,4 KB). Decidirlo antes o durante F3.4 (cámara) y F4 (constelaciones); subir el límite,
  solo con ADR.
- **F3.4 · cámara:** hoy fija en el keyframe 0 (`PROVISIONAL_CAMERA_POSITION` en `sceneConfig`): la galaxia se ve
  de canto. `CameraRig` sustituye la `camera` del `<Canvas>`.
- **F3.5 · pausa:** la escena pinta continua (ADR-027) hasta la pausa; la pausa es no pedir el frame siguiente en
  `scene/frameLoop`. Desde F3.3 los e2e de Chromium pasan de ~4,5 a ~6,7 min (SwiftShader pinta sin parar):
  mirar los tiempos del CI.
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
- Contraste AA sobre el velo de los paneles (`--color-veil`) encima de la escena: ya hay partículas detrás de los
  paneles; medirlo con la cámara de F3.4 y en F4 (ADR-015).
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
1. Arrancar con `session-start` (y la skill `taller`). Si Víctor no la ha lanzado aún, lanzar **AUD-F3-3** en un
   chat nuevo (mensaje listo en la cola del tablero, punto 1); cuando llegue, decidir y corregir en `fix/aud-f3-3`.
2. Decidir **F33-6** (peso de la escena: dejarlo o quitar comentarios del GLSL al compilar).
3. **F3 · paso 4** (esquema → VB): `CameraRig` con los keyframes, encuadre por capítulo, FOV de móvil y paralaje
   (`docs/04-escena/camara-y-encuadre.md`), sustituyendo la cámara provisional. Ojo al presupuesto (2,7 KB libres).

**Dudas abiertas:** F33-6 (peso de la escena) · D5 · analítica (F7). Tareas de Víctor: script de consola en el
README de Chessmate (lo cita el «Try it»), CV en PDF EN/ES.
**Limpieza manual del usuario:**
- Ramas locales ya fusionadas: `feat/f3-1-scene-mount`, `docs/session-close-2026-10-26-2`,
  `docs/session-close-2026-10-26-3`, `docs/session-close-2026-10-26-4`, `fix/aud-f3-1`, `feat/f3-2-shapes`,
  `chore/domain-tortoisecode`, `fix/aud-f3-2`, `feat/f3-3-layers`, `feat/f3-3-particles`, y la de este cierre
  (`docs/session-close-2026-10-26-5`) cuando se fusione.
- En el buzón se puede borrar todo lo de `_claude/cadena/tmp/` (`arbol*.tar.gz`, `cambio*.tar.gz`, `*.md5`,
  `*.blobs`, `cierre-s*.tar.gz`, `s16-files.list`, `STATE-*.md`) y, dentro de `_claude/cadena/hecho/`, los
  `arbol.tar.gz` y `cambio.diff` (nunca la carpeta `_claude/cadena/`).

**Bloqueos:** ninguno.
