# Estado del proyecto

> **Solo la foto actual** (último cierre). Los cierres anteriores están en `docs/_historial/estado/`
> (un archivo por mes, lo más nuevo arriba).

**Dónde estamos:** **F2 cerrada** y CI rehecho (`main` en `721bb1d`, PR #41–#43) · la cadena no tiene encargos
abiertos · siguiente: **F3 · paso 1** (`SceneMount` diferido, WebGL2, niveles y `ErrorBoundary`).

_Última actualización: 2026-10-26 (**CIERRE DE SESIÓN · 18**) · Sesión de mantenimiento antes de F3: los e2e del
CI corren en la imagen de Playwright, un job por navegador (ADR-024), y eso destapó un salto real de la ficha a
390 px (cambio de la fuente mono), ya corregido. 813 unitarios y 173 e2e en Chromium; CI en verde en los tres
navegadores._

**Hecho esta sesión** (vivas S18 en `_claude/cadena/hecho/2026-10-26/decisiones-vivas-S18.md`):
1. **CI de e2e rehecho** (PR #42, `a9dbd3b`; vivas #1–#4; ADR-024): los e2e se colgaban instalando los tres
   navegadores. Ahora corren en `mcr.microsoft.com/playwright:v1.64.0-noble` (`--user 1001`), un job por navegador
   en paralelo (`fail-fast: false`) y un job `E2E (Chromium · Firefox · WebKit)` que los resume con el nombre de
   siempre (la protección de `main` no cambia). En el CI: 1 reintento y `globalTimeout` de 10 min. Script nuevo
   `npm run e2e:chromium` (DEVELOPMENT_RULES §13: el que se pasa en local al tocar interfaz). Chromium tarda
   ~1,2 min de tests. Docs: `git-y-despliegue.md`, `stack.md`, `calidad.md`.
2. **El test de CLS dice qué se mueve** (dentro del squash de #42; CLS-1-A): «slow images…» de
   `project-images.spec.ts` guarda cada desplazamiento (elemento, momento y píxeles) y lo escribe si falla.
3. **Salto de la ficha a 390 px corregido** (PR #43, `7fa64e7`; CLS-2-A, CLS-3-A): la reserva monoespaciada del CI
   y de Windows (Consolas) es más estrecha que IBM Plex Mono; los metadatos («2024 · … · Personal project») cabían
   en una línea hasta que llegaba Plex (~90 ms, sin precarga), saltaban a la siguiente y todo bajaba 15 px
   (CLS 0,105 en el CI, 0,119 en Windows). `--font-mono` pone delante `'Courier New', 'Liberation Mono',
   'DejaVu Sans Mono'` (0,6 em como Plex); el porqué, en `design-system.md` → «Tipografía».
4. **Cierre de la sesión 17 fusionado** (PR #41, `721bb1d`) tras «Update branch», en el orden #43 → #42 → #41.
5. **Dudas de Víctor** en `_claude/dudas/`: por qué se atascaba el CI y los comandos uno a uno
   (`2026-10-26-ci-e2e-por-navegador.md`) y varias ramas a la vez con «Update branch»
   (`2026-10-26-ramas-y-update-branch.md`).

**Incidencias y lecciones:**
- **Los e2e en local prueban `build/`**: sin `npm run build` antes, prueban una versión vieja. El 26-10 dieron 121
  fallos falsos con un build del 23-10 (sin imágenes, texto viejo de Cosmos).
- **Un CLS idéntico entre repeticiones** (0,11923… en Windows, 0,10503… en el CI) es un salto concreto que a veces
  ocurre (una carrera), no lentitud: hay que ver qué elemento se mueve, no subir el límite.
- **La fuente de reserva cambia con la máquina**: en el contenedor de Claude la mono genérica es DejaVu Sans Mono
  (mismo ancho que Plex) y el fallo no salía (20/20 verdes). Se reprodujo con `FONTCONFIG_FILE` apuntando a un
  `fonts.conf` que manda `monospace` a una fuente estrecha (DejaVu Sans Condensed): 6/6 fallos idénticos al CI.
- **El CI de un PR usa el `ci.yml` de su mezcla con `main`**: relanzar no basta para coger una receta nueva; hace
  falta «Update branch» (lo mismo para la regla «rama al día»).
- **Squash por PR**: el commit del test (CLS-1-A) fue dentro de «ci: …» (#42) por ir en la misma rama. Aceptado;
  lo siguiente que no sea del CI, en su rama.
- Método del contenedor esta vez: Node 22 del contenedor con `npm ci --engine-strict=false` (sin bajar Node 24),
  enlaces `chromium*-1248 → -1243`, árbol por `tar` desde `_claude/cadena/tmp/` y build con `VITE_SITE_URL`.

**Deuda anotada:**
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
- **F3:** la escena deja de pintar con `quickMissionOpen` de `uiStore` (roadmap F3.5); la escena suaviza `m`; hasta
  entonces `setScrollTarget` escribe `m = mTarget` (ADR-021 → Consecuencias).
- **F3.1:** el `test` del grupo `framework` de `vite.config.ts` es todo `node_modules`: excluir `three` y
  `@react-three/*` antes de importar la escena en diferido (ADR-020 → Consecuencias; roadmap F3.1).
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

**Siguiente paso (próxima sesión, conversación nueva):**
1. Arrancar con `session-start` (y la skill `taller`). Fijar en el tablero las **zonas calientes de F3**.
2. **F3 · paso 1** (esquema → VB): `SceneMount` diferido, detección de WebGL2, niveles de rendimiento y
   `ErrorBoundary` de escena; antes, sacar `three` y `@react-three/*` del grupo `framework` de `vite.config.ts`
   (ADR-020, roadmap F3.1). Docs: `docs/04-escena/` (rendimiento) y `docs/05-tecnico/arquitectura.md`.
3. Valorar con Víctor un estudio de la Mesa para F3 (reglas de la escena: rendimiento, determinismo, cero
   asignaciones por frame).

**Dudas abiertas:** D2 · dominio propio (F7) · D5 · analítica (F7). Tareas de Víctor: script de consola en el
README de Chessmate (lo cita el «Try it»), CV en PDF EN/ES.
**Limpieza manual del usuario:**
- Ramas locales: ya no queda ninguna salvo `main`; la de este cierre (`docs/session-close-2026-10-26-2`) cuando se
  fusione.
- En el buzón se pueden borrar todo lo de `_claude/cadena/tmp/` (`arbol*.tar.gz`, `*.blobs`, `cierre-s13.tar.gz`,
  `cierre-s15.tar.gz`, `s16-files.list`, `STATE-s16.md`, `STATE-cierre-s12.md`) y, dentro de
  `_claude/cadena/hecho/`, los `arbol.tar.gz` y `cambio.diff` (nunca la carpeta `_claude/cadena/`).

**Bloqueos:** ninguno.
