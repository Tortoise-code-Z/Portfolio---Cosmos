# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** **F3 · paso 1 hecho** (`main` en `9b4ad1b`, PR #45) · la Mesa audita **AUD-F3-1** (lanzada, sin
entrega) · siguiente: **F3 · paso 2** (utilidades puras y generadores de las 4 formas en el worker).

_Última actualización: 2026-10-26 (**CIERRE DE SESIÓN · 19**) · Primer paso de F3: la escena se monta en diferido
en su propio chunk (lienzo aún vacío), con detección de WebGL2, niveles de rendimiento, `ErrorBoundary` propio y
modo sin WebGL con su aviso. 859 unitarios y 181 e2e en Chromium; CI en verde en los tres navegadores._

**Hecho esta sesión** (vivas S19 en `_claude/cadena/hecho/2026-10-26/decisiones-vivas-S19.md`):
1. **F3.1 · escena diferida** (PR #45, `9b4ad1b`; vivas #2–#12):
   - `vite.config.ts`: el grupo `framework` coge solo las dependencias importadas de forma estática desde una
     entrada (`tags: ['$initial']`) y un grupo `scene` coge el resto. Es más robusto que la regex prevista en
     ADR-020, que se habría dejado `react-reconciler`, `its-fine`… en el JS inicial (nota en ADR-020).
     Framework 108,9 KB; JS de la escena 241,6 KB de 250 (test nuevo en `budgets.spec.ts`).
   - `lib/device/sceneLevel` (tabla de niveles, `chooseInitialLevel` pura) y `lib/device/webgl2` (`hasWebGL2`).
   - `uiStore`: `sceneLevel` (`null` → nivel → `off` para el resto de la visita) y `languageNoticeOpen`.
   - `features/scene-mount`: `SceneMount` (en `root.tsx`, una vez; con el navegador libre decide; sin WebGL2 no
     descarga la escena) y `SceneErrorBoundary`. Sin WebGL: clase `no-gl` y aviso una vez por visita («Got it» /
     «Entendido», clave `noGl.dismiss`), que espera a que se conteste la sugerencia de idioma (F3.1-3-A, F3.1-4-A).
   - `scene/SceneRoot` (lienzo fijo, `aria-hidden`, sin puntero, DPR por nivel, `frameloop="demand"`, shader que
     no compila → sin WebGL) y `scene/contextLoss` (un intento de restaurar, 3 s).
   - ESLint: un `import()` de la escena o de Three fuera de `SceneMount` es error (`no-restricted-syntax`).
   - E2E `scene.spec.ts` y ayuda `settleScene` (descarta el aviso en los e2e que miden el scroll al pie).
   - Docs: arquitectura, rendimiento, calidad, estados, componentes, textos, roadmap y la nota de ADR-020.
2. Decidido (vivas #3, #4): la degradación en caliente pasa a **F3.6**; sin estudio de la Mesa para F3 por ahora.

**Incidencias y lecciones:**
- **R3F pone `pointer-events: auto` en línea a su envoltorio**: el lienzo, aunque transparente, tapaba los enlaces.
  Lo cazó el e2e; `SceneRoot` lo anula con `style`. Cualquier capa fija nueva: probar un clic «a través» de ella.
- **Simular un motor sin GPU** antes del CI: Chromium con `--disable-webgl --disable-webgl2 --disable-3d-apis`
  (config temporal de Playwright fuera del repo). Así salieron 3 e2e que el aviso movía. En el CI Firefox y WebKit
  pasaron, pero no sabemos si allí tienen WebGL2: los tests de `scene.spec.ts` con WebGL se omiten si no lo hay.
- **Un `fixed` vacío no es «visible» para Playwright**: la región `role="status"` mide 0×0; se busca el texto
  dentro (`getByRole('status').getByText(...)`).
- **`lib/scene/…` no vale como ruta**: el patrón de capas `**/scene/**` de ESLint la bloquearía.
- **Dev:** sin `optimizeDeps.include` de three/R3F, Vite los descubría tarde y la primera carga fallaba con
  «Outdated Optimize Dep» (vivas #13). Con la caché `.vite` vacía, zustand aún provoca una recarga (ya pasaba).
- Método del contenedor: igual que S18 (Node 22 con `--engine-strict=false`, enlaces `chromium*-1248 → -1243`,
  árbol por `tar`); para devolver archivos al equipo, `tar --overwrite` (sin permiso de borrar, `tar` normal falla).

**Deuda anotada:**
- **F3.2–F3.3 · peso de la escena:** 241,6 KB de 250 con el lienzo vacío (R3F importa Three.js entero). Si las
  formas y shaders lo pasan, decidir (subir el límite con ADR, importar menos de Three…) antes de tocar el número.
- **F3.3:** antes de pintar partículas, `--z-content` en el contenido de los capítulos (hoy solo el hero) y los
  estilos que cuelgan de `no-gl` (fondo, relevo del punto del hero); hoy la clase solo marca (vivas #7, #11).
- **R3F 9.8.1 + three 0.186:** `console.warn` «THREE.Clock: This module has been deprecated» al montar el lienzo.
  Se va cuando R3F use `THREE.Timer`: mirarlo al subir R3F (vivas #14).
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
- Contraste AA sobre el velo de los paneles (`--color-veil`) encima de la escena: F3–F4 (ADR-015).
- La lista de valores neutros del test de colores obliga a ampliarla con un valor legítimo nuevo (a propósito).
- `@lhci/cli` y los scripts `visual` / `lhci` se instalan en F3/F6.
- **F7:** que `/es/*` reciba la 404 ES y que las 404 salgan con estado 404 real en Vercel (en `preview` salen con
  200); comprobar el `X-Robots-Tag: noindex` de las previews; **`cleanUrls: true`** en `vercel.json`.
- Provisional: `favicon.svg` (F6).
- **React Router 8.4 no pasa `caseSensitive` a las rutas del cliente:** lo cubre `isLowerCasePathname`. Al
  actualizar React Router, comprobar si ya lo pasa.
- Si alguna ruta lanza un 404 desde un `loader` (`throw data(null, { status: 404 })`), choca con
  `@typescript-eslint/only-throw-error`: configurar el `allow` de la regla. Hoy ninguna lo hace.
- **F3.5:** la escena deja de pintar con `quickMissionOpen` de `uiStore` y suaviza `m`; hasta entonces
  `setScrollTarget` escribe `m = mTarget` (ADR-021 → Consecuencias). Hoy pinta bajo demanda (un frame).

**Siguiente paso (próxima sesión, conversación nueva):**
1. Arrancar con `session-start` (y la skill `taller`). Si ha llegado la entrega de **AUD-F3-1**
   (`_claude/cadena/aud-f3-1/auditoria.md`, sello «vivas S19 hasta #16»), decidir con Víctor qué se corrige; va en
   su propio commit.
2. **F3 · paso 2** (esquema → VB): utilidades puras (PRNG con semilla, ruido, hex) y generadores de las 4 formas en
   el worker, con sus tests (`docs/04-escena/formas.md`, `particulas-y-shaders.md`, `rendimiento.md` → worker y
   reintento en el hilo principal). Cobertura 90 % en `src/scene/{shapes,math,config}`. Ojo al presupuesto de la
   escena (241,6 de 250 KB).

**Dudas abiertas:** D2 · dominio propio (F7) · D5 · analítica (F7). Tareas de Víctor: script de consola en el
README de Chessmate (lo cita el «Try it»), CV en PDF EN/ES.
**Limpieza manual del usuario:**
- Ramas locales: `feat/f3-1-scene-mount` y `docs/session-close-2026-10-26-2` (ya fusionadas) y la de este cierre
  (`docs/session-close-2026-10-26-3`) cuando se fusione.
- En el buzón se puede borrar todo lo de `_claude/cadena/tmp/` (`arbol*.tar.gz`, `cambio-s19-f3-1.tar.gz`,
  `*.blobs`, `cierre-s*.tar.gz`, `s16-files.list`, `STATE-s16.md`, `STATE-cierre-s12.md`) y, dentro de
  `_claude/cadena/hecho/`, los `arbol.tar.gz` y `cambio.diff` (nunca la carpeta `_claude/cadena/`).

**Bloqueos:** ninguno.
